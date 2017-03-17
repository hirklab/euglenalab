import async from 'async';
import _ from 'lodash';
import mongoose from 'mongoose';

function submitExperiment(auth, queue, db, callback) {
  let validations = [];

  async.series([
    (callback) => {
      findSession(auth, queue, validations, db, callback)
    },
    (session, callback) => {
      parseQueue(queue, session, validations, auth, callback)
    }
  ], (err, valid) => {
    if (err) {
      return callback(err, validations);
    } else {
      if (validations.length === 0) {
        return callback('no validations exist', validations);
      } else if (!valid) {
        return callback('validation failed', validations);
      } else {
        return callback(null, validations);
      }
    }
  });
}

function findSession(auth, queue, validations, db, callback) {
  let sessionID = null;
  let username = null;
  let groups = null;

  if (auth.arePassKeysOpen) {
    if (queue.length > 0 && queue[0].session && queue[0].session.sessionID !== null) {
      sessionID = queue[0].session.sessionID;

      let firstItem = queue[0];

      if ((firstItem.user !== null) && (firstItem.user.name !== null )) {
        if (firstItem.user.groups !== null) {
          username = firstItem.user.name;
          groups = firstItem.user.groups;
        }
        else {
          return callback('group information missing');
        }
      }
      else {
        return callback('user information missing');
      }
    }
  } else {
    sessionID = auth.PassKeys[0];
  }

  db.getSession(sessionID, (err, session)=> {
    if (err) {
      return callback(err);
    } else if (session === null || session === undefined) {
      db.saveSession(sessionID,username, groups, (err, savedDoc)=>{
        if (err) {
          return callback(err);
        } else {
          callback(null, savedDoc);
        }
      });

    } else {
      callback(null, session);
    }
  });
}

function parseQueue(queue, session, validations, auth, callback) {
  let workflow = [];
  queue.forEach((data) =>{
    workflow.push((callback)=>{
      parseQueueData(data, session, validations, auth, db, callback)
    });
  });

  async.parallel(workflow, (err) => {
    if (err) {
      callback(err);
    } else {
      callback(null);
    }
  });
}

function parseQueueData(data, session, validations, auth, db, callback) {
  let validation = {};
  validation.errs = [];

  if (!auth.arePassKeysOpen) {
    let filteredKeys = _.filter(auth.PassKeys, (o)=>{
      return o === session.sessionID;
    });

    if (!filteredKeys.length>0) {
      validation.errs.push('Passkey not found');
    }
  }

  let experiment = db.getRawBPUExperiment();

  if (session.user) {
    if (typeof session.user.id === 'string') {
      experiment.user.id = new mongoose.ObjectId(session.user.id);
    } else {
      experiment.user.id = session.user.id;
    }

    experiment.user.name = session.user.name;

    if (session.user.groups) {
      experiment.user.groups = session.user.groups;
    }
    else {
      validation.errs.push('user groups missing from session');
    }
  } else {
    validation.errs.push('user missing from session');
  }

  if (session) {
    if (session.id) {
      if (typeof session.id === 'string') {
        experiment.session.id = new mongoose.ObjectId(session.id);
      } else {
        experiment.session.id = session.id;
      }
    }
    else {
      validation.errs.push('session id missing');
    }

    if (session.sessionID) {
      experiment.session.sessionID = session.sessionID;
    }
    else {
      experiment.errs.push('no session sessionID');
    }

    experiment.session.socketID = session.socketID;
    experiment.session.socketHandle = session.socketHandle;

  } else {
    validation.errs.push('session missing');
  }

  //Other
  if (data.group_experimentType) {
    experiment.group_experimentType = data.group_experimentType;
  }
  else {
    validation.errs.push('experiment type missing');
  }

  experiment.exp_wantsBpuName = data.exp_wantsBpuName;
  experiment.exp_metaData = data.exp_metaData;
  experiment.bc_serverInfo = auth;

  //todo
  // add new variables here related to experiment

  if (data.exp_eventsToRun) {
    if (data.exp_eventsToRun.forEach) {
      experiment.exp_eventsToRun = data.exp_eventsToRun;
    } else {
      validation.errs.push(`invalid events in experiment ${data.exp_eventsToRun}`);
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
    experiment.exp_eventsToRun = data.exp_eventsToRun;
    experiment.exp_eventsRunTime = data.exp_eventsRunTime;
    experiment.tag = experiment.getExperimentTag();
    experiment.exp_submissionTime = new Date().getTime();

    experiment.save(function (err, savedExperiment) {
      if (err) {
        validation.saveErr = err;
        validations.push(validation);
        callback(null,false);
      } else {
        validation.wasSaved = true;
        db.addBPUExperimentToQueue(savedExperiment.tag, (err)=> {
          if (err) {
            validation.tagErr = err;
            validations.push(validation);
            callback(null, false);
          } else {
            validation.wasTagged = true;
            validations.push(validation);
            callback(null,true);
          }
        });
      }
    });
  } else {
    validations.push(validation);
    callback(null,false);
  }
}



export {submitExperiment};





