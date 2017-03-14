import async from 'async';
import mongoose from 'mongoose';

function submitExperiment(auth, queue, db, callback) {
  let outcome = {};
  outcome.validationObjs = [];
  outcome.validationPassedCnt = 0;

  async.series([
    (callback) => {
      findSession(auth, queue, db, callback)
    },
    (session, callback) => {
      parseQueue(queue, session, auth, callback)
    }
  ], (err) => {
    if (err) {
      return callback(err, outcome.validationObjs);
    } else {
      if (outcome.validationObjs.length === 0) {
        return callback('no validation objects', outcome.validationObjs);
      } else if (outcome.validationPassedCnt === 0) {
        return callback('no validation objects passed', outcome.validationObjs);
      } else {
        return callback(null, outcome.validationObjs);
      }
    }
  });
}

function findSession(auth, queue, db, callback) {
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

function parseQueueData(data, session, auth, db, callback) {
  let validationObj = {};
  validationObj.errs = [];

  if (!auth.arePassKeysOpen) {
    let foundPassKey = false;

    for (let ind = 0; ind < auth.PassKeys.length; ind++) {
      if (auth.PassKeys[ind] === session.sessionID) {
        foundPassKey = true;
        break;
      }
    }

    if (!foundPassKey) {
      validationObj.errs.push('arePassKeysOpen:false and passkey not found');
    }
  }

  let newBpuExp = db.models.BpuExperiment();
  if (session.user) {
    if (typeof session.user.id === 'string') {
      newBpuExp.user.id = new mongoose.ObjectId(session.user.id);
    } else {
      newBpuExp.user.id = session.user.id;
    }

    newBpuExp.user.name = session.user.name;

    if (session.user.groups) {
      newBpuExp.user.groups = session.user.groups;
    }
    else {
      validationObj.errs.push('no user groups');
    }

  } else {
    validationObj.errs.push('no user');
  }

  //Session
  if (session) {

    if (session.id) {
      if (typeof session.id === 'string') {
        newBpuExp.session.id = new app.runParams.mongooseObjID(session.id);
      } else {
        newBpuExp.session.id = session.id;
      }
    }
    else {
      validationObj.errs.push('no session id');
    }

    if (session.sessionID) {
      newBpuExp.session.sessionID = session.sessionID;
    }
    else {
      validationObj.errs.push('no session sessionID');
    }

    newBpuExp.session.socketID = session.socketID;
    newBpuExp.session.socketHandle = session.socketHandle;

  } else {
    validationObj.errs.push('no session');
  }

  //Other
  if (data.group_experimentType) {
    newBpuExp.group_experimentType = data.group_experimentType;
  }
  else {
    validationObj.errs.push('no group_experimentType');
  }

  newBpuExp.exp_wantsBpuName = data.exp_wantsBpuName;
  newBpuExp.exp_metaData = data.exp_metaData;
  newBpuExp.bc_serverInfo = auth;

  //Many Check on events to run
  if (data.exp_eventsToRun) {
    if (data.exp_eventsToRun.forEach) {
      newBpuExp.exp_eventsToRun = data.exp_eventsToRun;
    } else {
      validationObj.errs.push('exp_eventsToRun is not array');
    }
  } else {
    validationObj.errs.push('no exp_eventsToRun');
  }

  //Validate New Experiment and finalize and save
  validationObj.expInfo = app.db.models.BpuExperiment.validate(newBpuExp);

  validationObj._id = newBpuExp._id;
  validationObj.group_experimentType = newBpuExp.group_experimentType;
  validationObj.exp_wantsBpuName = newBpuExp.exp_wantsBpuName;
  validationObj.exp_metaData = newBpuExp.exp_metaData;

  validationObj.wasSaved = false;
  validationObj.saveErr = null;

  validationObj.wasTagged = false;
  validationObj.tagErr = null;

  if (validationObj.expInfo.isValid && validationObj.errs.length === 0) {
    newBpuExp.exp_eventsToRun = data.exp_eventsToRun;
    newBpuExp.exp_eventsRunTime = data.exp_eventsRunTime;
    newBpuExp.tag = newBpuExp.getExperimentTag();
    newBpuExp.exp_submissionTime = new Date().getTime();

    newBpuExp.save(function (err, savedExp) {
      if (err) {
        validationObj.saveErr = 'could not save new exp err:' + err;
        outcome.validationObjs.push(validationObj);
        callback(null);
      } else {
        validationObj.wasSaved = true;
        app.db.models.ListExperiment.addNewExpTagToList(savedExp.tag, function (err) {

          if (err) {
            validationObj.tagErr = 'could not save new exp tag err:' + err;
            outcome.validationObjs.push(validationObj);
            callback(null);
          } else {
            validationObj.wasTagged = true;
            outcome.validationPassedCnt++;
            outcome.validationObjs.push(validationObj);
            callback(null);
          }
        });
      }
    });
  } else {
    outcome.validationObjs.push(validationObj);
    callback(null);
  }
}

function parseQueue(queue, session, auth, callback) {
  let parallelFuncs = [];
  queue.forEach((data) =>{
    parallelFuncs.push((callback)=>{
      parseQueueData(data, session, auth, callback)
    });
  });

  async.parallel(parallelFuncs, (err) => {
    if (err) {
      callback(err);
    } else {
      callback(null);
    }
  });
}

export {submitExperiment};





