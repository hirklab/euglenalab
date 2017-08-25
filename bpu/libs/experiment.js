function Experiment(){

}

Experiment.prototype.save = function(){

};

// mark experiment done and continue with post processing
// see if it can be kept in processing queue or pass this part to controller

// var finalizeData = function(callback) {
//
// 	app.bpuStatus = app.bpuStatusTypes.finalizing;
// 	num++;
// 	var fName = num + ' finalizeData';
//
// 	app.exp.exp_metaData.numFrames = -1;
// 	deps.fs.readdir(app.expDataDir, function(err, files) {
// 		if (err) {
// 			app.exp.exp_metaData.numFrames = -1;
// 		} else {
// 			var jpgs = files.filter(function(filename) {
// 				return filename.search('.jpg') > -1;
// 			});
// 			app.exp.exp_metaData.numFrames = jpgs.length;
// 		}
// 		app.db.BpuExperiment.save(app.exp, function(err) {
// 			if (err) {
// 				return callback('script_fakeMongo ' + err);
// 			} else {
// 				return callback(null);
// 			}
// 		});
// 	});
//
// };
// var movePackageToMountedDrive = function(callback) {
// 	num++;
// 	var fName = num + ' movePackageToMountedDrive';
// 	app.logger.debug(moduleName + ' ' + fName + ' ' + 'start');
//
// 	//Directories
// 	var saveImageFolder = app.expDataDir || '/home/pi/bpuData/tempExpData';
// 	var finalPath = app.mountedDataDir + '/' + app.exp._id;
// 	//Commands
// 	//var rmPreCmd='rm -r '+finalPath;
// 	var mkdirCmd = 'mkdir ' + finalPath;
// 	//var changeOwnershipCmd='chown pi:bpudata '+finalPath;   //change ownership was removed since we're not running under sudo
// 	var moveCmd = 'cp ' + saveImageFolder + '/' + '*' + ' ' + finalPath;
// 	var rmTempFiles = 'rm ' + saveImageFolder + '/*.jpg' + ' && ' + 'rm ' + saveImageFolder + '/*.json';
// 	//Final and Run
// 	//var cmdStr=mkdirCmd+' && '+changeOwnershipCmd+' && '+moveCmd+ ' && '+rmTempFiles;
// 	var cmdStr = mkdirCmd + ' && ' + moveCmd + ' && ' + rmTempFiles;
// 	runBashCommand(cmdStr, function(err) {
// 		if (err) {
// 			app.bpuStatus = app.bpuStatusTypes.finalizingFailed;
// 			app.bpuStatusError = fName + ' ' + err;
// 			err = fName + ' ' + err;
// 			return callback(err);
// 		} else {
// 			app.bpuStatus = app.bpuStatusTypes.finalizingDone;
// 			return callback(null);
// 		}
// 	});
// };

// var finishInit = function () {
// 	//Series Vars
// 	var outcome = {};
// 	var num = 0;
//
// 	//Series Funcs
//
// 	var checkDataFolders = function (callback) {
// 		num++;
// 		var options = {
// 			fName: moduleName + ' ' + num + '. checkDataFolders',
// 			timeoutInterval: 5000
// 		};
// 		var action = function (cb_fn) {
// 			var fldsToCheck = [
// 				app.mainDataDir,
// 				app.expDataDir,
// 				app.mountedDataDir,
// 			];
// 			_checkFolders(fldsToCheck, function (err) {
// 				cb_fn(err);
// 			});
// 		};
// 		app.logger.trace(options.fName + ' start');
// 		app.myFunctions.asyncFunctionTemplate(options, action, function (err) {
// 			app.logger.trace(options.fName + ' end');
// 			if (err) {
// 				return callback(options.fName + ' ' + err);
// 			} else {
// 				return callback(null);
// 			}
// 		});
// 	};
//
// 	var clearTempFolder = function (callback) {
// 		num++;
// 		var options = {
// 			fName: moduleName + ' ' + num + '. clearTempFolder',
// 			timeoutInterval: 5000
// 		};
// 		var action = function (cb_fn) {
// 			_clearTempFolder(app.expDataDir, function (err) {
// 				cb_fn(err);
// 			});
// 		};
// 		app.logger.trace(options.fName + ' start');
// 		app.myFunctions.asyncFunctionTemplate(options, action, function (err) {
// 			app.logger.trace(options.fName + ' end');
// 			if (err) {
// 				return callback(options.fName + ' ' + err);
// 			} else {
// 				return callback(err);
// 			}
// 		});
// 	};
//
// 	var resetBpuData = function (callback) {
// 		num++;
// 		var options = {
// 			fName: moduleName + ' ' + num + '. resetBpuData',
// 			timeoutInterval: 5000
// 		};
// 		var action = function (cb_fn) {
// 			//Other
// 			app.bpu.startTime = null;
// 			app.exp = null;
// 			app.didConfirmRun = false;
// 			app.didConfirmTimeoutRun = false;
// 			//Zero Leds Control
// 			var doReset = true;
// 			app.bpu.ledsSet(null, doReset);
// 			cb_fn(null);
// 		};
// 		app.logger.trace(options.fName + ' start');
// 		app.myFunctions.asyncFunctionTemplate(options, action, function (err) {
// 			app.logger.trace(options.fName + ' end');
// 			if (err) {
// 				return callback(options.fName + ' ' + err);
// 			} else {
// 				return callback(err);
// 			}
// 		});
// 	};
//
// 	var checkFlush = function (callback) {
// 		num++;
// 		var options = {
// 			fName: moduleName + ' ' + num + '. checkFlush',
// 			timeoutInterval: 5000
// 		};
// 		if (o_doFlushFlag) options.timeoutInterval = 2 * o_flushTime;
// 		var action = function (cb_fn) {
// 			//Check Flush
// 			if (o_doFlushFlag) {
// 				app.bpu.startFlush({
// 					flushTime: o_flushTime
// 				}, function () {
// 					cb_fn(null);
// 				});
// 			} else {
// 				cb_fn(null);
// 			}
// 		};
// 		app.logger.trace(options.fName + ' start');
// 		app.myFunctions.asyncFunctionTemplate(options, action, function (err) {
// 			app.logger.trace(options.fName + ' end');
// 			if (err) {
// 				return callback(options.fName + ' ' + err);
// 			} else {
// 				return callback(null);
// 			}
// 		});
// 	};
//
// 	//Build Series
// 	var funcs = [];
// 	funcs.push(checkDataFolders);
// 	funcs.push(clearTempFolder);
// 	funcs.push(resetBpuData);
// 	funcs.push(checkFlush);
//
// 	//Start Series
// 	var startDate = new Date();
// 	app.logger.info(moduleName + ' start');
// 	app.async.series(funcs, function (err) {
// 		app.logger.info(moduleName + ' end in ' + (new Date() - startDate) + ' ms');
// 		if (err) {
// 			app.bpuStatus = app.bpuStatusTypes.resetingFailed;
// 			app.bpuStatusError = err;
//
// 			mainCallback(err);
// 		} else {
// 			app.bpuStatus = app.bpuStatusTypes.resetingDone;
// 			mainCallback(null);
// 		}
// 	});
// };


// todo look into this function
Microscope.prototype.onSaveExperiment = function (exp) {
	"use strict";

	var o_savePath = options.savePath || '/home/pi/bpuData/tempExpData';

	if (exp !== null) {
		exp.exp_metaData.saveTime          = new Date();
		exp.exp_metaData.lightDataSoapPath = o_savePath + "/" + "lightdata.json";
		exp.exp_metaData.lightDataPath     = o_savePath + "/" + "lightdata_meta.json";
		var saveName                       = exp._id || "noExpId";
		var saveFullPath                   = o_savePath + "/" + saveName + ".json";
		exp.exp_metaData.ExpFullPath       = saveFullPath;
		exp.exp_metaData.ExpName           = saveName;
		//Save Full Exp Schema
		fs.writeFile(exp.exp_metaData.ExpFullPath, JSON.stringify(exp, null, 4), function (err) {
			if (err) {
				callback('writeFile ExpFullPath ' + err, null);
			} else {
				//Save Exp Light Data with Meta
				var lightDataWithMeta = {
					metaData:    exp.exp_metaData,
					eventsToRun: exp.exp_eventsRan,
				};

				fs.writeFile(exp.exp_metaData.lightDataPath, JSON.stringify(lightDataWithMeta, null, 4), function (err) {
					if (err) {
						callback('writeFile lightDataPath ' + err, null);
					} else {
						//Save Exp Light Data
						var lightData = {
							eventsToRun: exp.exp_eventsRan,
						};
						fs.writeFile(exp.exp_metaData.lightDataSoapPath, JSON.stringify(lightData, null, 4), function (err) {
							if (err) {
								callback('writeFile lightDataSoapPath ' + err, null);
							} else {
								callback(null, exp);
							}
						});
					}
				});
			}
		});
	}
};




// //Main Functions
// _checkFolders = function (fldsToCheck, callback) {
// 	var checkFolders = function () {
// 		if (fldsToCheck.length > 0) {
// 			var fld = fldsToCheck.shift();
// 			_fs.stat(fld, function (err, dat) {
// 				if (err) {
// 					callback(err);
// 				} else {
// 					_app.logger.warn('perm: '+ '0' + (dat.mode & parseInt('777', 8)).toString(8));
// 					_app.logger.warn('required: '+ '0' + (16895 & parseInt('777', 8)).toString(8));
//
// 					if (dat.mode !== 16895 && dat.mode !== 16893) {
// 						callback(fld + ':fs stat mode(' + dat.mode + ')for folder is not 16895');
// 					} else {
// 						checkFolders();
// 					}
// 				}
// 			});
// 		} else {
// 			callback(null);
// 		}
// 	};
// 	checkFolders();
// };
//
// _clearTempFolder = function (tempDataDir, callback) {
// 	var cmdStr = 'rm ' + tempDataDir + '/*.jpg' + ' && ' + 'rm ' + tempDataDir + '/*.json';
// 	runBashCommand(cmdStr, function (err, stdout) {
// 		if (err) _app.logger.warn('(usually okay folder may be empty is all)clearTempFolder ' + err);
// 		callback(null);
// 	});
// };
//
// //Other Functions
// var runBashCommand = function (cmdStr, callback) {
// 	var child = _exec(cmdStr, function (error, stdout, stderr) {
// 		if (error !== null) {
// 			callback('error: ' + stderr, stdout);
// 		} else if (stderr) {
// 			callback('stderr: ' + stderr, stdout);
// 		} else if (stdout) {
// 			callback(null, stdout);
// 		} else {
// 			callback(null, null);
// 		}
// 	});
// };


//General Functions
// var runBashCommand = function(cmdStr, callback) {
// 	var child = _exec(cmdStr, function(error, stdout, stderr) {
// 		if (error !== null) {
// 			callback('error: ' + stderr, stdout);
// 		} else if (stderr) {
// 			callback('stderr: ' + stderr, stdout);
// 		} else if (stdout) {
// 			callback(null, stdout);
// 		} else {
// 			callback(null, null);
// 		}
// 	});
// };
//
// //Side Func - Part of Socket*****Add Exp
// var EventKeys = ['topValue', 'rightValue', 'bottomValue', 'leftValue', 'diffuserValue', 'backlightValue', 'culturelightValue', 'ambientlightValue', 'projectorX', 'projectorY', 'projectorColor', 'projectorClear'];
// var checkEventValues = function(evt) {
// 	var returnEvent = {
// 		time: evt.time,
// 		topValue: 0,
// 		rightValue: 0,
// 		bottomValue: 0,
// 		leftValue: 0,
// 		diffuserValue: 0,
// 		backlightValue: 0,
// 		culturelightValue: 0,
// 		ambientlightValue: 0,
// 		projectorX: -1,
// 		projectorY: -1,
// 		projectorColor: 0,
// 		projectorClear: 0
// 	};
//
// 	EventKeys.forEach(function(key) {
// 		var value = evt[key];
// 		if (value === null || value === undefined || isNaN(Number(value))) {
// 			returnEvent[key] = 0;
// 		} else if (value <= 0) {
// 			returnEvent[key] = 0;
// 		} else if (value >= 100) {
// 			returnEvent[key] = 100;
// 		} else {
// 			returnEvent[key] = value;
// 		}
// 	});
// 	return returnEvent;
// };
// var _checkEventsArray = function(eventsToRun) {
// 	var MaxExperimentTime = 5 * 60 * 1000; //5 minutes
// 	var MinTimeBetweenEvents = 10; //ms
//
// 	var org_eventsToRun = JSON.parse(JSON.stringify(eventsToRun));
// 	var final_eventsToRun = [];
// 	var ErrStr = null;
//
// 	//Check eventsToRun is Array
// 	if (org_eventsToRun === null || org_eventsToRun === undefined) ErrStr = 'no eventsToRun';
// 	else if (typeof org_eventsToRun.forEach !== 'function') ErrStr = 'eventsToRun is not array';
// 	else if (org_eventsToRun.length < 2) ErrStr = 'eventsToRun needs at least two objects';
//
// 	//Check individual events and strip bad
// 	if (ErrStr === null) {
// 		var keeperEvents = [];
// 		try {
// 			//Check Each Event
// 			org_eventsToRun.forEach(function(evt) {
// 				if (evt.time !== null && evt.time !== undefined && !isNaN(Number(evt.time)) && evt.time >= 0) {
// 					var retEvt = checkEventValues(evt);
// 					if (retEvt !== null) {
// 						keeperEvents.push(retEvt);
// 					}
// 				}
// 			});
// 			//Recheck Events for at least 2 or more
// 			if (keeperEvents.length >= 2) {
// 				//Make Times Relative
// 				keeperEvents.sort(function(objA, objB) {
// 					return objA.time - objB.time;
// 				});
// 				var zeroTime = keeperEvents[0].time;
// 				keeperEvents.forEach(function(evt) {
// 					evt.askTime = evt.time - zeroTime;
// 					evt.setTime = -1;
// 				});
// 				//Strip over max time and events too close to eachother
// 				var lastTime = -1000;
// 				keeperEvents.forEach(function(evt) {
// 					//Max Time Keep
// 					if (evt.askTime <= MaxExperimentTime) {
// 						//between interval
// 						if ((evt.askTime - lastTime) > MinTimeBetweenEvents) {
// 							lastTime = evt.askTime;
// 							final_eventsToRun.push(evt);
// 						}
// 					}
// 				});
// 			} else {
// 				ErrStr = 'mapped eventsToRun returned with less than two objects';
// 			}
// 		} catch (err) {
// 			ErrStr = 'catchErr ' + err;
// 		} finally {
// 			//Check eventsToRun is Array
// 			if (org_eventsToRun === null || org_eventsToRun === undefined) ErrStr = 'no eventsToRun';
// 			else if (typeof org_eventsToRun.forEach !== 'function') ErrStr = 'eventsToRun is not array';
// 			else if (org_eventsToRun.length < 2) ErrStr = 'eventsToRun needs at least two objects';
// 		}
// 	}
// 	return {
// 		err: ErrStr,
// 		eventsToRun: final_eventsToRun
// 	};
// };
// var setNewExperiment = function(newExp, callback) {
// 	var savePath = mongoose.getSavePath();
// 	var saveName = newExp._id + "_" + newExp.user.name + ".json";
// 	savePath = savePath + "/" + saveName;
// 	newExp.bpuFakeMongoFilename = saveName;
// 	newExp.bpuFakeMongoPath = savePath;
//
// 	newExp.bpuInfo = {
// 		nameBpu: app.bpuConfig.name,
// 		useBpu: newExp.bpuInfo.useBpu,
// 	};
//
// 	newExp.debugSettings = {
// 		doSkipAuto: app.config.doSkipAuto,
// 		doFakeLeds: app.config.doFakeLeds,
// 		doFakeScripts: app.config.doFakeScripts,
// 		doFakeBpu: app.config.doFakeBpu,
// 		doCamera: app.config.doCamera,
// 	};
// 	var setGroupFlags = function(cb_fn) {
// 		var compiledSettings = {};
// 		Object.keys(newExp.groupSettings).forEach(function(key) {
// 			if (key.search('_') === -1) {
// 				compiledSettings[key] = false;
// 			}
// 		});
// 		//Filter Groups by bpu
// 		var tempGroups = JSON.parse(JSON.stringify(newExp.usergroups));
// 		var groups = [];
// 		tempGroups.forEach(function(tg) {
// 			app.bpuConfig.allowedGroups.forEach(function(ag) {
// 				if (tg === ag) {
// 					groups.push(tg);
// 				}
// 			});
// 		});
// 		//Set Group permissions
// 		var didFindOneGroup = false;
// 		var findNext = function() {
// 			if (groups.length > 0) {
// 				var grp = groups.shift();
// 				app.db.models.Group.findOne({
// 					name: grp
// 				}, {}, function(err, data) {
// 					if (data && data.settings) {
// 						didFindOneGroup = true;
// 						keys = Object.keys(data.settings);
// 						keys.forEach(function(key) {
// 							if (!compiledSettings[key] && data.settings[key]) {
// 								compiledSettings[key] = data.settings[key];
// 							}
// 						});
// 					}
// 					findNext();
// 				});
// 			} else {
// 				if (didFindOneGroup) {
// 					newExp.groupSettings = compiledSettings;
// 					cb_fn(null);
// 				} else {
// 					cb_fn('groups not recognized');
// 				}
// 			}
// 		};
// 		if (groups.length > 0) {
// 			findNext();
// 		} else {
// 			cb_fn('no groups');
// 		}
// 	};
// 	setGroupFlags(function(err) {
// 		if (err) {
// 			callback(err, null);
// 		} else {
// 			app.db.models.BpuExperiment.save(newExp, function(err, dat) {
// 				if (err) {
// 					callback('setNewExperiment asyncFinally could not save err:' + err, null);
// 				}
// 				callback(null, newExp);
// 			});
// 		}
// 	});
// };