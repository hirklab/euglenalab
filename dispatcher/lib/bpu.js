/**
 * Created by shirish.goyal on 2/26/17.
 */

import async from 'async';
import client from 'socket.io-client';
import _ from 'lodash';
import {EXPERIMENT_STATUS, PROFILERS} from './constants';

export function verifyBPUs(bpuList, db, config, logger, startDate, callback) {
    let workflow = [];

    let keys = Object.keys(bpuList);

    keys.forEach((key) => {
        bpuList[key].connected = false;

        workflow.push((callback) => {
            verify(bpuList[key], db, config, logger, startDate, callback)
        });
    });

    async.parallel(workflow, (err) => {
        if (err) {
            logger.error(err);
            return callback(err);
        }

        return callback(null);
    });
}

function log(logger, bpu, message) {
    logger('[' + bpu.doc.name + '] ' + message);
}

function connect(bpu, config, callback) {
    if (bpu.socket === null) {
        let bpuAddr = 'http://' + bpu.doc.localAddr.ip + ':' + bpu.doc.localAddr.serverPort;

        bpu.socket = client(bpuAddr, {
            multiplex: false,
            reconnection: true
        });

        bpu.socket.on('connect', function () {
            bpu.setLEDs = function (ledData) {
                bpu.socket.emit(config.socketRoutes.bpu.setLEDs, ledData);
            };

            return callback(null);
        });

        bpu.socket.on('disconnect', function () {
            disconnect(bpu, () => {
                bpu.doc.bpuStatus = config.bpuStatus.offline;
            });
        });
    } else {
        if (bpu.socketTimeouts > config.socketTimeout) {
            disconnect(bpu, () => {
                bpu.doc.bpuStatus = config.bpuStatus.offline;
                return callback('socket reset');
            })
        } else {
            return callback(null);
        }
    }
}

function disconnect(bpu, callback) {
    bpu.socket.disconnect();
    bpu.socket.close();

    bpu.socketTimeouts = 0;
    bpu.socket = null;
    bpu.setLeds = null;

    delete bpu.socket;

    return callback(null);
}

// check if experiment stalled? yes -> clear experiment
function clear(bpu, db, config, logger, callback) {
    if (bpu.status.expOverId !== null && bpu.status.expOverId !== undefined) {
        if (bpu.doc.bpuStatus === config.bpuStatus.finalizingDone) {

            let updateObj = {
                exp_serverClearTime: new Date().getTime(),
                exp_status: EXPERIMENT_STATUS.FINISHED,
            };

            db.updateBPUExperiment(bpu.status.expOverId, updateObj, (err, experiment) => {
                if (err) {
                    return callback(err);
                }

                return callback(null, bpu);
            });
        } else {
            log(logger.error, bpu, 'experiment ' + bpu.status.expOverId + ' over');
            log(logger.error, bpu, 'Expected status = ' + config.bpuStatus.finalizingDone + ', Current status = ' + bpu.doc.bpuStatus);

            return callback('clear BPU failed for ' + bpu.doc.name);
        }
    } else {
        return callback(null, bpu);
    }
}

function verify(bpu, db, config, logger, startDate, callback) {
    async.waterfall([
        (callback) => {
            connect(bpu, config, callback);
        },
        (callback) => {
            if (!bpu.socket.connected) {
                bpu.doc.bpuStatus = config.bpuStatus.offline;

                return callback('socket not connected');
            }
            return callback(null);
        },
        (callback) => {
            bpu.socket.emit(config.socketRoutes.bpu.getStatus, callback);//socket get status
        },
        (status, callback) => {
            if (status == null) {
                log(logger, bpu, 'failed to fetch status');
                return callback('failed to fetch status');
            }

            bpu.connected = true;
            bpu.socketTimeouts = 0;
            bpu.queueTime = 0;
            bpu.status = status;
            bpu.doc.bpuStatus = status.bpuStatus;

            return callback(null, bpu);
        },
        (bpu, callback) => {
            // any active experiments?
            if (bpu.status.exp !== null && bpu.status.exp !== undefined) {
                let isExperimentPending = (bpu.status.expOverId !== null && bpu.status.expOverId !== undefined);

                bpu.doc.liveBpuExperiment.id = bpu.status.exp._id;
                bpu.doc.liveBpuExperiment.group_experimentType = bpu.status.exp.group_experimentType;
                bpu.doc.liveBpuExperiment.bc_timeLeft = bpu.status.expTimeLeft;
                bpu.doc.liveBpuExperiment.username = bpu.status.exp.user.name;
                bpu.doc.liveBpuExperiment.sessionID = bpu.status.exp.session.sessionID;
                bpu.queueTime = bpu.doc.liveBpuExperiment.bc_timeLeft; // current experiment also included in queueTime

                if (bpu.doc.bpuStatus !== config.bpuStatus.running && bpu.doc.bpuStatus !== config.bpuStatus.pendingRun
                    && bpu.hasOwnProperty('setLEDs')) {
                    delete bpu.setLEDs;
                }
            } else {
                // no experiment in progress
                bpu.doc.liveBpuExperiment.id = null;
                bpu.doc.liveBpuExperiment.group_experimentType = 'text';
                bpu.doc.liveBpuExperiment.bc_timeLeft = 0;
                bpu.doc.liveBpuExperiment.sessionID = null;
                bpu.doc.liveBpuExperiment.username = null;
            }

            return callback(null, bpu);
        },
        (bpu, callback) => {
            // remove any stalled experiments
            clear(bpu, db, config, logger, callback);
        },
        (bpu, callback) => {
            if (config.profiling) {
                // create profiler
                let profiler = [];
                profiler.push({
                    name: 'scripterPopulation',
                    age: startDate.getTime() - bpu.doc.performanceScores.scripterPopulationDate,
                    msg: 'Population: ' + bpu.doc.performanceScores.scripterPopulation
                });
                profiler.push({
                    name: 'scripterActivity',
                    age: startDate.getTime() - bpu.doc.performanceScores.scripterActivityDate,
                    msg: 'Activity: ' + bpu.doc.performanceScores.scripterActivity
                });
                profiler.push({
                    name: 'scripterResponse',
                    age: startDate.getTime() - bpu.doc.performanceScores.scripterResponseDate,
                    msg: 'Response: ' + bpu.doc.performanceScores.scripterResponse
                });

                profiler.sort(function (objA, objB) {
                    return objA.age - objB.age;
                });

                return callback(null, profiler, bpu);
            }

            return callback(null);
        },
        (profiler, bpu, callback) => {
            // run profiler experiments

            if (config.profiling) {
                // milliseconds
                let lastProfilingTime = startDate.getTime() - bpu.doc.performanceScores.bc_lastSendDate;
                let nextProfilingTime = config.profilingInterval - profiler[profiler.length - 1].age;

                if (nextProfilingTime < 0 && lastProfilingTime > config.profilingInterval) {

                    db.submitProfilingExperiment(bpu, {
                            name: bpu.doc.name
                        },
                        {
                            name: profiler[profiler.length - 1].name,
                            groups: ['scripter']
                        }, function (err, bpu) {
                            if (err) {
                                return callback(err);
                            }

                            return callback(null, bpu);
                        });
                }
            }

            return callback(null);
        }
    ], (err) => {
        if (err) {
            log(logger, bpu, err);
            return callback(err);
        }

        return callback(null);
    });
}


function updateQueueTime(bpuList, callback) {
    let newBPUList = _.mapValues(bpuList, function (bpu) {
        //Set Queue Time
        if (bpu.queueTime === null || bpu.queueTime === undefined) {
            if (bpu.doc.liveBpuExperiment) {
                bpu.queueTime = bpu.doc.liveBpuExperiment.bc_timeLeft;
            } else {
                bpu.queueTime = 0;
            }
        }

        return bpu;
    });

    return callback(null, newBPUList);
}

function addQueueTime(bpuList, bpuName, queueTime) {
    Object.keys(bpuList).forEach((key) => {
        let bpu = bpuList[key];

        if (bpu.name == bpuName) {
            bpu.queueTime += queueTime;
        }
    });

    return bpuList;
}

function verifyExperiment(bpuList, experiments, bpuExperiment, logger, startDate, callback) {
    // app.logger.trace(cnt + ':checkExpAndResort:(sess:' + expTag.session.sessionID + ', id:' + expTag.id + '):' + expTag.group_experimentType + ':(age:' + (startDate.getTime() - expTag.exp_submissionTime) + ')');
    // app.logger.trace(cnt + ':checkExpAndResort:(user:' + expTag.user.name + ', bpu:' + expTag.exp_wantsBpuName + ')');

    db.getBPUExperiment(bpuExperiment.id, (err, experiment) => {
        //Failed
        if (err) {
            logger.error(err);
            return callback(err);
        } else if (
            // experiment missing, not in right status or cancelled

        experiment === null
        || experiment === undefined
        || !_.includes([EXPERIMENT_STATUS.CREATED, EXPERIMENT_STATUS.SUBMITTED, EXPERIMENT_STATUS.QUEUED], experiment.exp_status)
        || experiment.exp_isCanceled
        ) {
            logger.error(err);
            return callback(err);
        } else {
            //Okay -- we have the doc, expTag is removed and the experiment is used from now on


            // TODO: check this tag part
            //add exptag to experiment
            experiment.tag = app.newExpTagObj[experiment._id];

            //Remove expTag from main object
            delete app.newExpTagObj[experiment._id];



            //reset experiment last resort
            experiment.exp_lastResort.canidateBpus = [];
            experiment.exp_lastResort.bpuName = null;
            experiment.exp_lastResort.waitTime = 0;
            experiment.exp_resortTime = startDate.getTime();

            //Get Bpus In Groups
            Object.keys(bpuList).forEach((key) => {
                let bpu = bpuList[key];

                if (bpu.connected) {

                    // find groups which are allowed to execute experiments on this BPU
                    let commonGroups = _.intersection(bpu.doc.allowedGroups, experiment.user.groups);
                    commonGroups.forEach((group) => {

                        //Score Bpu
                        let score = bpu.doc.scoreBpu(bpu.queueTime);
                        score.bpuName = bpu.doc.name;
                        score.totalWaitTime = bpu.queueTime;

                        // add possible BPUs where experiment can execute
                        if (experiment.exp_wantsBpuName !== null) {
                            if (bpu.doc.name === bpuExperiment.exp_wantsBpuName) {

                                // if user already chose a BPU, only add that one for execution
                                experiment.exp_lastResort.canidateBpus.push(score);
                            }
                        } else {
                            experiment.exp_lastResort.canidateBpus.push(score);
                        }
                    });
                }
            });

            if (experiment.exp_lastResort.canidateBpus.length === 0) {
                logger.error('no authorization for BPU to execute experiment');
            }

            //Only one allowed bpu
            if (experiment.exp_lastResort.canidateBpus.length === 1) {

                //choose bpu from score and wait time
                experiment.exp_lastResort.bpuName = experiment.exp_lastResort.canidateBpus[0].bpuName;
                experiment.exp_lastResort.totalWaitTime = experiment.exp_lastResort.canidateBpus[0].totalWaitTime;

                //Update running bpu queue time
                addQueueTime(bpuList, experiment.exp_lastResort.canidateBpus[0].bpuName, experiment.exp_eventsRunTime);

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

                    addQueueTime(bpuList, matchingScores[0].bpuName, experiment.exp_eventsRunTime);
                } else {
                    //Sort similar final scores by wait time.
                    experiment.exp_lastResort.bpuName = experiment.exp_lastResort.canidateBpus[0].bpuName;
                    experiment.exp_lastResort.totalWaitTime = experiment.exp_lastResort.canidateBpus[0].totalWaitTime;

                    addQueueTime(bpuList, experiment.exp_lastResort.canidateBpus[0].bpuName, experiment.exp_eventsRunTime);
                }
            }

            if (experiment.exp_lastResort.bpuName === null) {
                logger.error('no BPU for running experiment');
                bpuExperiment.exp_lastResort.rejectionReason = 'No candidate BPU found';

                return callback(bpuExperiment.exp_lastResort.rejectionReason);
            }

            experiments.push(experiment);
            return callback(null, bpuList, experiments, bpuExperiment);
        }

    });//end for BpuExperiment.findById
}

function verifyExperiments(bpuList, experiments, db, logger, startDate, callback) {
    let newExperiments = {};

    db.getNewExperiments(app.listExperimentDoc._id, (err, queue) => {
        if (err) {
            logger.error(err);
            return callback(err);
        } else {
            var profilerExperiments = {};
            var idSubmissionTimeArray = [];

            while (queue.newExps.length > 0) {
                let experiment = queue.newExps.shift();

                if (_.includes([PROFILERS.POPULATION, PROFILERS.ACTIVITY, PROFILERS.RESPONSE], experiment.user.name)) {
                    if (experiment.exp_wantsBpuName !== null && experiment.exp_wantsBpuName !== undefined) {
                        if (profilerExperiments[experiment.exp_wantsBpuName] === null || profilerExperiments[experiment.exp_wantsBpuName] === undefined) {
                            profilerExperiments[experiment.exp_wantsBpuName] = experiment;
                        } else if (profilerExperiments[experiment.exp_wantsBpuName].submissionTime < experiment.submissionTime) {
                            profilerExperiments[experiment.exp_wantsBpuName] = experiment;
                        }
                    }
                } else {
                    newExperiments[experiment.id] = experiment;

                    idSubmissionTimeArray.push({
                        id: experiment.id,
                        subTime: experiment.exp_submissionTime,
                        username: experiment.user.name
                    });
                }
            }

            //Save db doc with removed new experiments
            queue.save(function (err, saveDoc) {

                //Pull New Experiments
                while (app.listExperimentDoc.newExps.length > 0) {
                    var experiment = app.listExperimentDoc.newExps.shift();

                    if (_.includes([PROFILERS.POPULATION, PROFILERS.ACTIVITY, PROFILERS.RESPONSE], experiment.user.name)) {
                        if (experiment.exp_lastResort.bpuName !== null && experiment.exp_lastResort.bpuName !== undefined) {
                            if (profilerExperiments[experiment.exp_wantsBpuName] === null || profilerExperiments[experiment.exp_wantsBpuName] === undefined) {
                                profilerExperiments[experiment.exp_wantsBpuName] = experiment;
                            } else if (profilerExperiments[experiment.exp_wantsBpuName].submissionTime < experiment.submissionTime) {
                                profilerExperiments[experiment.exp_wantsBpuName] = experiment;
                            }
                        }
                    } else {
                        app.newExpTagObj[experiment.id] = experiment;
                        idSubmissionTimeArray.push({
                            id: experiment.id,
                            subTime: experiment.exp_submissionTime,
                            username: experiment.user.name
                        });
                    }
                }

                //add bpu exps from this doc to expTag Obj
                Object.keys(app.listExperimentDoc._doc).forEach(function (key) {
                    if (key[0] !== '_' && (key.search('eug') > -1)) {
                        while (app.listExperimentDoc[key].length > 0) {

                            let experiment = app.listExperimentDoc[key].shift();

                            if (_.includes([PROFILERS.POPULATION, PROFILERS.ACTIVITY, PROFILERS.RESPONSE], experiment.user.name) &&
                                experiment.exp_lastResort.bpuName !== null && experiment.exp_lastResort.bpuName !== undefined) {
                                if (profilerExperiments[experiment.exp_wantsBpuName] === null || profilerExperiments[experiment.exp_wantsBpuName] === undefined) {
                                    profilerExperiments[experiment.exp_wantsBpuName] = experiment;
                                } else if (profilerExperiments[experiment.exp_wantsBpuName].submissionTime < experiment.submissionTime) {
                                    profilerExperiments[experiment.exp_wantsBpuName] = experiment;
                                }
                            } else {
                                app.newExpTagObj[experiment.id] = experiment;
                                idSubmissionTimeArray.push({
                                    id: experiment.id,
                                    subTime: experiment.exp_submissionTime,
                                    username: experiment.user.name
                                });
                            }
                        }
                    }
                });


                //check lost list for removal
                for (var ind = 0; ind < app.listExperimentDoc._lostList.length; ind++) {
                    if ((startDate.getTime() - app.listExperimentDoc._lostList[ind].exp_submissionTime) - (1 * 24 * 60 * 60 * 1000) > 0) {
                        app.listExperimentDoc._lostList.splice(ind, 1);
                        ind--;
                    }
                }

                idSubmissionTimeArray.sort(function (objA, objB) {
                    return objA.subTime - objB.subTime;
                });
                
                var initialTime = null;
                
                if (idSubmissionTimeArray.length > 0) {
                    initialTime = idSubmissionTimeArray[0].subTime;
                }
                
                //Add Scripters and move to front
                Object.keys(profilerExperiments).forEach(function (key) {
                    var experiment = profilerExperiments[key];
                    
                    if (initialTime !== null) {
                        experiment.exp_submissionTime = initialTime;
                    }
                    
                    newExperiments[experiment.id] = experiment;
                    
                    idSubmissionTimeArray.push({
                        id: experiment.id,
                        subTime: experiment.exp_submissionTime,
                        username: experiment.user.name
                    });
                });

                //Build Series
                idSubmissionTimeArray.sort(function (objA, objB) {
                    return objA.subTime - objB.subTime;
                });
                
                var runSeriesFuncs = [];
                
                var Limit = 10;
                var limiter = 0;
                
                for (var jnd = 0; jnd < idSubmissionTimeArray.length; jnd++) {
                    if (limiter < Limit) {
                        runSeriesFuncs.push(verifyExperiment.bind(newExperiments[idSubmissionTimeArray[jnd].id]));
                    } else {
                        break;
                    }

                    limiter++;
                }

                //Run series
                logger.info('runSeries start checkExpsAndResort on ' + runSeriesFuncs.length);
                
                async.series(runSeriesFuncs, function (err) {
                    logger.trace('runSeries end checkExpsAndResort tags:' + Object.keys(newExperiments).length + ', exps:' + app.keeperExpDocs.length);
                    if (err) {
                        logger.error('runSeries end checkExpsAndResort on ' + runSeriesFuncs.length + ' in ' + (new Date() - startDate) + ' err:' + err + '\n');
                    } else {
                        logger.info('runSeries end checkExpsAndResort on ' + runSeriesFuncs.length + ' in ' + (new Date() - startDate) + '\n');
                    }
                    return callback(null);
                });
            });
        }
    });
}

