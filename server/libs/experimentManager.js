"use strict";

var async = require('async');
var _ = require('underscore');
var lodash = require('lodash');

var config = require('./config');
var constants = require('./constants');
var logger = require('./logging');
var MESSAGES = constants.MESSAGES;

module.exports = function(app) {
	var addExpToBpu = function(app, exp, bpuDoc, bpuSocket, callback) {

		var outcome = {};
		// outcome.sess = null;

		// var getSession = function (cb) {

		// 	app.db.models.Session.findById(exp.session.id, function (err, sessDoc) {
		// 		if (err) {
		// 			cb(err);
		// 		} else if (sessDoc === null) {
		// 			cb('session missing');
		// 		} else {
		// 			outcome.sess = sessDoc;
		// 			cb(null);
		// 		}
		// 	});
		// };

		var sendExperimentToBpu = function(cb) {
			var didCallback = false;

			setTimeout(function() {
				if (!didCallback) {
					didCallback = true;
					cb('operation timed out');
				}
			}, config.CALLBACK_TIMEOUT);

			if (bpuSocket === null || bpuSocket === undefined) {
				if (!didCallback) {
					didCallback = true;
					cb('bpu socket is null');
				}
			} else {
				experiment.magnification = bpuDoc.magnification;

				bpuSocket.emit(app.mainConfig.socketStrs.bpu_setExp, exp, config.USER_CONFIRMATION_TIMEOUT + 1000, function(err) {
					if (!didCallback) {
						didCallback = true;

						if (err) {
							cb(err);
						} else {
							var expUpdateObj = {
								liveBpu: {
									id: bpuDoc._id,
									name: bpuDoc.name,
									index: bpuDoc.index,
									socketId: bpuDoc.soc
								},
								// exp_lastResort:        exp.exp_lastResort,
								// bc_startSendTime:      exp.bc_startSendTime,
								// bc_isLiveSendingToLab: true,
								status: 'queued',
								// exp_metaData:          exp.exp_metaData
							};

							app.db.models.BpuExperiment.findByIdAndUpdate(exp.id, expUpdateObj, {
								new: true
							}, function(err, savedExperiment) {
								if (err) {
									logger.error(err);

									cb(null);
								} else if (savedExperiment === null) {
									logger.error('savedExperiment is null');

									cb(null);
								} else {
									var expDoc = savedExperiment;

									var sessUpdateObj = {
										// liveBpuExperiment:     {
										// 	id:  expDoc.id,
										// 	tag: expDoc.getExperimentTag()
										// },
										// bc_startSendTime:      expDoc.bc_startSendTime,
										// bc_isLiveSendingToLab: true
									};

									app.db.models.Session.findByIdAndUpdate(exp.session.id, sessUpdateObj, {
										new: true
									}, function(err, session) {
										if (err) {
											logger.error(err);

											cb(null);
										} else if (expDoc === null) {
											logger.error('session is null');

											cb(null);
										} else {
											outcome.sess = session;

											cb(null);
										}
									});
								}
							});
						}
					}
				});
			} //end of socket null check
		};

		var liveExperiment = function(cb_fn) {

			async.some(app.clients, function(client, callback) {

				if (client.connected) {
					logger.debug('confirming live experiment from server: ' + client.id);

					client.emit('activateLiveUser', outcome.sess, config.USER_CONFIRMATION_TIMEOUT, function(userActivateResData) {
						if (userActivateResData.err || !userActivateResData.didConfirm) {
							return callback(false);
						} else {

							app.bpuLedsSetMatch[outcome.sess.sessionID] = app.microscopesIndex[bpuDoc.name].setStimulus;

							bpuSocket.emit(app.mainConfig.socketStrs.bpu_runExp, function(bpuRunResObj) {
								if (bpuRunResObj.err) {
									app.errors.live.push({
										time: new Date(),
										err: bpuRunResObj.err
									});
									return callback(false);
								} else {
									client.emit('sendUserToLiveLab', outcome.sess, function(userSendResObj) {
										if (userSendResObj.err) {
											app.errors.live.push({
												time: new Date(),
												err: userSendResObj.err
											});
											return callback(false);
										} else {
											logger.debug('Someone confirmed and user sent to live lab');
											return callback(true);
										}
									});
								}
							});
						}
					});
				} else {
					return callback(false);
				}

			}, function(someoneConfirmed) {

				if (!someoneConfirmed) {
					logger.warn('********* nobody confirmed **********');

					var isCancelled = true;
					bpuSocket.emit(app.mainConfig.socketStrs.bpu_resetBpu, isCancelled, outcome.sess.sessionID, function(err) {
						if (err) {
							app.errors.live.push({
								time: new Date(),
								err: err
							});
						}
					});
				}

				cb_fn(null);
			});


		};

		var batchExperiment = function(cb_fn) {
			bpuSocket.emit(app.mainConfig.socketStrs.bpu_runExp, function(bpuResObj) {
				if (bpuResObj.err) {
					logger.error(bpuResObj.err);
				}
			});
			cb_fn(null);
		};

		var seriesFuncs = [];
		// seriesFuncs.push(getSession);
		seriesFuncs.push(sendExperimentToBpu);
		seriesFuncs.push(exp.type === 'live' ? liveExperiment : batchExperiment);

		async.series(seriesFuncs, function(err) {
			if (err) {
				callback(err, null);
			} else {
				callback(null, outcome.sess);
			}
		});
	};

	return {
		//pulls ListExperiment doc each time
		checkExperiments: function(callback) {
			var ExpRejectMax = 10;
			var cnt = 0; //cnts expTags for cnsole logging

			app.experimentsCache = []; //BpuExperiments are pulled from db for each expTag, they are kept though the rest of the loop

			var checkExpAndResort = function(checkExpCallback) {
				cnt++;

				var expTag = this;

				app.db.models.BpuExperiment.findById(expTag.id, function(err, expDoc) {

					//Failed
					if (err) {
						err = cnt + ':checkExpAndResort BpuExperiment.findById :' + err;
						logger.error(err);

						expTag.exp_lastResort.rejectionCounter++;
						expTag.exp_lastResort.rejectionReason = err;

						checkExpCallback(null);

						//Failed
					} else if (expDoc === null || expDoc === undefined) {
						err = cnt + ':checkExpAndResort BpuExperiment.findById error:' + 'expDoc===null || expDoc===undefined';
						logger.error(err);

						expTag.exp_lastResort.rejectionCounter++;
						expTag.exp_lastResort.rejectionReason = err;

						checkExpCallback(null);

						//Canceled
					} else if (expDoc.exp_isCanceled) {
						err = cnt + ':checkExpAndResort BpuExperiment.findById error:' + 'expDoc.exp_isCanceled';
						logger.error(err);

						expTag.exp_lastResort.rejectionCounter = ExpRejectMax;
						expTag.exp_lastResort.rejectionReason = err;

						checkExpCallback(null);

						//Incorrect status, should alreay be out of queue
					} else if (expDoc.exp_status !== 'queued' && expDoc.exp_status !== 'submited' && expDoc.exp_status !== 'created') {
						err = cnt + ':checkExpAndResort BpuExperiment.findById error:' + 'Incorrect status:' + expDoc.exp_status + ', should alreay be out of queue';
						logger.error(err);

						expTag.exp_lastResort.rejectionCounter = ExpRejectMax;
						expTag.exp_lastResort.rejectionReason = err;

						checkExpCallback(null);

						//Okay -- we have the doc, expTag is removed and the expDoc is used from now on
					} else {
						//add exptag to expDoc
						expDoc.tag = app.newExperimentsIndex[expDoc._id];

						//Remove expTag from main object
						delete app.newExperimentsIndex[expDoc._id];

						//reset expDoc last resort
						expDoc.exp_lastResort.canidateBpus = [];
						expDoc.exp_lastResort.bpuName = null;
						expDoc.exp_lastResort.waitTime = 0;
						expDoc.exp_resortTime = app.startDate.getTime();

						//Get Bpus In Groups
						Object.keys(app.microscopesIndex).forEach(function(key) {
							var bpuObj = app.microscopesIndex[key];

							if (bpuObj.isConnected) {

								//Filter bpus by experiment user groups
								for (var bgnd = 0; bgnd < bpuObj.doc.allowedGroups.length; bgnd++) {
									for (var ugnd = 0; ugnd < expDoc.user.groups.length; ugnd++) {

										if (bpuObj.doc.allowedGroups[bgnd] === expDoc.user.groups[ugnd]) {

											//Score Bpu
											var scoreObj = bpuObj.doc.scoreBpu(app.microscopesIndex[bpuObj.doc.name].queueTime);
											scoreObj.bpuName = bpuObj.doc.name;
											scoreObj.totalWaitTime = app.microscopesIndex[bpuObj.doc.name].queueTime;

											//Check Specific Bpu and add to exps canidate bpus list
											if (expDoc.exp_wantsBpuName !== null) {
												if (bpuObj.doc.name === expTag.exp_wantsBpuName) {
													expDoc.exp_lastResort.canidateBpus.push(scoreObj);
												}
											} else {
												expDoc.exp_lastResort.canidateBpus.push(scoreObj);
											}
										}
									}
								}
							}
						});

						//Only one canidated bpu
						if (expDoc.exp_lastResort.canidateBpus.length === 1) {

							//choose bpu from score and wait time
							expDoc.exp_lastResort.bpuName = expDoc.exp_lastResort.canidateBpus[0].bpuName;
							expDoc.exp_lastResort.totalWaitTime = expDoc.exp_lastResort.canidateBpus[0].totalWaitTime;

							//Update running bpu queue time
							app.microscopesIndex[expDoc.exp_lastResort.canidateBpus[0].bpuName].queueTime += expDoc.exp_eventsRunTime;

							//Many Canidates, do secondary check for bpus with similar score and sort by waittime instead

						} else if (expDoc.exp_lastResort.canidateBpus.length > 1) {
							//Sort By final Score
							expDoc.exp_lastResort.canidateBpus.sort(function(objA, objB) {
								return objB.finalScore - objA.finalScore;
							});

							//choose bpu from score and wait time
							var zeroScore = expDoc.exp_lastResort.canidateBpus[0].finalScore;
							var scoreInt = 0.2;
							var sameScoreObjs = expDoc.exp_lastResort.canidateBpus.filter(function(scoreObj) {
								if (scoreObj.finalScore <= zeroScore + scoreInt && scoreObj.finalScore >= zeroScore - scoreInt) return true;
								else return false;
							});

							if (sameScoreObjs.length > 0) {
								//Sort similar final scores by wait time.
								sameScoreObjs.sort(function(objA, objB) {
									return objA.totalWaitTime - objB.totalWaitTime;
								});
								expDoc.exp_lastResort.bpuName = sameScoreObjs[0].bpuName;
								expDoc.exp_lastResort.totalWaitTime = sameScoreObjs[0].totalWaitTime;

								app.microscopesIndex[sameScoreObjs[0].bpuName].queueTime += expDoc.exp_eventsRunTime;
							} else {
								//Sort similar final scores by wait time.
								expDoc.exp_lastResort.bpuName = expDoc.exp_lastResort.canidateBpus[0].bpuName;
								expDoc.exp_lastResort.totalWaitTime = expDoc.exp_lastResort.canidateBpus[0].totalWaitTime;

								app.microscopesIndex[expDoc.exp_lastResort.canidateBpus[0].bpuName].queueTime += expDoc.exp_eventsRunTime;
							}
						}

						if (true) {
							expDoc.exp_lastResort.canidateBpus.forEach(function(canBpu) {
								logger.debug(canBpu.bpuName + ' ' + canBpu.finalScore + ' ' + canBpu.totalWaitTime);
							});
						}

						if (expDoc.exp_lastResort.bpuName === null) {
							expDoc.exp_lastResort.rejectionCounter++;
							expTag.exp_lastResort.rejectionReason = 'No candidate BPU found';
						}

						app.experimentsCache.push(expDoc);
						checkExpCallback(null);
					}

				}); //end for BpuExperiment.findById
			};

			var updateProfilerExperiments = function(expTag, profilingExperimentsIndex, experimentSchedule) {
				if (constants.PROFILERS.indexOf(expTag.user.name) > -1) {
					if (expTag.exp_wantsBpuName !== null && expTag.exp_wantsBpuName !== undefined) {

						if (profilingExperimentsIndex[expTag.exp_wantsBpuName] === null || profilingExperimentsIndex[expTag.exp_wantsBpuName] === undefined) {
							profilingExperimentsIndex[expTag.exp_wantsBpuName] = expTag;
						} else if (profilingExperimentsIndex[expTag.exp_wantsBpuName].submissionTime < expTag.submissionTime) {
							profilingExperimentsIndex[expTag.exp_wantsBpuName] = expTag;
						}
					}
				} else {
					app.newExperimentsIndex[expTag.id] = expTag;
					experimentSchedule.push({
						id: expTag.id,
						subTime: expTag.exp_submissionTime,
						username: expTag.user.name
					});
				}
			};

			//Get new Exps from database and build series function array
			app.db.models.ListExperiment.findById(app.experiments._id, {
				newExps: 1
			}, function(err, newListExperimentDoc) {
				if (err) {
					logger.error(err);
					return callback(err);
				} else if (newListExperimentDoc === null || newListExperimentDoc === undefined) {
					logger.error('newListExperimentDoc dne');
					return callback('newListExperimentDoc dne');
				} else {

					//Create Master expTag obj
					app.newExperimentsIndex = {};
					var profilingExperimentsIndex = {};
					var experimentSchedule = [];

					//Pull New Experiments from db
					while (newListExperimentDoc.newExps.length > 0) {
						var expTag = newListExperimentDoc.newExps.shift();
						updateProfilerExperiments(expTag, profilingExperimentsIndex, experimentSchedule);
					}

					//Save db doc with removed new experiments
					newListExperimentDoc.save(function(err, saveDoc) {

						//Pull New Experiments from current document
						while (app.experiments.newExps.length > 0) {
							var expTag = app.experiments.newExps.shift();
							updateProfilerExperiments(expTag, profilingExperimentsIndex, experimentSchedule);
						}

						//add bpu exps from this doc to expTag Obj
						Object.keys(app.experiments._doc).forEach(function(key) {
							if (key[0] !== '_' && (key.search('eug') > -1)) {
								while (app.experiments[key].length > 0) {
									var expTag = app.experiments[key].shift();
									updateProfilerExperiments(expTag, profilingExperimentsIndex, experimentSchedule);
								}
							}
						});

						//check lost list for removal
						for (var ind = 0; ind < app.experiments._lostList.length; ind++) {
							if ((app.startDate.getTime() - app.experiments._lostList[ind].exp_submissionTime) - (config.INACTIVE_EXPERIMENT_TIMEOUT) > 0) {
								app.experiments._lostList.splice(ind, 1);
								ind--;
							}
						}

						experimentSchedule.sort(function(objA, objB) {
							return objA.subTime - objB.subTime;
						});

						var initialTime = null;

						if (experimentSchedule.length > 0) {
							initialTime = experimentSchedule[0].subTime;
						}

						Object.keys(profilingExperimentsIndex).forEach(function(key) {
							var expTag = profilingExperimentsIndex[key];

							if (initialTime !== null) {
								expTag.exp_submissionTime = initialTime;
							}

							app.newExperimentsIndex[expTag.id] = expTag;

							experimentSchedule.push({
								id: expTag.id,
								subTime: expTag.exp_submissionTime,
								username: expTag.user.name
							});
						});

						experimentSchedule.sort(function(objA, objB) {
							return objA.subTime - objB.subTime;
						});

						var runSeriesFuncs = [];
						var Limit = 10;
						var limiter = 0;
						for (var jnd = 0; jnd < experimentSchedule.length; jnd++) {
							if (limiter < Limit) {
								runSeriesFuncs.push(checkExpAndResort.bind(app.newExperimentsIndex[experimentSchedule[jnd].id]));
							} else {
								break;
							}
							limiter++;
						}

						async.series(runSeriesFuncs, function(err) {
							if (err) {
								logger.error(err);
							}

							return callback(null);
						});
					});
				}
			});
		},

		scheduleExperiments: function(callback) {
			var cnt = 0;
			var sendExpToBpu = function(sendExpToBpuCallback) {
				cnt++;

				var exp = this.exp;
				var bpuObj = this.bpuObj;

				logger.debug(cnt + ':sendExpToBpu ' + bpuObj.doc.name + ':' + exp.group_experimentType + ':' + exp.id + ' on Socket?null:' + (bpuObj.socket === null));

				addExpToBpu(app, exp, bpuObj.doc, bpuObj.socket, function(err, session) {
					if (err) {
						err = cnt + err;
						app.errors.experiment.push({
							time: new Date(),
							err: err
						});
						logger.error(err);
					} else {
						bpuObj.doc.session.id = session.id;
						bpuObj.doc.session.sessionID = session.sessionID;
						bpuObj.doc.session.socketID = session.socketID;
					}
				});
				sendExpToBpuCallback(null);
			};

			//Find next Experiment per bpu
			app.experimentsCache.sort(function(objA, objB) {
				return objA.exp_submissionTime - objB.exp_submissionTime;
			});

			var expPerBpu = {};
			for (var ind = 0; ind < app.experimentsCache.length; ind++) {
				if (expPerBpu[app.experimentsCache[ind].exp_lastResort.bpuName] === null || expPerBpu[app.experimentsCache[ind].exp_lastResort.bpuName] === undefined) {
					var bpuExp = app.experimentsCache.splice(ind, 1)[0];
					ind--;
					expPerBpu[bpuExp.exp_lastResort.bpuName] = bpuExp;
					if (Object.keys(expPerBpu).length >= Object.keys(app.microscopesIndex).length) break;
				}
			}

			//Build Parallel - Match Available Bpus with Queue Experiments
			var runParallelFuncs = [];

			Object.keys(app.microscopesIndex).forEach(function(key) {

				//bpu has exp in queue?
				if (expPerBpu[key]) {

					//can send to bpu
					if (app.microscopesIndex[key].doc.bpuStatus === app.mainConfig.bpuStatusTypes.resetingDone && app.microscopesIndex[key].isConnected) {
						runParallelFuncs.push(sendExpToBpu.bind({
							bpuObj: app.microscopesIndex[key],
							exp: expPerBpu[key]
						}));

					} else {
						//put back in keeper docs to return to queue
						app.experimentsCache.push(expPerBpu[key]);
					}
				}
			});

			expPerBpu = null;

			async.parallel(runParallelFuncs, function(err) {
				if (err) {
					logger.error('runParallel end sendExpsToBpus on ' + runParallelFuncs.length + ' in ' + (new Date() - app.startDate) + ' err:' + err + '\n');
				}

				return callback(null);
			});
		},

		updateExperimentsQueue: function(callback) {

			//Add left over newExpTags into this listExpDoc
			while (Object.keys(app.newExperimentsIndex).length > 0) {
				var expTag = app.newExperimentsIndex[Object.keys(app.newExperimentsIndex)[0]];
				app.experiments.newExps.push(expTag);
				delete app.newExperimentsIndex[Object.keys(app.newExperimentsIndex)[0]];
			}

			//Add sorted pub docs to this listExpDoc
			while (app.experimentsCache.length > 0) {
				var expDoc = app.experimentsCache.shift();
				var newTag = expDoc.getExperimentTag();
				if (newTag.exp_lastResort.bpuName in app.experiments) {
					app.experiments[newTag.exp_lastResort.bpuName].push(newTag);
				} else {
					logger.error('BPU Name in experiment: ID: ' + newTag._id + ' has BPU Name: ' + newTag.exp_lastResort.bpuName + ', but that BPU is not present in app.listExperiment');
				}
			}

			//persist to database
			app.experiments.save(function(err, savedDoc) {
				return callback(null);
			});
		},

		notifyClients: function(callback) {
			if (app.webserver && app.webserver.state.connected) {

				var microscopes = _.values(app.microscopesIndex);

				var bpuDocs = _.chain(microscopes)
					.filter(function(microscope) {
						return microscope.isConnected;
					})
					.map(function(microscope) {
						var data = lodash.clone(microscope);

						// if (isLiveActive(bpuDoc.bpuStatus)) {
						// 	liveBpuExperimentPart = {
						// 		username:             bpuDoc.liveBpuExperiment.username,
						// 		bc_timeLeft:          bpuDoc.liveBpuExperiment.bc_timeLeft,
						// 		group_experimentType: bpuDoc.liveBpuExperiment.group_experimentType
						// 	};
						// }
						// 	// bpu_processingTime: bpuDoc.bpu_processingTime,

						// is live
						//(status === that.config.mainConfig.bpuStatusTypes.running ||
						// status === that.config.mainConfig.bpuStatusTypes.pendingRun ||
						// status === that.config.mainConfig.bpuStatusTypes.finalizing ||
						// status === that.config.mainConfig.bpuStatusTypes.reseting);

						// var bpuGroupsCrossCheckWithUser = function (user, bpuDoc) {
						//     for (var ind = 0; ind < bpuDoc.allowedGroups.length; ind++) {
						//         for (var jnd = 0; jnd < user.groups.length; jnd++) {
						//             if (bpuDoc.allowedGroups[ind] === user.groups[jnd]) return true;
						//         }
						//     }
						//     return false;
						// };

						return data.state;
					});

				// todo better to filter data only for microscopes which user is allowed to see
				app.webserver.sendMessage(MESSAGES.UPDATE, {
					microscopes: bpuDocs,
					experiments: app.experiments //.toJSON()
				});
			}

			return callback(null);
		}
	}
};