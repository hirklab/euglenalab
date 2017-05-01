'use strict';
/*
{ "_id" : ObjectId("555111f340b0a14830372d12") }
{ "_id" : ObjectId("55515b348061d07c4f4cc972") }
{ "_id" : ObjectId("55524844996d80183f7fe8c8") }
*/
var SETPATH_ID = '55524844996d80183f7fe8c8';
var SETPATH_ID_foldername = '1431368261012';
var async = require('async');

exports.init = function(req, res, next) {
  var outcome = {};
  var getAccountData = function(callback) {
    req.app.db.models.Account.findById(req.user.roles.account.id, 'user imageSetPath').exec(function(err, account) {
      if (err) {
        return callback(err, null);
      } else {
        outcome.account = account;
        return callback(null, account);
      }
    });
  };
  var getUserData = function(callback) {
    req.app.db.models.User.findById(req.user.id, 'username').exec(function(err, user) {
      if (err) {
        callback(err, null);
      } else {
        outcome.user = user;
        return callback(null, user);
      }
    });
  };
  var getImageSet = function(id, callback) {
    req.app.db.models.ImageSet.findById(id, '').exec(function(err, imageset) {
      if (err) {
        callback(err, null);
      } else {
        outcome.imageset = imageset;
        callback(null, imageset);
      }
    });
  };
  var getSetPathAndImageset = function(callback) {
    req.app.db.models.SetPath.findById(SETPATH_ID, '').exec(function(err, setpath) {
      if (err) {
        callback(err, null);
      } else {
        outcome.setpath = setpath;
        //Get SetPath ImageSet 
        getImageSet(outcome.setpath.imageset.id, function(err, imageset) {
          outcome.imageset = imageset;
          return callback(null, {
            setpath: setpath,
            imageset: imageset
          });
        });
      }
    });
  };
  var getNewModelParameters = function(callback) {
    req.app.db.models.ModelParameters.find({
      'user.sessionID': req.sessionID
    }, {}, function(err, docs) {
      if (err) {
        console.log('get model paratemers for sesion error:' + err);
        outcome.newModelParameters = req.app.db.models.ModelParameters();
        return callback(null);
      } else if (docs.length > 0) {
        if (false) {
          docs.sort(function(objA, objB) {
            return objA.creationTime - objB.creationTime;
          });
          docs.forEach(function(doc) {
            console.log(docs[0].creationTime, doc.saveType);
            console.log('\tsurge', doc.surgeName[0], doc.surge[0]);
            console.log('\tcoupling', doc.couplingName[0], doc.coupling);
            console.log('\troll', doc.rollName[0], doc.roll[0]);
          });
          console.log('0', docs[0].creationTime, docs[0].saveType);
          console.log(docs.length, docs[docs.length - 1].creationTime, docs[docs.length - 1].saveType);
        }

        docs.sort(function(objA, objB) {
          return objB.creationTime - objA.creationTime;
        });

        var newDoc = req.app.db.models.ModelParameters();
        newDoc.creationTime = new Date().getTime();
        newDoc.saveType = 'refresh';
        newDoc.user.id = outcome.user._id;
        newDoc.user.sessionID = req.sessionID;
        newDoc.user.name = outcome.user.username;
        newDoc.surge = docs[0].surge;
        newDoc.coupling = docs[0].coupling;
        newDoc.roll = docs[0].roll;
        newDoc.surgeName = docs[0].surgeName;
        newDoc.couplingName = docs[0].couplingName;
        newDoc.rollName = docs[0].rollName;
        newDoc.save(function(err, savedDoc) {
          if (err) {
            console.log('get model paratemers save new error:' + err);
            outcome.newModelParameters = newDoc;
          } else {
            outcome.newModelParameters = savedDoc;
          }
          return callback(null);
        });
      } else {
        var newDoc = req.app.db.models.ModelParameters();
        newDoc.creationTime = new Date().getTime();
        newDoc.user.sessionID = req.sessionID;
        newDoc.save(function(err, savedDoc) {
          if (err) {
            console.log('get model paratemers save new error2:' + err);
            outcome.newModelParameters = newDoc;
          } else {
            outcome.newModelParameters = savedDoc;
          }
          return callback(null);
        });
      }
    });
  };

  var asyncFinally = function(err, results) {
    if (err) {
      return next(err);
    }

    outcome.account.modelImageSetPath = '/media/ModelImageSets' + '/' + '1431368261012';

    //Strip out unused images
    var usedImages = [];
    outcome.setpath.points.sort(function(a, b) {
      return a.frameNumber - b.frameNumber;
    });
    var firstFrame = Number(outcome.setpath.points[0].frameNumber);
    var lastFrame = Number(outcome.setpath.points[outcome.setpath.points.length - 1].frameNumber);
    var firstTime = Number(outcome.setpath.points[0].timestamp);
    var lastTime = Number(outcome.setpath.points[outcome.setpath.points.length - 1].timestamp);

    if (outcome.imageset && outcome.imageset.images) {
      outcome.imageset.images.forEach(function(item) {
        if (Number(item.frameNumber) >= firstFrame && Number(item.frameNumber) <= lastFrame) {
          item.path = outcome.account.modelImageSetPath + '/' + item.filename;
          usedImages.push(item);
        }
      });
      outcome.imageset.images = usedImages;
      //Make Active Image the first one
      outcome.imageset.activeImage = outcome.imageset.images[0];
    }

    if (outcome.imageset && outcome.imageset.lightData) {
      //Strip out unused light data
      var usedLightData = [];
      outcome.imageset.lightData.forEach(function(item) {
        if (Number(item.timestamp) >= firstTime && Number(item.timestamp) <= lastTime) {
          usedLightData.push(item);
        }
      });
      outcome.imageset.lightData = usedLightData;
    }

    if (outcome.imageset) {
      outcome.newModelParameters.imageset.id = outcome.imageset._id;
      outcome.newModelParameters.imageset.folderName = outcome.imageset.folderName;
      outcome.newModelParameters.setpath.id = outcome.setpath._id;
      outcome.newModelParameters.setpath.pathName = outcome.setpath.pathName;

      //Log ModelParameters
      outcome.imageset.displayName = outcome.imageset.displayName.split('GMT')[0];
    }


    res.render('account/modelling/index', {
      data: {
        user: escape(JSON.stringify(outcome.user)),
        account: escape(JSON.stringify(outcome.account)),
        imageset: escape(JSON.stringify(outcome.imageset)),
        setpath: escape(JSON.stringify(outcome.setpath)),
        modelParameters: escape(JSON.stringify(outcome.newModelParameters)),
      },
    });
  };

  async.parallel([
    getAccountData,
    getUserData,
    getSetPathAndImageset,
    getNewModelParameters,
  ], asyncFinally);
};

exports.update = function(req, res, next) {
  console.log('update');
  var outcome = {};
  var workflow = req.app.utility.workflow(req, res);
  var updateModelParameters = function(callback) {
    console.log('updateModelParameters');
    var newDoc = outcome.newModelParameters = req.app.db.models.ModelParameters();
    newDoc.creationTime = new Date().getTime();
    newDoc.saveType = 'renderRefresh';
    newDoc.user.sessionID = req.body.user.sessionID;
    // newDoc.user.id=req.body.user.id;
    // newDoc.user.name=req.body.user.name;
    newDoc.user.name = req.body.actualUser.username;
    newDoc.user.id = req.body.actualUser._id;
    newDoc.surge = req.body.surge;
    newDoc.coupling = req.body.coupling;
    newDoc.roll = req.body.roll;
    newDoc.surgeName = req.body.surgeName;
    newDoc.couplingName = req.body.couplingName;
    newDoc.rollName = req.body.rollName;
    newDoc.save(function(err, savedDoc) {
      if (err) {
        console.log('get model paratemers save new error:' + err);
        outcome.newModelParameters = newDoc;
      } else {
        outcome.newModelParameters = savedDoc;
      }
      return callback(null);
    });
  };

  var asyncFinally = function(err, results) {
    if (err) {
      console.log('update asyncFinally err: ', err);
    } else {
      workflow.on('patchAccount', function() {
        if (err) {
          console.log('err', err);
        }
        console.log('asyncFinally reponse');
        workflow.outcome.modelParameters = outcome.newModelParameters;
        return workflow.emit('response');
      });
      workflow.emit('patchAccount');
    }
  };

  async.parallel([updateModelParameters], asyncFinally);
};

exports.saveModelParameters = function(req, res, next) {
  console.log('saveModelParameters');
  //Save Change
  var lastChangeObj = {
    time: new Date().getTime(),
    type: 'server:saveModelParameters'
  };
  req.body.changesBeforeRun.push(lastChangeObj);

  var outcome = {};
  var saveModelParameters = function(callback) {
    var modelParametersSaved = req.app.db.models.ModelParameters();
    //Kepp Old Parameters
    Object.keys(req.body).forEach(function(item) {
      if (item !== '_id') {
        modelParametersSaved[item] = req.body[item];
      }
    });
    modelParametersSaved.save(function(err, dat) {
      if (err) {
        console.log('saveModelParameters modelParametersSaved err: ', err);
      } else {
        ModelParameters
        console.log('saveModelParameters modelParametersSaved: ', dat.id);
        outcome.modelParametersSaved = modelParametersSaved;
        callback(null, saveModelParameters);
      }
    });

  };
  var getNewModelParameters = function(callback) {
    var modelParametersNew = req.app.db.models.ModelParameters();
    console.log('save new modelparameers', modelParametersNew._id);
    if (modelParametersNew === null || modelParametersNew === undefined) {
      return callback('could not make new model parameters?', null);
    }
    modelParametersNew.user.id = req.user.id;
    modelParametersNew.user.name = req.user.username;
    modelParametersNew.imageset.id = 'Not Set';
    modelParametersNew.imageset.folderName = 'Not Set';

    //Save Change
    var changeObj = {
      time: new Date().getTime(),
      type: 'server:saveModelParameters:getNewModelParameters'
    };

    modelParametersNew.changesBeforeRun.push(changeObj);

    outcome.modelParametersNew = modelParametersNew;
    callback(null, modelParametersNew);
  };
  var workflow = req.app.utility.workflow(req, res);
  workflow.on('patchAccount', function() {
    saveModelParameters(function(err, savedModelParameters) {
      getNewModelParameters(function(err, modelParameters) {
        console.log('save again? new modelparameers', modelParameters._id);
        //Kepp Old Parameters
        Object.keys(req.body).forEach(function(item) {
          modelParameters[item] = req.body[item];
        });
        //modelParameters.modelCase=2;
        if (err) {
          console.log('err', err);
        }
        workflow.outcome.modelParameters = modelParameters;
        return workflow.emit('response');
      });
    });
  });
  workflow.emit('patchAccount');
};