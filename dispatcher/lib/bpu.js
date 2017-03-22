import socketIO from 'socket.io';
import _ from 'lodash';
import async from 'async';
import client from 'socket.io-client';
import logger from './logging';

import {
	EXPERIMENT_STATUS,
	PROFILERS,
	GROUPS,
	BPU_STATUS,
	BPU_STATUS_DISPLAY,
	ROUTES
} from './constants';

function log(logger, bpu, message) {
	logger.info(`[${this.doc.name}] ${message}`);
}

class BPU {
	constructor(bpuConfig, config, db) {
		this.config = config;
		this.db = db;
		this.startDate = new Date();

		_.forOwn(bpuConfig, (value, key) => {
			this[key] = value;

			// sets these properties for now
			// name: bpu.name,
			// doc: bpu,
			// socket: null,
			// socketTimeouts: 0,
			// queueTime: 0,
			// messages: [],
			// connected: false,
		});
	}

	updateDoc(doc) {
		this.doc = doc;
	}

	verify(callback) {
		async.waterfall([
			(callback) => {
				logger.debug(`[${this.doc.name}] connecting...`);

				this.connect(callback);
			},
			// (callback) => {
			// 	if (!this.socket.connected) {
			// 		this.doc.bpuStatus = BPU_STATUS.OFFLINE;

			// 		logger.error(`[${this.doc.name}] offline`);
			// 		return callback('socket not connected');
			// 	}

			// 	return callback(null);
			// },
			(callback) => {
				logger.debug(`[${this.doc.name}] checking status...`);

				this.socket.emit(ROUTES.BPU.GET_STATUS, (bpuStatus) => {
					if (bpuStatus == null) {
						logger.error(`[${this.doc.name}] failed to fetch status`);
						return callback('failed to fetch status');
					} else {

						logger.info(`[${this.doc.name}] status: ${BPU_STATUS_DISPLAY[bpuStatus.bpuStatus]}`);

						this.connected = true;
						this.socketTimeouts = 0;
						this.queueTime = 0;
						this.status = bpuStatus;
						this.doc.bpuStatus = bpuStatus.bpuStatus;

						return callback(null);
					}
				});
			},
			(callback) => {
				// any active experiments?
				logger.debug(`[${this.doc.name}] checking for running experiments`);

				if (this.status.exp !== null && this.status.exp !== undefined) {
					let isExperimentPending = (this.status.expOverId !== null && this.status.expOverId !== undefined);

					this.doc.liveBpuExperiment.id = this.status.exp._id;
					this.doc.liveBpuExperiment.group_experimentType = this.status.exp.group_experimentType;
					this.doc.liveBpuExperiment.bc_timeLeft = this.status.expTimeLeft;
					this.doc.liveBpuExperiment.username = this.status.exp.user.name;
					this.doc.liveBpuExperiment.sessionID = this.status.exp.session.sessionID;
					this.queueTime = this.doc.liveBpuExperiment.bc_timeLeft; // current experiment also included in queueTime

          //todo check if we need to delete this or not
					if (this.doc.bpuStatus !== BPU_STATUS.IN_PROGRESS && this.doc.bpuStatus !== BPU_STATUS.IN_QUEUE && this.hasOwnProperty('setLEDs')) {
						delete this.setLEDs;
					}

					logger.info(`[${this.doc.name}] experiment in progress`);
				} else {
					// no experiment in progress
					this.doc.liveBpuExperiment.id = null;
					this.doc.liveBpuExperiment.group_experimentType = 'text';
					this.doc.liveBpuExperiment.bc_timeLeft = 0;
					this.doc.liveBpuExperiment.sessionID = null;
					this.doc.liveBpuExperiment.username = null;

					logger.debug(`[${this.doc.name}] no experiment in progress`);
				}

				return callback(null);
			},
			(callback) => {
				logger.debug(`[${this.doc.name}] removing any stalled experiments...`);

				this.clear(callback);
			},
			(callback) => {
				if (this.config.profiling) {
					logger.debug(`[${this.doc.name}] profiler is ON`);

					// create profiler
					let profiler = [];
					profiler.push({
						name: PROFILERS.POPULATION,
						age: this.startDate.getTime() - this.doc.performanceScores.scripterPopulationDate,
						msg: 'Population: ' + this.doc.performanceScores.scripterPopulation
					});
					profiler.push({
						name: PROFILERS.ACTIVITY,
						age: this.startDate.getTime() - this.doc.performanceScores.scripterActivityDate,
						msg: 'Activity: ' + this.doc.performanceScores.scripterActivity
					});
					profiler.push({
						name: PROFILERS.RESPONSE,
						age: this.startDate.getTime() - this.doc.performanceScores.scripterResponseDate,
						msg: 'Response: ' + this.doc.performanceScores.scripterResponse
					});

					profiler.sort((objA, objB) => {
						return objA.age - objB.age;
					});

					return callback(null, profiler);
				} else {
					return callback(null, []);
				}
			},
			(profiler, callback) => {
				// run profiler experiments
				if (this.config.profiling) {
					logger.debug(`[${this.doc.name}] adding profiler experiments...`);

					// milliseconds
					let lastProfilingTime = this.startDate.getTime() - this.doc.performanceScores.bc_lastSendDate;
					let nextProfilingTime = this.config.profilingInterval - profiler[profiler.length - 1].age;

					if (nextProfilingTime < 0 && lastProfilingTime > this.config.profilingInterval) {

						this.db.submitProfilingExperiment(this, {
								name: this.doc.name
							}, {
								name: profiler[profiler.length - 1].name,
								groups: [GROUPS.PROFILER]
							}, this.startDate,
							(err) => {
								if (err) {
                  logger.error(`[${this.doc.name}] ${err}`);
									return callback(err);
								} else {
									logger.debug(`[${this.doc.name}] profiler experiment added for ${profiler[profiler.length - 1].name}...`);
									return callback(null);
								}
							});
					}
				} else {
					return callback(null);
				}
			}
		], (err) => {
			if (err) {
				logger.error(`[${this.doc.name}] ${err}`);
				return callback(err);
			}

			return callback(null);
		});
	}

	connect(callback) {
		if (this.socket === null) {
			let bpuAddr = 'http://' + this.doc.localAddr.ip + ':' + this.doc.localAddr.serverPort;

			this.socket = client(bpuAddr, {
				multiplex: false,
				reconnection: true
			});

			this.socket.on(ROUTES.DISPATCHER.CONNECT, () => {
				this.setLEDs = (ledData) => {
					this.socket.emit(ROUTES.BPU.SET_LEDS, ledData);
				};

				logger.info(`[${this.doc.name}] connected @${this.socket.id}`);

				return callback(null);
			});

			this.socket.on(ROUTES.DISPATCHER.DISCONNECT, () => {
				this.disconnect(() => {
					this.doc.bpuStatus = BPU_STATUS.OFFLINE;
					logger.warn(`[${this.doc.name}] went offline`);
				});
			});
		} else {
			if (this.socketTimeouts > this.config.socketTimeout) {
				this.disconnect(() => {
					this.doc.bpuStatus = BPU_STATUS.OFFLINE;
					logger.warn(`[${this.doc.name}] seems offline`);
					return callback(null);
				})
			} else {
				if (!this.socket.connected) {
					this.doc.bpuStatus = BPU_STATUS.OFFLINE;

					logger.error(`[${this.doc.name}] offline`);
					return callback(null);
				} else {
					return callback(null);
				}
			}
		}
	}

	disconnect(callback) {
		this.socket.disconnect();
		this.socket.close();

		this.socketTimeouts = 0;
		this.socket = null;
		this.setLeds = null;

		delete this.socket;

		return callback(null);
	}

	// check if experiment stalled? yes -> clear experiment
	clear(callback) {
		if (this.status.expOverId !== null && this.status.expOverId !== undefined) {
			if (this.doc.bpuStatus === BPU_STATUS.PROCESSING_OVER) {

				let updateObj = {
					exp_serverClearTime: new Date().getTime(),
					exp_status: EXPERIMENT_STATUS.FINISHED,
				};

				db.updateBPUExperiment(this.status.expOverId, updateObj, {},(err, experiment) => {
					if (err) {
						return callback(err);
					}

					return callback(null);
				});
			} else {
				logger.info(`[${bpu.doc.name}] experiment ${bpu.status.expOverId } over`);
				logger.info(`[${bpu.doc.name}] Expected status = ${BPU_STATUS.PROCESSING_OVER}, Current status = ${this.doc.bpuStatus}`);

				return callback(`clear BPU failed for ${this.doc.name}`);
			}
		} else {
			return callback(null);
		}
	}
}

export default BPU;
