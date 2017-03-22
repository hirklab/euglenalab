import socketIO from 'socket.io';
import _ from 'lodash';
import async from 'async';
import logger from './logging';
import BPU from './bpu';

import {
	EXPERIMENT_STATUS,
	PROFILERS,
	GROUPS,
	BPU_STATUS,
	ROUTES
} from './constants';


class BPUManager {
	constructor(config, db, experimentManager) {
		this.logName = 'BPUManager';
		this.db = db;
		this.config = config;
		this.bpuList = {};
		this.experimentManager = experimentManager;
		this.startDate = new Date();
		this.queueTimePerBPU = {};
	}

	sync(clientManager, callback) {
		this.clientManager = clientManager;

		async.waterfall([
			(callback) => {
				logger.debug('fetching BPUs...');

				this.fetchBPUs(callback);
			},
			(callback) => {
				logger.debug('verifying BPUs...');

				this.verifyAll(callback);
			}

		], (err, result) => {
			if (err) {
				logger.error(err);
				return callback(null);
			} else {

				return callback(null);
			}
		});
	}

	getRawBPUs() {
		return _.map(this.bpuList, (bpu) => {
			return bpu.doc.toJSON();
		});
	}

	getAllBPUs() {
		return this.bpuList;
	}

	fetchBPUs(callback) {
		this.db.getBpus((err, bpuList) => {
			if (err) {
				logger.error(err);
				return callback(err);
			} else {

				bpuList.forEach((bpu) => {
					if (this.bpuList[bpu.name]) {
						this.bpuList[bpu.name].updateDoc(bpu);
					} else {
						let bpuConfig = {
							name: bpu.name,
							doc: bpu,
							socket: null,
							socketTimeouts: 0,
							queueTime: 0,
							messages: [],
							connected: false,
						};

						this.bpuList[bpu.name] = new BPU(bpuConfig, this.config, this.db);
					}

				});

				return callback(null);
			}
		});
	}

	verifyAll(callback) {
		let workflow = [];

		let keys = Object.keys(this.bpuList);

		keys.forEach((key) => {
			// this.bpuList[key].connected = false;

			workflow.push((callback) => {
				this.bpuList[key].verify(callback);
			});
		});

		async.parallel(workflow, (err) => {
			if (err) {
				logger.error(err);
				return callback(null);
			}

			return callback(null);
		});
	}

	getBPUScores(groups, bpuName) {
		let scores = [];
		let queueTimes = this.experimentManager.getQueueTimes();

		Object.keys(this.bpuList).forEach((key) => {
			let bpu = this.bpuList[key];
			let bpuQueueTimes = queueTimes;
			let queueTime = bpuQueueTimes[key];

			if (bpu.connected) {

				// find groups which are allowed to execute experiments on this BPU
				let commonGroups = _.intersection(bpu.doc.allowedGroups, groups);
				commonGroups.forEach((group) => {

					//Score Bpu
					let score = bpu.doc.scoreBpu(queueTime);
					score.bpuName = bpu.doc.name;
					score.totalWaitTime = queueTime;

					// add possible BPUs where experiment can execute
					if (bpuName !== null) {
						if (bpu.doc.name === bpuName) {

							// if user already chose a BPU, only add that one for execution
							//logger.debug(score);
							scores.push(score);
						}
					} else {
						//logger.debug(score);
						scores.push(score);
					}
				});
			}
		});

		return scores;
	}

	// addQueueTime(bpuName, queueTime) {
	// 	Object.keys(this.bpuList).forEach((key) => {
	// 		let bpu = this.bpuList[key];

	// 		if (bpu.name == bpuName) {
	// 			bpu.queueTime += queueTime;
	// 		}
	// 	});

	// 	return this.bpuList;
	// }

	isBPUReady(bpuName) {
		return this.bpuList[bpuName].doc.bpuStatus === BPU_STATUS.READY;
	}

	addExperiment(bpuName, experiment, callback) {
		let bpu = this.bpuList[bpuName];

		async.waterfall([
			(cb) => {
				if (bpu.socket === null || bpu.socket === undefined) {
					return cb('bpu socket is missing');
				}
				return cb(null);
			},
			(cb) => {
				experiment.exp_metaData.magnification = bpu.magnification;
				logger.debug('events to run', experiment.exp_eventsToRun);

				bpu.socket.emit(ROUTES.BPU.ADD_EXPERIMENT, experiment, this.config.userConfirmationTimeout, (err, status) => {
					if (err) {
					  logger.error(err);
						return cb(null);
					} else {
						return cb(null);
					}
				});
			},
			(cb) => {
				//Save Exp
				let updateExperiment = {
					liveBpu: {
						id: bpu.doc._id,
						name: bpu.doc.name,
						index: bpu.doc.index,
						socketId: bpu.socket.id,
					},
					exp_lastResort: experiment.exp_lastResort,
					bc_startSendTime: experiment.bc_startSendTime,
					bc_isLiveSendingToLab: true,
					exp_status: EXPERIMENT_STATUS.SERVING,
					exp_metaData: experiment.exp_metaData,
				};

				this.db.updateBPUExperiment(experiment.id, updateExperiment, {
					new: true
				}, cb);
			},
			(updatedExperiment, cb) => {
				if (updatedExperiment === null) {
					logger.error('updated Experiment is null');
					return cb('updated Experiment is null');
				} else {

					return cb(null, updatedExperiment);
				}
			}
		], (err, updatedExperiment) => {
			if (err) {
				return callback(err);
			} else {
				callback(null, updatedExperiment);
			}
		});
	}

	activeExperiment(bpuName, session, callback) {
		let bpu = this.bpuList[bpuName];

		logger.info("session before passing to user for confirmation");
		logger.info(session);

		async.waterfall([
			(cb) => {
				this.clientManager.getUserConfirmation(session, cb);
			},
			(confirmed, client, cb) => {
				if (confirmed) {
					//todo
					// app.bpuLedsSetMatch[session.sessionID] = app.bpuLedsSetFuncs[bpu.name];

					bpu.socket.emit(ROUTES.BPU.RUN_EXPERIMENT, (result) => {
						if (result.err) {
							logger.error(err);
							return cb(false);
						} else {
							return this.clientManager.startExperiment(client, session, cb);
						}
					});
				} else {
					return cb(confirmed);
				}
			}
		], (confirmed) => {
			if (!confirmed) {
				logger.warn(`[${bpuName}] experiment ignored`);

				bpu.socket.emit(ROUTES.BPU.RESET, !confirmed, session.sessionID, (err) => {
					return callback(err, session);
				});
			} else {
				return callback(null, session);
			}
		});
	}

	passiveExperiment(bpuName, session, callback) {
		let bpu = this.bpuList[bpuName];
		let socket = bpu.socket;

		//todo
		//if any error here , change callback then
		socket.emit(ROUTES.BPU.RUN_EXPERIMENT, (updatedBPU) => {
			//todo check what changed in updatedBPU and update same in bpu here

			bpu.doc.session.id = session.id;
			bpu.doc.session.sessionID = session.sessionID;
			bpu.doc.session.socketID = session.socketID;

			return callback(updatedBPU.err, session);
		});
	}
}

export default BPUManager;
