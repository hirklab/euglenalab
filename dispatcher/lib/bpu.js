import async from 'async';
import client from 'socket.io-client';
import _ from 'lodash';
import {EXPERIMENT_STATUS, PROFILERS, GROUPS, BPU_STATUS, ROUTES} from './constants';
import {logger} from './logging'

export function verify(bpu, db, config, startDate, status, callback) {
  async.waterfall([
    (callback) => {
      logger.debug(`[${bpu.doc.name}] connecting...`);

      connect(bpu, config, callback);
    },
    (bpu, callback) => {
      if (!bpu.socket.connected) {
        bpu.doc.bpuStatus = BPU_STATUS.OFFLINE;

        logger.error(`[${bpu.doc.name}] offline`);
        return callback('socket not connected');
      }

      return callback(null, bpu);
    },
    (bpu, callback) => {
      logger.debug(`[${bpu.doc.name}] checking status...`);

      bpu.socket.emit(config.socketRoutes.bpu.getStatus, (bpuStatus) => {
        if (bpuStatus == null) {
          logger.error(`[${bpu.doc.name}] failed to fetch status`);
          return callback('failed to fetch status');
        }

        logger.debug(`[${bpu.doc.name}] status: ${bpuStatus.bpuStatus}`);
        return callback(null, bpuStatus);
      });
    },
    (status, callback) => {
      bpu.connected = true;
      bpu.socketTimeouts = 0;
      bpu.queueTime = 0;
      bpu.status = status;
      bpu.doc.bpuStatus = status.bpuStatus;

      return callback(null, bpu);
    },
    (bpu, callback) => {
      // any active experiments?
      logger.debug(`[${bpu.doc.name}] checking for running experiments`);

      if (bpu.status.exp !== null && bpu.status.exp !== undefined) {
        let isExperimentPending = (bpu.status.expOverId !== null && bpu.status.expOverId !== undefined);

        bpu.doc.liveBpuExperiment.id = bpu.status.exp._id;
        bpu.doc.liveBpuExperiment.group_experimentType = bpu.status.exp.group_experimentType;
        bpu.doc.liveBpuExperiment.bc_timeLeft = bpu.status.expTimeLeft;
        bpu.doc.liveBpuExperiment.username = bpu.status.exp.user.name;
        bpu.doc.liveBpuExperiment.sessionID = bpu.status.exp.session.sessionID;
        bpu.queueTime = bpu.doc.liveBpuExperiment.bc_timeLeft; // current experiment also included in queueTime

        if (bpu.doc.bpuStatus !== BPU_STATUS.IN_PROGRESS && bpu.doc.bpuStatus !== BPU_STATUS.IN_QUEUE
          && bpu.hasOwnProperty('setLEDs')) {
          delete bpu.setLEDs;
        }

        status = 'experiment in progress on BPU ' + bpu.doc.name;
        logger.info(status);
      } else {
        // no experiment in progress
        bpu.doc.liveBpuExperiment.id = null;
        bpu.doc.liveBpuExperiment.group_experimentType = 'text';
        bpu.doc.liveBpuExperiment.bc_timeLeft = 0;
        bpu.doc.liveBpuExperiment.sessionID = null;
        bpu.doc.liveBpuExperiment.username = null;

        logger.debug(`[${bpu.doc.name}] no experiment in progress`);
      }

      return callback(null, bpu);
    },
    (bpu, callback) => {
      logger.debug(`[${bpu.doc.name}] removing any stalled experiments...`);

      clear(bpu, db, config, logger, callback);
    },
    (bpu, callback) => {
      if (config.profiling) {
        logger.debug(`[${bpu.doc.name}] profiler is ON`);

        // create profiler
        let profiler = [];
        profiler.push({
          name: PROFILERS.POPULATION,
          age: startDate.getTime() - bpu.doc.performanceScores.scripterPopulationDate,
          msg: 'Population: ' + bpu.doc.performanceScores.scripterPopulation
        });
        profiler.push({
          name: PROFILERS.ACTIVITY,
          age: startDate.getTime() - bpu.doc.performanceScores.scripterActivityDate,
          msg: 'Activity: ' + bpu.doc.performanceScores.scripterActivity
        });
        profiler.push({
          name: PROFILERS.RESPONSE,
          age: startDate.getTime() - bpu.doc.performanceScores.scripterResponseDate,
          msg: 'Response: ' + bpu.doc.performanceScores.scripterResponse
        });

        profiler.sort((objA, objB) => {
          return objA.age - objB.age;
        });

        return callback(null, profiler, bpu);
      }
      else {
        return callback(null, [], bpu);
      }
    },
    (profiler, bpu, callback) => {
      // run profiler experiments
      if (config.profiling) {
        logger.debug(`[${bpu.doc.name}] adding profiler experiments...`);

        // milliseconds
        let lastProfilingTime = startDate.getTime() - bpu.doc.performanceScores.bc_lastSendDate;
        let nextProfilingTime = config.profilingInterval - profiler[profiler.length - 1].age;

        if (nextProfilingTime < 0 && lastProfilingTime > config.profilingInterval) {

          db.submitProfilingExperiment(bpu, {
              name: bpu.doc.name
            },
            {
              name: profiler[profiler.length - 1].name,
              groups: [GROUPS.PROFILER]
            }, (err, bpu) => {
              if (err) {
                return callback(err);
              }

              return callback(null, bpu);
            });
        }
      } else {
        return callback(null, bpu);
      }
    }
  ], (err) => {
    if (err) {
      log(logger, bpu, err);
      return callback(err);
    }

    return callback(null);
  });
}

export function processQueues(queues, bpuList, experiments, newExperiments, startDate, status, callback) {
  logger.debug(`processing queues...`);

  let profilerExperiments = {};
  let scheduledExperiments = [];

  // divide new experiments into profiler and user experiments
  while (queues.newExps.length > 0) {
    // logger.debug(`divide new experiments into profiler and user experiments...`);

    let experiment = queues.newExps.shift();
    updateExperimentQueues(experiment, profilerExperiments, scheduledExperiments, newExperiments, false);
  }

  // Save queues and check for new experiments and BPU experiments
  queues.save((err, updatedQueues) => {
    if (err) {
      return callback(err);
    }

    while (updatedQueues.newExps.length > 0) {
      // logger.debug(`divide new experiments into profiler and user experiments again...`);

      let experiment = updatedQueues.newExps.shift();
      updateExperimentQueues(experiment, profilerExperiments, scheduledExperiments, newExperiments, false);
    }

    // divide BPU experiments into profiler and user experiments
    // logger.debug(`divide BPU experiments into profiler and user experiments...`);
    Object.keys(updatedQueues._doc).forEach((key) => {
      if (isQueueForBPU(key)) {
        while (updatedQueues[key].length > 0) {
          let experiment = updatedQueues[key].shift();
          updateExperimentQueues(experiment, profilerExperiments, scheduledExperiments, newExperiments, true);
        }
      }
    });

    logger.debug(`removing experiments lost for more than 1 day...`);
    updatedQueues._lostList = _.filter(updatedQueues._lostList, (experiment) => {
      // interval from submission less than a day
      return (startDate.getTime() - experiment.exp_submissionTime) - (24 * 60 * 60 * 1000) < 0;
    });

    scheduledExperiments.sort((objA, objB) => {
      return objA.submissionTime - objB.submissionTime;
    });

    let initialTime = null;

    if (scheduledExperiments.length > 0) {
      initialTime = scheduledExperiments[0].submissionTime;
    }

    // Push Profiler Experiments to Queue
    logger.debug(`pushing profiler experiments to queue...`);

    Object.keys(profilerExperiments).forEach((key) => {
      let experiment = profilerExperiments[key];

      if (initialTime !== null) {
        experiment.exp_submissionTime = initialTime;
      }

      scheduledExperiments.push({
        id: experiment.id,
        experiment: experiment,
        submissionTime: experiment.exp_submissionTime,
        username: experiment.user.name
      });
    });

    scheduledExperiments.sort((objA, objB) => {
      return objA.submissionTime - objB.submissionTime;
    });

    // verify 1st 10 experiments at a time
    let verifyExperimentList = [];
    let chosenExperiments = _.take(scheduledExperiments, 10);

    _.each(chosenExperiments, (scheduledExperiment) => {
      verifyExperimentList.push((callback) => {
        verifyExperiment(bpuList, experiments, scheduledExperiment.experiment, startDate, status, callback)
      });
    });

    if (verifyExperimentList.length > 0) {
      logger.debug(`verifying 10 experiments at a time...`);

      async.series(verifyExperimentList, (err) => {
        if (err) {
          return callback(err);
        }

        return callback(null);
      });
    } else {
      return callback(null);
    }
  });
}

export function executeExperiment(experiment, bpu, sockets, config, callback) {
  pushExperimentToBPU(experiment, bpu, sockets, config, logger, (err, session) => {
    if (err) {
      logger.error(`[${bpu.doc.name}] ${err.message}`);
      return callback(err);
    }

    bpu.doc.session.id = session.id;
    bpu.doc.session.sessionID = session.sessionID;
    bpu.doc.session.socketID = session.socketID;

    return callback(null, bpu);
  });
}

function log(logger, bpu, message) {
  logger.info(`[${bpu.doc.name}] ${message}`);
}

function connect(bpu, config, callback) {
  if (bpu.socket === null) {
    let bpuAddr = 'http://' + bpu.doc.localAddr.ip + ':' + bpu.doc.localAddr.serverPort;

    bpu.socket = client(bpuAddr, {
      multiplex: false,
      reconnection: true
    });

    bpu.socket.on(ROUTES.DISPATCHER.CONNECT, () => {
      bpu.setLEDs = (ledData) => {
        bpu.socket.emit(config.socketRoutes.bpu.setLEDs, ledData);
      };

      logger.info(`[${bpu.doc.name}] connected @${bpu.socket.id}`);

      return callback(null, bpu);
    });

    bpu.socket.on(ROUTES.DISPATCHER.DISCONNECT, () => {
      disconnect(bpu, () => {
        bpu.doc.bpuStatus = BPU_STATUS.OFFLINE;
      });
    });
  } else {
    if (bpu.socketTimeouts > config.socketTimeout) {
      disconnect(bpu, () => {
        bpu.doc.bpuStatus = BPU_STATUS.OFFLINE;
        logger.info(`[${bpu.doc.name}] seems offline`);
        return callback('socket reset');
      })
    } else {
      return callback(null, bpu);
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

function updateQueueTime(bpuList, callback) {
  let newBPUList = _.mapValues(bpuList, (bpu) => {
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

function verifyExperiment(bpuList, experiments, bpuExperiment, startDate, status, callback) {
  // app.logger.trace(cnt + ':checkExpAndResort:(sess:' + expTag.session.sessionID + ', id:' + expTag.id + '):' + expTag.group_experimentType + ':(age:' + (startDate.getTime() - expTag.exp_submissionTime) + ')');
  // app.logger.trace(cnt + ':checkExpAndResort:(user:' + expTag.user.name + ', bpu:' + expTag.exp_wantsBpuName + ')');

  status = 'verifying experiment ' + bpuExperiment.id + ' (' + bpuExperiment.group_experimentType + ')';
  // logger.info(status);

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
      // experiment.tag = newExperiments[experiment._id];

      //Remove expTag from main object
      // delete newExperiments[experiment._id];


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

function updateExperimentQueues(experiment, profilerExperiments, scheduledExperiments, newExperiments, isBPUQueue) {
  if (_.includes([PROFILERS.POPULATION, PROFILERS.ACTIVITY, PROFILERS.RESPONSE], experiment.user.name)) {


    if (
      // New Experiments Queue
    (!isBPUQueue && experiment.exp_wantsBpuName !== null && experiment.exp_wantsBpuName !== undefined) || (

      //BPU Experiments Queue
      isBPUQueue && experiment.exp_lastResort.bpuName !== null && experiment.exp_lastResort.bpuName !== undefined
    )) {
      if (profilerExperiments[experiment.exp_wantsBpuName] === null || profilerExperiments[experiment.exp_wantsBpuName] === undefined) {
        profilerExperiments[experiment.exp_wantsBpuName] = experiment;
      } else if (profilerExperiments[experiment.exp_wantsBpuName].submissionTime < experiment.submissionTime) {
        profilerExperiments[experiment.exp_wantsBpuName] = experiment;
      }
    }
  } else {

    scheduledExperiments.push({
      id: experiment.id,
      experiment: experiment,
      submissionTime: experiment.exp_submissionTime,
      username: experiment.user.name
    });
  }

  return {profilerExperiments, scheduledExperiments, newExperiments};
}

function isQueueForBPU(key) {
  return key[0] !== '_' && (key.search('eug') > -1);
}

function getSession(sessionId, db, callback) {
  db.models.Session.findById(sessionId, (err, session) => {
    if (err) {
      return callback(err);
    } else if (session === null) {
      return callback('session is missing');
    } else {
      return callback(null, session);
    }
  });
}

function sendExperimentToBpu(experiment, bpu, socket, session, config, db, logger, callback) {
  async.waterfall([
    (callback) => {
      if (socket === null || socket === undefined) {
        return callback('socket is missing');
      }
      return callback(null);
    },
    (callback) => {
      experiment.exp_metaData.magnification = bpu.magnification;
      logger.info('events to run', experiment.exp_eventsToRun);

      bpu.socket.emit(config.socketRoutes.bpu.addExperiment, experiment, config.userConfirmationTimeout, callback);
    },
    (callback) => {
      //Save Exp
      let updateExperiment = {
        liveBpu: {
          id: bpu._id,
          name: bpu.name,
          index: bpu.index,
          socketId: bpu.soc,
        },
        exp_lastResort: experiment.exp_lastResort,
        bc_startSendTime: experiment.bc_startSendTime,
        bc_isLiveSendingToLab: true,
        exp_status: EXPERIMENT_STATUS.SERVING,
        exp_metaData: experiment.exp_metaData,
      };

      db.models.BpuExperiment.findByIdAndUpdate(experiment.id, updateExperiment, {new: true}, callback);

    },
    (updatedExperiment, callback) => {
      if (updatedExperiment === null) {
        logger.error('updated Experiment is null');
        callback('updated Experiment is null');
      }

      return callback(null, updatedExperiment);
    },
    (updatedExperiment, callback) => {
      let updatedSession = {
        liveBpuExperiment: {
          id: updatedExperiment.id,
          tag: updatedExperiment.getExperimentTag(),
        },
        bc_startSendTime: updatedExperiment.bc_startSendTime,
        bc_isLiveSendingToLab: true,
      };

      db.models.Session.findByIdAndUpdate(experiment.session.id, updatedSession, {new: true}, callback);
    },
    (session, callback) => {
      if (session === null) {
        logger.error('session is missing');
        return callback(err);
      }

      return callback(null, session);
    }
  ], (err, result) => {
    if (err) {
      return callback(err);
    } else {
      callback(null, result);
    }
  });
}

function activeExperiment(session, webClients, bpu, config, logger, callback) {
  async.some(webClients, (clientSocket, callback) => {
    if (clientSocket.connected) {

      clientSocket.emit('activateLiveUser', session, config.userConfirmationTimeout, (result) => {
        if (result.err || !result.didConfirm) {
          return callback(false);
        } else {
          //todo
          // app.bpuLedsSetMatch[session.sessionID] = app.bpuLedsSetFuncs[bpu.name];

          bpu.socket.emit(config.socketRoutes.bpu.runExperiment, (bpuRunResObj) => {
            if (bpuRunResObj.err) {
              logger.error(err);
              return callback(false);
            } else {
              clientSocket.emit('sendUserToLiveLab', session, (userSendResObj) => {
                if (userSendResObj.err) {
                  logger.error(err);
                  return callback(false);
                } else {
                  return callback(true);
                }
              });
            }
          });
        }
      });
    }
    else {
      return callback(false);
    }

  }, (confirmed) => {
    if (!confirmed) {
      logger.log('********* Nobody Confirmed **********');

      bpu.socket.emit(config.socketRoutes.bpu.reset, !confirmed, session.sessionID, (err) => {
        return callback(err);
      });
    }
    return callback(null);
  });
}

function passiveExperiment(session, socket, config, callback) {
  socket.emit(config.socketRoutes.bpu.runExperiment, (bpu) => {
    if (bpu.err) {
      return callback(bpu.err);
    }
  });

  return callback(null, session);
}

function pushExperimentToBPU(experiment, bpu, sockets, config, logger, callback) {
  async.series([
    (callback) => {
      getSession(experiment.session.id, callback);
    },
    (session, callback) => {
      sendExperimentToBpu(experiment, bpu.doc, bpu.socket, session, callback);
    },
    (session, callback) => {
      if (experiment.group_experimentType === 'live') {
        activeExperiment(session, sockets, bpu, config, logger, callback);
      } else {
        passiveExperiment(session, bpu.socket, config, callback);
      }
    }
  ], (err, session) => {
    if (err) {
      return callback(err);
    } else {
      callback(null, session);
    }
  });
}

