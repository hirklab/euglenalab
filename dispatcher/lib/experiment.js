import async from 'async';
import _ from 'lodash';
import mongoose from 'mongoose';
import logger from './logging';

var logName = '[Experiment] ';

function submitExperiment(auth, queue, db, callback) {
  logger.debug(`${logName} got a new experiment`);

  let validations = [];

  async.waterfall([
    (cb) => {
      findSession(auth, queue, validations, db, cb)
    },
    (session, cb) => {
      validateAll(queue, session, validations, auth, db, cb)
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

function findSession(auth, queue, validations, db, callback) {
  logger.debug(`${logName} finding session information...`);

  let sessionID = null;
  let username = null;
  let groups = null;

  if (auth.arePassKeysOpen) {
    logger.debug(`${logName} passkeys are open`);
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

function validateAll(queue, session, validations, auth, db, callback) {
  logger.debug(`${logName} parsing experiment...`);

  let workflow = [];
  queue.forEach((data) => {
    logger.debug(`${data}`);
    workflow.push((cb) => {
      validate(data, session, validations, auth, db, cb);
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

function validate(data, session, validations, auth, db, callback) {
  logger.debug(`${logName} validating experiment...`);
  logger.debug(`${session}`);

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
    logger.debug(`${logName} validation pass`);
    logger.debug(validation);

    experiment.exp_eventsToRun = data.exp_eventsToRun;
    experiment.exp_eventsRunTime = data.exp_eventsRunTime;
    experiment.tag = experiment.getExperimentTag();
    experiment.exp_submissionTime = new Date().getTime();

    experiment.save((err, savedExperiment) => {
      if (err) {
        logger.error(`${logName} validation failed while save`);
        validation.saveErr = err;
        validations.push(validation);
        return callback(null, false);
      } else {
        validation.wasSaved = true;
        db.addBPUExperimentToQueue(savedExperiment.tag, (err) => {
          if (err) {
            logger.error(`${logName} validation failed while tagging`);
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
    logger.error(`${logName} validation failed`);
    logger.debug(validation);

    validations.push(validation);
    return callback(null, false);
  }
}


export {
  submitExperiment
};
