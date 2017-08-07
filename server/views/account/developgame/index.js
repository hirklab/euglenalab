'use strict';
var async = require('async');
var fs = require('fs');
var glob = require('glob');

var gameFileNames = '';

// Functions for saving game files.

exports.savefile = function(req, res) {
  console.log("Saving game code...");
  var fileName = "NO_NAME_ASSIGNED";
  if (req.body.fileName.length > 1) {
    fileName = req.body.fileName;
  }
  var filePath = __dirname + "/games/" + req.body.userName + "/" + fileName;
  var gameFileToSave = req.body.varCode + "-----" + req.body.runCode
                                        + "-----" + req.body.startCode
                                        + "-----" + req.body.endCode
                                        + "-----" + req.body.joystickCode
                                        + "-----" + req.body.keypressCode;
  fs.writeFile (filePath, gameFileToSave, function(err) {
      if (err) throw err;
      console.log('game file writing complete');
  });
  res.json('success writing game');
};

exports.getgamecode = function(req, res) {
  console.log("Getting game code...");
  var fileIndex = req.body.gameIndex;
  var gameFileNamesFixed = gameFileNames.split(';').slice(1, -1);
  var fileToOpen = gameFileNamesFixed[parseInt(fileIndex)];
  var filePath = "";
  // Check user specific path.
  fs.readdir(__dirname + "/games/" + req.body.userName + "/", function(err, files) {
    if (err) {} //throw err;
    files.forEach(function(file) {
      console.log(file + "aaaaaaaaaa");
      if (file === fileToOpen) {
        filePath = __dirname + "/games/" + req.body.userName + "/" + fileToOpen;
      }
    });
    // Check example code path.
    fs.readdir(__dirname + "/games/", function(err, files) {
      if (err) {} //throw err;
      files.forEach(function(file) {
        console.log(file + "bbbbbbbbbb");
        if (file === fileToOpen) {
          filePath = __dirname + "/games/" + fileToOpen;
        }
      });
      // Open file.
      console.log('Opening file: ' + filePath + '---' + fileToOpen);
      fs.readFile(filePath, 'utf8', function (err, data) {
        if (err) throw err;
        var returnVal = data + "-----" + fileToOpen;
        res.json(returnVal);
      });
    });
  });
};

// Functions for saving user-defined files.

exports.writeuserfile = function(req, res) {
  console.log("Writing user's file...");
  var filePath = __dirname + "/userfiles/" + req.body.fileName;
  var userFileToSave = req.body.userText;
  var fileMode = req.body.fileMode;
  if (fileMode === 'FILE.OVERWRITE') {
    fs.writeFile (filePath, userFileToSave, function(err) {
      if (err) throw err;
      console.log('user file writing complete');
    });
  } else if (fileMode === 'FILE.APPEND') {
    fs.appendFile (filePath, userFileToSave, function(err) {
      if (err) throw err;
      console.log('user file writing complete');
    });
  }
  
  res.json('success writing user file');
};

exports.readuserfile = function(req, res) {
  console.log("Reading user's file...");
  var fileToOpen = req.body.userFile;
  var filePath = __dirname + "/userfiles/" + fileToOpen;
  console.log('Opening file: ' + filePath);
  fs.readFile(filePath, 'utf8', function (err, data) {
    if (err) throw err;
    res.json(data);
  });
};

// Functions for getting user demographic data.

exports.isuserdemographicsaved = function(req, res) {
  console.log("Checking if user has demographic info saved...");
  glob(__dirname + "/userdata/" + req.body.userName + "_demographics.txt", function (er, files) {
    console.log("MATCHING FILES: " + files);
    if (files.length > 0) {
      res.json('true');
    } else {
      res.json('false');
    }
  });
};

exports.saveuserdemographicinfo = function(req, res) {
  console.log("Saving user's demographic info...");
  var filePath = __dirname + "/userdata/" + req.body.userName + "_demographics.txt";
  var fileToSave = "Name: " + req.body.fullName +
                    "\nAge: " + req.body.age + 
                    "\nProgramming: " + req.body.programExp + 
                    "\nJavaScript: " + req.body.jsExp + 
                    "\nBiology: " + req.body.bioExp;
  fs.writeFile (filePath, fileToSave, function(err) {
      if (err) throw err;
      console.log('game file writing complete');
  });
  res.json('success');
};

// Functions for user logging.

exports.loguserdata = function(req, res) {
  var filePath = __dirname + "/userdata/" + req.body.fileName;
  var userFileToSave = req.body.logTimestamp + "::: " + req.body.logText;

  fs.appendFile (filePath, userFileToSave, function(err) {
    if (err) throw err;
    console.log('logging file writing complete');
  });
  
  res.json('success writing logging data');
};


exports.init = function(req, res, next) {


  var outcome = {};
  outcome.session = null;
  var getSessionData = function(callback) {
    if (req.sessionID === null || req.sessionID === undefined) {
      return callback('not authorized. no sessionid');
    } else {
      req.app.db.models.Session.findOne({
        sessionID: req.sessionID
      }, {}, function(err, session) {
        if (err) {
          return callback('getSessionData err:' + err);
        } else if (session === null || session === undefined) {
          return callback('getSessionData session is dne');
        } else {
          outcome.sess = session;
          return callback(null);
        }
      });
    }
  };

  outcome.user = null;
  var getUserData = function(callback) {
    req.app.db.models.User.findById(outcome.sess.user.id, {}, function(err, userDoc) {
      console.log("USER DATA::: " + userDoc);
      if (err) {
        return callback('getUser err:' + err);
      } else if (userDoc === null) {
        return callback('getUser err:' + 'userDoc===null');
      } else {
        outcome.user = userDoc;
        return callback(null);
      }
    });
  };
  outcome.exp = null;
  outcome.setLedsObj = null;
  var getExperimentData = function(callback) {
    req.app.db.models.BpuExperiment.findById(outcome.sess.liveBpuExperiment.id, {}, function(err, bpuExpDoc) {
      if (err) {
        return callback('getBpuExperiment err:' + err);
      } else if (bpuExpDoc === null) {
        return callback('getBpuExperiment err:' + 'bpuExpDoc===null');
      } else {
        outcome.exp = bpuExpDoc;
        outcome.setLedsObj = outcome.exp.getDataObjToSetLeds();
        return callback(null);
      }
    });
  };
  outcome.bpu = null;
  outcome.webStreamUrl = null;
  outcome.sideStreamUrl = null;

  var getLengthScale100um = function(zoom) {
    // in percentage with respect to 640
    return Math.round((((30.0 * zoom) / 4.0) * 100.0) / 640.0);
  }
  var getBpuData = function(callback) {
    req.app.db.models.Bpu.findById(outcome.exp.liveBpu.id, {}, function(err, bpuDoc) {
      if (err) {
        return callback('getBpu err:' + err);
      } else if (bpuDoc === null) {
        return callback('getBpu err:' + 'bpuDoc===null');
      } else {
        outcome.bpu = bpuDoc;
        if (bpuDoc.magnification !== null) {
          outcome.lengthScale100um = getLengthScale100um(bpuDoc.magnification);
        } else {
          outcome.lengthScale100um = 'Unknown'
        }

        outcome.webStreamUrl = bpuDoc.getWebStreamUrl();
        outcome.sideStreamUrl = bpuDoc.getSideStreamUrl();
        return callback(null);
      }
    });
  };
  var setupDiv = function(callback) {
    _setupDiv(outcome.user.username, function(err, divInfo, renderJade) {
      if (err) {
        return callback('setupDiv err:' + err);
      } else {
        outcome.divInfo = divInfo;
        outcome.renderJade = renderJade;
        return callback(null);
      }
    });
  };
  var getGameNames = function(callback) {
    var gameNames = ';';
    if (!fs.existsSync(__dirname + "/games/" + outcome.user.username + "/")) {
      fs.mkdirSync(__dirname + "/games/" + outcome.user.username + "/");
    }
    fs.readdir(__dirname + "/games/" + outcome.user.username + "/", function(err, files) {
      files.forEach(function(file) {
        console.log(file);
        if (!fs.lstatSync(__dirname + "/games/" + outcome.user.username + "/" + file).isDirectory()) {
          gameNames += file + ';';
        }
      });
      fs.readdir(__dirname + "/games/", function(err, files2) {
        files2.forEach(function(file2) {
          console.log(file2);
          if (!fs.lstatSync(__dirname + "/games/" + file2).isDirectory()) {
            gameNames += file2 + ';';
          }
        });
        outcome.gameNames = gameNames;
        gameFileNames = gameNames;
        return callback(null);
      });
    });
  };
  var seriesFuncs = [];
  seriesFuncs.push(getSessionData);
  seriesFuncs.push(getUserData);
  seriesFuncs.push(getExperimentData);
  seriesFuncs.push(getBpuData);
  seriesFuncs.push(setupDiv);
  seriesFuncs.push(getGameNames);
  async.series(seriesFuncs, function(err) {
    if (err) {
      return next(err);
    } else {
      var startingAlpha = 0.0;
      res.render(outcome.renderJade, {
        data: {
          gameNames: escape(JSON.stringify(outcome.gameNames)),
          user: escape(JSON.stringify(outcome.user)),
          bpu: escape(JSON.stringify(outcome.bpu)),
          lengthScale100um: escape(JSON.stringify(outcome.lengthScale100um)) + '%',
          bpuExp: escape(JSON.stringify(outcome.exp)),
          session: escape(JSON.stringify(outcome.sess)),
          divInfo: outcome.divInfo,
          lightData: {
            topValue: 0,
            rightValue: 0,
            bottomValue: 0,
            leftValue: 0,
            topLightAlpha: startingAlpha,
            rightLightAlpha: startingAlpha,
            bottomLightAlpha: startingAlpha,
            leftLightAlpha: startingAlpha
          },
          timeLeftInLab: {
            jadeName: 'timeLeftInLab',
            value: 'Lab Time Remaining:' + 'Calculating...'
          },
          bpuName: outcome.bpu.name,
          mainImageIP: outcome.webStreamUrl,
          sideImageIP: outcome.sideStreamUrl,
          setLedsObj: escape(JSON.stringify(outcome.setLedsObj)),
          survey: {
            rating: 0,
            // euglena_moving: null,
            notes: null
          }
        },
      });
    }
  });
};
var _getStatusOfBpu = function(app, bpuDoc, timeout, callback) {
  var foundSocket = null;
  for (var ind = 0; ind < app.bpusConnected.length; ind++) {
    if (app.bpusConnected[ind].bpuDoc.name === bpuDoc.name) {
      foundSocket = app.bpusConnected[ind].socket;
    }
  }
  if (foundSocket !== null) {
    var didCallback = false;
    setTimeout(function() {
      if (!didCallback) {
        didCallback = true;
        callback('timed out', null);
      }
    }, timeout);
    foundSocket.emit(app.mainConfig.socketStrs.bpu_getStatus, function(err, resObj) {
      if (!didCallback) {
        didCallback = true;
        callback(err, resObj);
      }
    });
  } else {
    callback('no socket for bpu', null);
  }
};

var _setupDiv = function(username, callback) {
  var renderJade = 'account/developgame/index';
  var divInfo = {
    mainRowWidth: '75%',
    mainRowHeight: '480px',

    mainColWidth: '75%',
    mainColHeight: '100%',

    lightLong: '90%',
    lightShort: '5%',

    imageWidth: '90%',
    imageHeight: '90%',

    hasAside: true,

    asideColWidth: '25%',
    asideColHeight: '100%',

    sideImageWidth: '100%',
    sideImageHeight: '50%',

    joystickWidth: '100%',
    joystickHeight: '50%',
  };
  if (!divInfo.hasAside) {
    divInfo.mainColWidth = '100%';
  }
  callback(null, divInfo, renderJade);
};