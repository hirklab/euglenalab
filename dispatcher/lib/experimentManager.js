import _ from 'lodash';
import async from 'async';
import mongoose from 'mongoose';
import logger from './logging';

import {
	EXPERIMENT_STATUS,
	PROFILERS,
	GROUPS,
	BPU_STATUS,
	ROUTES
} from './constants';

class ExperimentManager {
	constructor(config, db) {
		this.logName = 'ExperimentManager';
		this.config = config;
		this.db = db;

		// seems redundant
		this.queues = {};

		this.newExperiments = {};
		this.profilerExperiments = {};

		// list of experiments to run after processing new expriments and profiler experiments
		this.scheduledExperiments = [];

		//final list which is created from scheduledExperiments - taking 10 experiments at a time
		this.experiments = [];
		this.queueTimePerBPU = {};

		this.startDate = new Date();
	}

	sync(bpuManager, callback) {
		this.bpuManager = bpuManager;

		// reinitialize this queue
		this.experiments = [];
		this.queueTimePerBPU = {};

		let BPUs = this.bpuManager.getAllBPUs();

		//get queue times of all BPUs
		Object.keys(BPUs).forEach((key) => {
			let bpu = BPUs[key];
			//Set Queue Time
			if (this.queueTimePerBPU[bpu.doc.name] === null || this.queueTimePerBPU[bpu.doc.name] === undefined) {
				if (bpu.doc.liveBpuExperiment) {
					this.queueTimePerBPU[bpu.doc.name] = bpu.doc.liveBpuExperiment.bc_timeLeft;
				} else {
					this.queueTimePerBPU[bpu.doc.name] = 0;
				}
			}
		});

		async.waterfall([

			(cb) => {
				logger.debug(`[${this.logName}] scheduling Experiments...`);

				this.scheduleExperiments(cb);
			},
			(cb) => {
				logger.debug(`[${this.logName}] executing Experiments...`);

				this.executeExperiments(cb);
			},
			(cb) => {
				logger.debug(`[${this.logName}] updating Experiments...`);

				this.updateExperiments(cb)
			}
		], (err) => {
			if (err) {
				logger.error(err);
				return callback(err);
			} else {
				return callback(null);
			}
		});
	}

	getRawQueues() {
		return this.queues.toJSON();
	}

	getQueueTimes() {
		return this.queueTimePerBPU;
	}

	getExperimentQueues(callback) {
		this.db.getExperimentQueues((err, queues) => {
			if (err) {
				logger.error(err);
				return callback(err);
			} else {
				this.queues = queues;
				return callback(null, this.queues);
			}
		});
	}

	scheduleExperiments(callback) {
		async.waterfall([
			(cb) => {
				logger.debug(`[${this.logName}] fetching new experiments...`);
				this.db.getNewExperiments(cb);
			},
			(queueDoc, cb) => {
				logger.debug(`[${this.logName}] processing experiments...`);
				this.processQueues(queueDoc, cb);
			}
		], (err) => {
			if (err) {
				logger.error(err);
				return callback(err);
			}

			return callback(null);
		});
	}

	executeExperiments(callback) {
		this.experiments.sort((objA, objB) => {
			return objA.exp_submissionTime - objB.exp_submissionTime;
		});

		let bpuQueues = _.groupBy(this.experiments, 'exp_lastResort.bpuName');
		logger.info("**** bpu queues *****");
		logger.info(bpuQueues);

		let experimentQueue = [];
		Object.keys(bpuQueues).forEach((bpuName) => {
			// BPU has experiments to execute?
			if (bpuQueues[bpuName] && bpuQueues[bpuName].length > 0) {
				logger.debug(`[${this.logName}] ${bpuName} has experiments to execute`);
				let topExperiment = bpuQueues[bpuName][0];

				// is BPU ready to run experiment?
				if (this.bpuManager.isBPUReady(bpuName)) {
					_.remove(this.experiments, {
						id: topExperiment.id
					});

					logger.debug(`[${this.logName}] ${bpuName} is ready`);
					experimentQueue.push((cb) => {

						//push 1st experiment in queue for the BPU
						logger.debug(`[${this.logName}] pushing experiment to ${bpuName}`);
						this.pushExperimentToBPU(topExperiment, bpuName, (err, session) => {
							if (err) {
								logger.error(err);
								return cb(err);
							} else {
								return cb(null);
							}
						});
					});
				} else {
					logger.debug(`[${this.logName}] ${bpuName} is not ready yet`);
				}
			}
		});


		async.parallel(experimentQueue, (err) => {
			if (err) {
				logger.error(err);
				return callback(null);
			}

			return callback(null);
		});

	}

	updateExperiments(callback) {
		//Add left over new experiments
		logger.debug(`[${this.logName}] move new experiments back to queue...`);

		while (Object.keys(this.newExperiments).length > 0) {
			let expTag = this.newExperiments[Object.keys(this.newExperiments)[0]];
			this.queues.newExps.push(expTag);
			delete this.newExperiments[Object.keys(this.newExperiments)[0]];
		}

		//Add sorted pub docs to this listExpDoc
		logger.debug(`[${this.logName}] adding experiments to BPU queues...`);

		while (this.experiments.length > 0) {
			let expDoc = this.experiments.shift();
			let newTag = expDoc.getExperimentTag();

			if (newTag.exp_lastResort.bpuName in this.queues) {
				this.queues[newTag.exp_lastResort.bpuName].push(newTag);
			} else {
				logger.error(`[${this.logName}] BPU Name in experiment ID: ${newTag._id} has BPU Name: ${newTag.exp_lastResort.bpuName}, but that BPU is not present in queues`);
			}
		}

		//Save to database
		logger.debug(`[${this.logName}] saving queues to database...`);
		this.queues.save((err, updatedQueues) => {
			if (err) {
				logger.error(err);
				return callback(null);
			}
			return callback(null);
		});
	}

	processQueues(queueDoc, callback) {
    logger.info('~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~');
    logger.info('got new experiments');
    logger.info(queueDoc.newExps);

		//reinitialize these in loop
    this.queues= queueDoc;
		this.newExperiments = {};
		this.profilerExperiments = {};
		this.scheduledExperiments = [];

		while (this.queues.newExps.length > 0) {
			logger.debug(`[${this.logName}] divide new experiments into profiler and user experiments...`);

			//todo: push these to Redis
			let experiment = this.queues.newExps.shift();
			this.updateExperimentQueues(experiment, false);
		}

		// Save queues and check for new experiments and BPU experiments
    this.queues.save((err, updatedQueues) => {
			if (err) {
				return callback(err);
			} else {
				while (updatedQueues.newExps.length > 0) {
					logger.debug(`[${this.logName}] divide new experiments into profiler and user experiments again...`);

					let experiment = updatedQueues.newExps.shift();
					this.updateExperimentQueues(experiment, false);
				}

				// divide BPU experiments into profiler and user experiments
				logger.debug(`[${this.logName}] divide BPU experiments into profiler and user experiments...`);
				Object.keys(this.queues._doc).forEach((key) => {
					if (this.isQueueForBPU(key)) {
						while (this.queues[key].length > 0) {
							let experiment = this.queues[key].shift();
							this.updateExperimentQueues(experiment, true);
						}
					}
				});

				logger.debug(`[${this.logName}] removing experiments lost for more than 1 day...`);
				this.queues._lostList = _.filter(this.queues._lostList, (experiment) => {
					// interval from submission less than a day
					return (this.startDate.getTime() - experiment.exp_submissionTime) - (24 * 60 * 60 * 1000) < 0;

					//todo this list is not saved yet
				});

				// sort by chronological order
				this.scheduledExperiments.sort((objA, objB) => {
					return objA.submissionTime - objB.submissionTime;
				});

				let initialTime = null;

				if (this.scheduledExperiments.length > 0) {
					initialTime = this.scheduledExperiments[0].submissionTime;
				}

				logger.debug(`[${this.logName}] pushing profiler experiments to front of queue...`);
				Object.keys(this.profilerExperiments).forEach((key) => {
					let experiment = this.profilerExperiments[key];

					if (experiment != null || experiment != undefined) {

						if (initialTime !== null) {
							experiment.exp_submissionTime = initialTime;
						}

						this.newExperiments[experiment.id] = experiment;
						this.scheduledExperiments.push({
							id: experiment.id,
							experiment: experiment,
							submissionTime: experiment.exp_submissionTime,
							username: experiment.user.name
						});

						//todo remove from profiler list now
						//this.profilerExperiments[key] = null;
					}
				});

				this.scheduledExperiments.sort((objA, objB) => {
					return objA.submissionTime - objB.submissionTime;
				});

				// verify 1st 10 experiments at a time
				let verifyExperimentList = [];
				let chosenExperiments = _.take(this.scheduledExperiments, 10);

				logger.debug(this.scheduledExperiments);

				logger.debug(`[${this.logName}] chosen experiments: ${chosenExperiments}`);

				_.each(chosenExperiments, (scheduledExperiment) => {
					verifyExperimentList.push((cb) => {
						this.verifyExperiment(scheduledExperiment, cb)
					});
				});

				if (verifyExperimentList.length > 0) {
					logger.debug(`[${this.logName}] verifying 10 experiments at a time...`);

					async.series(verifyExperimentList, (err) => {
						if (err) {
							logger.error(err);
							return callback(null);
						} else {
							return callback(null);
						}
					});
				} else {
					return callback(null);
				}
			}

		});
	}


	updateExperimentQueues(experiment, isBPUQueue) {
		//logger.debug(experiment);

		if (_.includes([PROFILERS.POPULATION, PROFILERS.ACTIVITY, PROFILERS.RESPONSE], experiment.user.name)) {

			if (
				// New Experiments Queue
				(!isBPUQueue && experiment.exp_wantsBpuName !== null && experiment.exp_wantsBpuName !== undefined) || (

					//BPU Experiments Queue
					isBPUQueue && experiment.exp_lastResort.bpuName !== null && experiment.exp_lastResort.bpuName !== undefined
				)) {

				//todo we lose profiler experiments here
				if (this.profilerExperiments[experiment.exp_wantsBpuName] === null || this.profilerExperiments[experiment.exp_wantsBpuName] === undefined) {
					this.profilerExperiments[experiment.exp_wantsBpuName] = experiment;
				} else if (this.profilerExperiments[experiment.exp_wantsBpuName].submissionTime < experiment.submissionTime) {
					this.profilerExperiments[experiment.exp_wantsBpuName] = experiment;
				}
			}
		} else {
			this.newExperiments[experiment.id] = experiment;
			this.scheduledExperiments.push({
				id: experiment.id,
				experiment: experiment,
				submissionTime: experiment.exp_submissionTime,
				username: experiment.user.name
			});
		}
	}

	verifyExperiment(scheduledExperiment, callback) {
		let bpuExperiment = scheduledExperiment.experiment;

		logger.debug(`[${this.logName}] verifying experiment ${bpuExperiment.id} (${bpuExperiment.group_experimentType})`);

		this.db.getBPUExperiment(bpuExperiment.id, (err, experiment) => {
			//Failed
			if (err) {
				logger.error('failed to get experiment');
				logger.error(err);
				return callback(null);
			} else if (
				// experiment missing, not in right status or cancelled
				experiment === null || experiment === undefined
			) {
				logger.error('experiment missing');
				bpuExperiment.exp_lastResort.rejectionReason = 'experiment missing';
				logger.error(err);
				return callback(null);
			} else if (
				experiment.exp_isCanceled
			) {
				logger.error('experiment cancelled');
				logger.error(err);
				return callback(null);
			} else if (!(_.includes([EXPERIMENT_STATUS.CREATED, EXPERIMENT_STATUS.SUBMITTED, EXPERIMENT_STATUS.QUEUED], experiment.exp_status))) {
				logger.error(`experiment not in right status - Current: ${experiment.exp_status}`);
				bpuExperiment.exp_lastResort.rejectionReason = 'experiment not in right status';
				return callback(null);
			} else {

				experiment.tag = bpuExperiment;
				delete this.newExperiments[bpuExperiment.id];

				//reset experiment last resort
				experiment.exp_lastResort.canidateBpus = [];
				experiment.exp_lastResort.bpuName = null;
				experiment.exp_lastResort.waitTime = 0;
				experiment.exp_resortTime = this.startDate.getTime();

				//Get BPUs allowed
				let scores = this.bpuManager.getBPUScores(experiment.user.groups, experiment.exp_wantsBpuName);

				// experiment.exp_lastResort.canidateBpus = _.concat(experiment.exp_lastResort.canidateBpus, scores);
				experiment.exp_lastResort.canidateBpus = scores;
				logger.debug(`[${this.logName}] Candidate BPUs: ${experiment.exp_lastResort.canidateBpus}`);

				if (experiment.exp_lastResort.canidateBpus.length === 0) {
					logger.error(`[${this.logName}] no BPU authorized to execute experiment`);
				}

				//Only one allowed bpu
				if (experiment.exp_lastResort.canidateBpus.length === 1) {

					//choose bpu from score and wait time
					experiment.exp_lastResort.bpuName = experiment.exp_lastResort.canidateBpus[0].bpuName;
					experiment.exp_lastResort.totalWaitTime = experiment.exp_lastResort.canidateBpus[0].totalWaitTime;

					//Update running bpu queue time
					this.addQueueTime(experiment.exp_lastResort.canidateBpus[0].bpuName, experiment.exp_eventsRunTime);

				} else if (experiment.exp_lastResort.canidateBpus.length > 1) {
					//Several allowed BPUs, sort by score and then wait-time to decide

					experiment.exp_lastResort.canidateBpus.sort((objA, objB) => {
						return objB.finalScore - objA.finalScore;
					});

					//choose bpu from score and wait time
					let zeroScore = experiment.exp_lastResort.canidateBpus[0].finalScore;
					let margin = 0.2;

					let matchingScores = experiment.exp_lastResort.canidateBpus.filter((score) => {
						return (score.finalScore <= (zeroScore + margin) && score.finalScore >= (zeroScore - margin));
					});

					if (matchingScores.length > 0) {

						//Sort similar final scores by wait time.
						matchingScores.sort((objA, objB) => {
							return objA.totalWaitTime - objB.totalWaitTime;
						});

						experiment.exp_lastResort.bpuName = matchingScores[0].bpuName;
						experiment.exp_lastResort.totalWaitTime = matchingScores[0].totalWaitTime;

						this.addQueueTime(matchingScores[0].bpuName, experiment.exp_eventsRunTime);
					} else {
						//Sort similar final scores by wait time.
						experiment.exp_lastResort.bpuName = experiment.exp_lastResort.canidateBpus[0].bpuName;
						experiment.exp_lastResort.totalWaitTime = experiment.exp_lastResort.canidateBpus[0].totalWaitTime;

						this.addQueueTime(experiment.exp_lastResort.canidateBpus[0].bpuName, experiment.exp_eventsRunTime);
					}
				}

				if (experiment.exp_lastResort.bpuName === null) {
					logger.debug(`[${this.logName}] no candidate BPU found running experiment`);
					bpuExperiment.exp_lastResort.rejectionReason = 'No candidate BPU found';
				}

				this.experiments.push(experiment);
				return callback(null);
			}
		});
	}

	addQueueTime(bpuName, queueTime) {
		// if (!(bpuName in this.queueTimePerBPU)) {
		// 	this.queueTimePerBPU[bpuName] = 0;
		// }
		this.queueTimePerBPU[bpuName] += queueTime;
	}

	pushExperimentToBPU(experiment, bpuName, callback) {
		async.waterfall([
			(cb) => {
				logger.debug(`[${this.logName}] get session`);
				this.db.getSession(experiment.session.id, (err,session)=>{
          logger.info('1. session: '+session);
				  return cb(err, session);
        });
			},
			(session, cb) => {
        logger.info('2. session: '+session);

				logger.debug(`[${this.logName}] send experiment to BPU`);
				this.sendExperimentToBPU(experiment, bpuName, session, cb);
			},
			(session, cb) => {
		    logger.info('3. session: '+session);

				if (experiment.group_experimentType === 'live') {
					logger.debug(`[${this.logName}] active experiment`);

					this.bpuManager.activeExperiment(bpuName, session, cb);
				} else {
					logger.debug(`[${this.logName}] passive experiment`);

					this.bpuManager.passiveExperiment(bpuName, session, cb);
				}
			}
		], (err) => {
			if (err) {
				logger.error(`[${this.logName}] ${err}`);
				return callback(null);
			} else {
				callback(null);
			}
		});
	}

	sendExperimentToBPU(experiment, bpuName, session, callback) {
		async.waterfall([
			(cb) => {
				this.bpuManager.addExperiment(bpuName, experiment, cb);
			},
			(updatedExperiment, cb) => {
				let updatedSession = {
					liveBpuExperiment: {
						id: updatedExperiment.id,
						tag: updatedExperiment.getExperimentTag(),
					},
					bc_startSendTime: updatedExperiment.bc_startSendTime,
					bc_isLiveSendingToLab: true,
				};

				this.db.updateSession(experiment.session.id, updatedSession, {
					new: true
				}, (err, session)=>{
				  return cb(err, session);
        });
			},
			(session, cb) => {
				if (session === null) {
					logger.error(`[${this.logName}] session is missing`);
					return cb(`[${this.logName}] session is missing`);
				} else {
					return cb(null, session);
				}
			}
		], (err, session) => {
			if (err) {
			  logger.error(err);
				return callback(err);
			} else {
				callback(null, session);
			}
		});
	}

	// updateQueueTime(bpuList, callback) {
	// 	let newBPUList = _.mapValues(bpuList, (bpu) => {
	// 		//Set Queue Time
	// 		if (bpu.queueTime === null || bpu.queueTime === undefined) {
	// 			if (bpu.doc.liveBpuExperiment) {
	// 				bpu.queueTime = bpu.doc.liveBpuExperiment.bc_timeLeft;
	// 			} else {
	// 				bpu.queueTime = 0;
	// 			}
	// 		}

	// 		return bpu;
	// 	});

	// 	return callback(null, newBPUList);
	// }

	isQueueForBPU(key) {
		return key[0] !== '_' && (key.search('eug') > -1);
	}

	submitExperiment(auth, queue, db, callback) {
		logger.info(`${this.logName} got a new experiment`);

		let validations = [];

		async.waterfall([
			(cb) => {
				logger.debug(`${this.logName} finding session information...`);
				this.findSession(auth, queue, validations, db, cb)
			},
			(session, cb) => {
				logger.debug(`${this.logName} validating experiments submitted...`);
				this.validateAll(queue, session, validations, auth, db, cb)
			}
		], (err) => {
			if (err) {
				logger.error(err);
				return callback(err, validations);
			} else {
				if (validations.length === 0) {
					logger.error('no validations exist');
					return callback('no validations exist', validations);
				} else {
					logger.debug('validations pass');
					return callback(null, validations);
				}
			}
		});
	}

	findSession(auth, queue, validations, db, callback) {
		let sessionID = null;
		let username = null;
		let groups = null;

		if (auth.arePassKeysOpen) {
			logger.debug(`[${this.logName}] passkeys are open`);
			logger.debug(`${queue}`);

			if (queue.length > 0 && queue[0].session && queue[0].session.sessionID !== null) {
				sessionID = queue[0].session.sessionID;

				let firstItem = queue[0];

				if ((firstItem.user !== null) && (firstItem.user.name !== null)) {
					if (firstItem.user.groups !== null) {
						username = firstItem.user.name;
						groups = firstItem.user.groups;
					} else {
						logger.error('group information missing');
						return callback('group information missing');
					}
				} else {
					logger.error('user information missing');
					return callback('user information missing');
				}
			} else {
				logger.error('session missing from experiment');
				return callback('session missing from experiment');
			}
		} else {
			logger.error('passkeys need authentication');
			sessionID = auth.PassKeys[0];
		}

		db.getSessionBySessionID(sessionID, (err, session) => {
			if (err) {
				logger.error(err);
				return callback(err);

			} else if (session === null || session === undefined) {
				db.saveSession(sessionID, username, groups, (err, savedSession) => {
					if (err) {
						logger.error(err);
						return callback(err);

					} else {
						callback(null, savedSession);
					}
				});
			} else {
				callback(null, session);
			}
		});
	}

	validateAll(queue, session, validations, auth, db, callback) {
		let workflow = [];
		queue.forEach((data) => {
			logger.debug(`${data}`);
			workflow.push((cb) => {
				this.validate(data, session, validations, auth, db, cb);
			});
		});

		async.parallel(workflow, (err) => {
			if (err) {
				return callback(err);
			} else {
				return callback(null);
			}
		});
	}

	validate(data, session, validations, auth, db, callback) {
		logger.debug(`${this.logName} validating experiment...`);
		// logger.debug(`${session}`);

		let validation = {};
		validation.errs = [];

		if (!auth.arePassKeysOpen) {
			let filteredKeys = _.filter(auth.PassKeys, (o) => {
				return o === session.sessionID;
			});

			if (!filteredKeys.length > 0) {
				validation.errs.push('Passkey not found');
			}
		}

		let experiment = db.getRawBPUExperiment();

		if (session.user) {
			if (typeof session.user.id === 'string') {
				experiment.user.id = mongoose.Types.ObjectId(session.user.id);
			} else {
				experiment.user.id = session.user.id;
			}

			experiment.user.name = session.user.name;

			if (session.user.groups) {
				experiment.user.groups = session.user.groups;
			} else {
				validation.errs.push('user groups missing from session');
			}
		} else {
			validation.errs.push('user missing from session');
		}

		if (session) {
			if (session.id) {
				if (typeof session.id === 'string') {
					experiment.session.id = mongoose.Types.ObjectId(session.id);
				} else {
					experiment.session.id = session.id;
				}
			} else {
				validation.errs.push('session id missing');
			}

			if (session.sessionID) {
				experiment.session.sessionID = session.sessionID;
			} else {
				validation.errs.push('no session sessionID');
			}

			experiment.session.socketID = session.socketID;
			experiment.session.socketHandle = session.socketHandle;

		} else {
			validation.errs.push('session missing');
		}

		//Other
		if (data.group_experimentType) {
			experiment.group_experimentType = data.group_experimentType;
		} else {
			validation.errs.push('experiment type missing');
		}

		experiment.exp_wantsBpuName = data.exp_wantsBpuName;
		experiment.exp_metaData = data.exp_metaData;
		experiment.exp_metaData.type = data.group_experimentType;
		experiment.exp_metaData.chosenBPU = data.exp_wantsBpuName;
		experiment.bc_serverInfo = auth;

		//todo
		// add new variables here related to experiment

		if (data.exp_eventsToRun) {
			if (data.exp_eventsToRun.forEach) {
				experiment.exp_eventsToRun = data.exp_eventsToRun;
			} else {
				validation.errs.push(`invalid events in experiment $ {data.exp_eventsToRun}`);
			}
		} else {
			validation.errs.push('events to execute missing');
		}

		//Validate New Experiment and finalize and save
		validation.expInfo = db.validateBPUExperiment(experiment);

		validation._id = experiment._id;
		validation.group_experimentType = experiment.group_experimentType;
		validation.exp_wantsBpuName = experiment.exp_wantsBpuName;
		validation.exp_metaData = experiment.exp_metaData;

		validation.wasSaved = false;
		validation.saveErr = null;

		validation.wasTagged = false;
		validation.tagErr = null;

		if (validation.expInfo.isValid && validation.errs.length === 0) {
			logger.debug(`${this.logName} validation pass`);
			// logger.debug(validation);

			experiment.exp_eventsToRun = data.exp_eventsToRun;
			experiment.exp_eventsRunTime = data.exp_eventsRunTime;
			experiment.tag = experiment.getExperimentTag();
			experiment.exp_submissionTime = new Date().getTime();

			experiment.save((err, savedExperiment) => {
				if (err) {
					logger.error(`${this.logName} validation failed while save`);
					validation.saveErr = err;
					validations.push(validation);
					return callback(null, false);
				} else {
					validation.wasSaved = true;
					db.addBPUExperimentToQueue(savedExperiment.tag, (err) => {
						if (err) {
							logger.error(`${this.logName} validation failed while tagging`);
							validation.tagErr = err;
							validations.push(validation);
							return callback(null, false);
						} else {
							validation.wasTagged = true;
							validations.push(validation);
							return callback(null, true);
						}
					});
				}
			});
		} else {
			logger.error(`${this.logName} validation failed`);
			logger.debug(validation);

			validations.push(validation);
			return callback(null, false);
		}
	}
}

export default ExperimentManager;
