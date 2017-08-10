"use strict";

var async      = require('async');
var os         = require('os');
var fs         = require('fs');
var http       = require('http');
var publicIp   = require('public-ip');
var internalIp = require('internal-ip');
var exec       = require('child_process').exec;
var socketIO   = require('socket.io');
var lodash     = require('lodash');

var logger            = require('./logging');
var constants         = require('./constants');
var EVENTS            = constants.EVENTS;
var STATES            = constants.STATES;
var MESSAGES          = constants.MESSAGES;
var EXPERIMENT_STATUS = constants.EXPERIMENT_STATUS;

var Board = require('./board');

function Microscope(ip, port, hid, name) {
	this.hid  = hid;
	this.name = name;

	this.ip     = ip;
	this.port   = parseInt(port, 10);
	this.url    = null;
	this.server = null;
	this.client = null; // only controller connects for now,
                        // todo: change this to list when multiple controllers can connect,
                        // cloud based resource sharing

	this.errors = [];  // {type, message}

	// only state gets pushed to upstream
	// PUSH ONLY RELEVANT DATA IN STATE
	this.state            = {};
	this.state.hid        = hid;
	this.state.name       = name;
	this.state.status     = STATES.CONNECTING;
	this.state.connected  = false;
	this.state.experiment = null;

	this.board = new Board();
	this.board.configure();
}

Microscope.prototype.initialize = function () {
	var that = this;

	var httpServer = http.createServer(function (req, res) {
		res.writeHead(200, {
			'Content-Type': 'application/json',
		});
		res.end();
	});

	httpServer.listen(that.port, that.ip);

	that.server = socketIO(httpServer);

	process.on('SIGINT', function () {
		logger.warn("shutting down...");
		that.onDisconnected('manual interrupt');

		process.exit(1);
	});

	that.server.on(EVENTS.CONNECT, that.onConnected.bind(that));
};

Microscope.prototype.onConnected = function (socket) {
	var that = this;

	that.url = 'http://' + that.ip + ":" + that.port;
	logger.info('microscope ' + that.name + ' connected at ' + that.url);

	socket.on(EVENTS.MESSAGE, that.onMessage.bind(that));

	socket.on(EVENTS.ERROR, that.onError.bind(that));

	socket.on(EVENTS.DISCONNECT, that.onDisconnected.bind(that));

	that.state.connected = true;

	if (that.state.status === STATES.CONNECTING) {
		that.state.status = STATES.IDLE;
	}

	that.sendMessage(MESSAGES.STATUS, that.status());

	that.client = socket;
};

Microscope.prototype.onStatus = function (payload) {
	var that = this;

	// todo get estimate of time left if experiment running

	that.sendMessage(MESSAGES.STATUS, that.status());
};

Microscope.prototype.onExperimentSet = function (payload) {
	var that = this;

	if (that.isAvailable()) {

		//reset board
		that.board.configure();

		that.state.status = STATES.QUEUED;

		var experiment = payload.experiment;
		// todo: create a folder to save
		// todo: get events to run
		experiment.status      = EXPERIMENT_STATUS.QUEUED;
		experiment.submittedAt = new Date();

		that.state.experiment = experiment;
	} else {
		// already has experiment -> faillll


	}
};

Microscope.prototype.onExperimentCancel = function (payload) {
	if (this.isQueued() || this.isRunning()) {
		this.state.experiment.status      = EXPERIMENT_STATUS.CANCELLED;
		this.state.experiment.cancelledAt = new Date();

		// todo save this experiment

		this.state.experiment = null;

		// todo : other cleanup activities

		//reset board
		this.board.configure();
		this.state.status = STATES.IDLE;
	}
};

Microscope.prototype.onExperimentRun = function (payload) {

	// todo keep updating queueTime

	// 	if (!app.didConfirmTimeoutRun && app.exp !== null) {
	// 		app.didConfirmRun = true;
	//
	// 		//If Live Add setleds
	// 		if (app.exp.group_experimentType === 'live') {
	// 			//Set LEDs
	// 			var ledsSet = function (lightData, cb_fn) {
	// 				//Init
	// 				var emitStr = app.socketStrs.bpu_runExpLedsSet;
	// 				var retStr  = emitStr + 'Res';
	// 				var resObj  = {err: null, bpuStatus: app.bpuStatus};
	//
	// 				//Log
	// 				//app.logger.info(moduleName+' '+emitStr);
	//
	// 				//Run
	// 				var timeNow       = new Date().getTime();
	// 				lightData.setTime = timeNow;
	// 				var doReset       = false;
	// 				resObj            = app.bpu.ledsSet(lightData, doReset);
	// 				resObj.err        = null;
	// 				app.exp.exp_eventsRan.push(resObj);
	// 				//Return
	// 				if (typeof cb_fn === 'function') cb_fn(resObj.err, resObj);
	// 			};
	//
	// 			//Listener
	// 			socket.on(app.socketStrs.bpu_runExpLedsSet, ledsSet);
	// 		}
	//
	// 		//Run
	// 		var options = {};
	// 		app.logger.debug(moduleName + ' script_runExperiment start');
	// 		app.script_runExperiment(app, deps, options, app.exp, function (err) {
	// 			app.logger.debug(moduleName + ' script_runExperiment end');
	//
	// 			//If Live Add setleds
	// 			if (app.exp.group_experimentType === 'live') {
	// 				socket.removeListener(app.socketStrs.bpu_runExpLedsSet, ledsSet);
	// 			}
	//
	// 			if (err) {
	// 				app.logger.error(moduleName + ' script_runExperiment ' + err);
	// 			} else {
	// 				// if no error set flag for pick, used in get status ping
	// 				if (app.bpuStatus === app.bpuStatusTypes.finalizingDone) {
	// 					app.isExperimentOverAndWaitingForPickup = true;
	// 				}
	// 			}
	// 		});
	//
	// 		//Return
	// 		if (typeof callback === 'function') callback({err: null});
	// 	} else {
	// 		//Return
	// 		if (typeof callback === 'function') callback('already canceled', null);
	// 	}

	//Series Vars
	// var outcome = {};
	// var num = 0;
	//
	// //Series Funcs
	// var checkExp = function(callback) {
	// 	num++;
	// 	var fName = num + ' checkExp';
	// 	app.logger.debug(moduleName + ' ' + fName + ' ' + 'start');
	//
	// 	app.exp.exp_eventsToRun.sort(function(objA, objB) {
	// 		return objA.time - objB.time;
	// 	});
	// 	app.logger.trace(moduleName + ' ' + fName + ' ' + 'app.exp.group_experimentType:' + app.exp.group_experimentType);
	// 	app.logger.trace(moduleName + ' ' + fName + ' ' + 'app.exp.eventsToRun:' + app.exp.exp_eventsToRun.length);
	// 	app.logger.trace(moduleName + ' ' + fName + ' ' + 'app.exp.exp_metaData:' + app.exp.exp_metaData);
	// 	var retObj = _checkEventsArray(JSON.parse(JSON.stringify(app.exp.exp_eventsToRun)));
	// 	if (retObj.err) {
	// 		app.bpuStatus = app.bpuStatusTypes.runningFailed;
	// 		return callback('fName ' + retObj.err);
	// 	} else {
	// 		app.exp.exp_eventsToRunFinal = retObj.eventsToRun;
	// 		return callback(null);
	// 	}
	// };
	// var experimentLoop = function(callback) {
	// 	num++;
	// 	var fName = num + ' experimentLoop';
	// 	app.logger.debug(moduleName + ' ' + fName + ' ' + 'start');
	//
	// 	//Start Web Cam and Run Light Events
	// 	toggleWebCamSave(_ToggleCameraOn, function(err) {
	// 		if (err) {
	// 			err = fName + ' ' + _ToggleCameraOn + ' ' + err;
	// 			app.logger.error(err);
	// 			return callback(err);
	// 		} else {
	// 			initializeProjector(function(err, projector) {
	// 				if (err) {
	// 					console.log("==== projector failed ====");
	// 					console.log(err);
	// 					err = fName + ' initializeProjector ' + err;
	// 					return callback(err);
	// 				} else {
	// 					app.projector = projector;
	// 				}
	// 			});
	//
	// 			//Small Wait for camera lead in
	// 			setTimeout(function() {
	// 				//Run Experiment
	// 				app.exp.exp_runStartTime = new Date().getTime();
	// 				app.exp.exp_eventsToRunFinal.sort(function(objA, objB) {
	// 					return objA.time - objB.time;
	// 				});
	// 				app.logger.trace(moduleName + ' ' + fName + ' ' + 'app.exp.exp_eventsToRunFinal:' + app.exp.exp_eventsToRunFinal.length);
	// 				app.logger.trace(moduleName + ' ' + fName + ' ' + 'final events runTime:' + (app.exp.exp_eventsToRunFinal[app.exp.exp_eventsToRunFinal.length - 1].askTime));
	// 				var evtCounter = 0;
	// 				var runInt = setInterval(function() {
	// 					var timeNow = new Date().getTime();
	// 					var dtStart = timeNow - app.exp.exp_runStartTime;
	// 					var doReset = false;
	// 					if (dtStart > (app.exp.exp_eventsToRunFinal[0].askTime - 10)) {
	// 						var evt = app.exp.exp_eventsToRunFinal.shift();
	// 						evt.setTime = dtStart;
	// 						evtCounter++;
	// 						var msg = evt.setTime + ":" + evt.topValue + ", " + evt.rightValue + ", " + evt.bottomValue + ", " + evt.leftValue + ", " + evt.diffuserValue + ", " + evt.backlightValue + ", " + evt.culturelightValue + ", " + evt.ambientlightValue + ", " + evt.projectorX + ", " + evt.projectorY + ", " + evt.projectorColor + ", " + evt.projectorClear;
	// 						app.logger.info('in:::' + fName + ' ' + evtCounter + '(' + msg + ')');
	//
	// 						var ranEvent = app.bpu.ledsSet(evt, doReset);
	// 						app.exp.exp_eventsRan.push(ranEvent);
	//
	// 						if (app.exp.exp_eventsToRunFinal.length === 0) {
	// 							clearInterval(runInt);
	// 							//Stop Camera
	// 							toggleWebCamSave(_ToggleCameraOff, function(err) {
	// 								if (err) {
	// 									err = fName + ' ' + _ToggleCameraOff + ' ' + err;
	// 									app.logger.error(err);
	// 								}
	// 								app.exp.exp_runEndTime = timeNow;
	// 								app.exp.exp_eventsRan.sort(function(objA, objB) {
	// 									return objA.time - objB.time;
	// 								});
	//
	// 								app.logger.trace(moduleName + ' ' + fName + ' ' + 'app.exp.exp_eventsRan:' + app.exp.exp_eventsRan.length);
	// 								app.logger.trace(moduleName + ' ' + fName + ' ' + 'actual events runTime:' + (dtStart));
	// 								app.logger.trace(moduleName + ' ' + fName + ' ' + 'expected events runTime:' + (app.exp.exp_eventsRan[app.exp.exp_eventsRan.length - 1].askTime));
	// 								return callback(null);
	// 							});
	// 						}
	// 					}
	// 				}, 20);
	// 			}, 2000);
	// 		}
	// 	});
	// };
	//
	// var finalizeData = function(callback) {
	//
	// 	app.bpuStatus = app.bpuStatusTypes.finalizing;
	// 	num++;
	// 	var fName = num + ' finalizeData';
	// 	// app.logger.debug(moduleName + ' ' + fName + ' ' + 'start');
	// 	// app.logger.trace(moduleName + ' ' + fName + ' ' + 'app.exp.group_experimentType:' + app.exp.group_experimentType);
	// 	// app.logger.trace(moduleName + ' ' + fName + ' ' + 'app.exp.eventsToRun:' + app.exp.exp_eventsToRun.length);
	// 	// app.logger.trace(moduleName + ' ' + fName + ' ' + 'app.exp.exp_eventsToRunFinal:' + app.exp.exp_eventsToRunFinal.length);
	// 	// app.logger.trace(moduleName + ' ' + fName + ' ' + 'app.exp.exp_eventsRan:' + app.exp.exp_eventsRan.length);
	// 	// app.logger.trace(moduleName + ' ' + fName + ' ' + 'app.exp.exp_metaData:' + app.exp.exp_metaData);
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
	// //Build Series
	// var funcs = [];
	// funcs.push(checkExp);
	// funcs.push(experimentLoop);
	// funcs.push(finalizeData);
	// funcs.push(movePackageToMountedDrive);
	//
	// //Start Series
	// var startDate = new Date();
	// app.logger.info(moduleName + ' start');
	// app.async.series(funcs, function(err) {
	// 	app.logger.info(moduleName + ' end in ' + (new Date() - startDate) + ' ms');
	// 	if (err) {
	// 		mainCallback(err);
	// 	} else {
	// 		mainCallback(null);
	// 	}
	// });
};

Microscope.prototype.onStimulus = function (payload) {
	var that = this;

	if (that.isRunning()) {

		if ('event' in payload) {
			that.onExecuteEvent(payload.event);
		}
	}
}

Microscope.prototype.onExecuteEvent = function (payload) {
	var that = this;

	var currentTime = new Date();

	lodash.each(payload, function (device) {
		that.board.setDevice(device.name, device.value);
	});

	that.state.experiment.actualEvents.push({
		time:  currentTime,
		event: payload
	});
}

Microscope.prototype.onExperimentClear = function (payload) {
	var that = this;

	if (that.isRunning()) {
		that.state.experiment.status      = EXPERIMENT_STATUS.EXECUTED;
		that.state.experiment.completedAt = new Date();

		// todo save that experiment


		// todo : other cleanup activities

		//reset board
		that.board.configure();
		that.state.experiment    = null;
		that.state.allowStimulus = false;
		that.state.status        = STATES.IDLE;
	}

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
};

Microscope.prototype.onMaintenance = function (payload) {
	var that = this;
	if (that.isAvailable()) {
		var duration = 1; // default duration of 1 ms  // todo push it to config

		that.state.status = STATES.MAINTENANCE;

		if ('devices' in payload) {
			var devices = payload.devices;

			lodash.each(devices, function (device) {
				that.board.setDevice(device.name, device.value);
			});
		}

		if ('flush' in payload) {
			var flush = payload.flush;
			that.board.flush(flush.duration);
			duration = flush.duration;
		}

		setTimeout(function () {
			that.state.status = STATES.IDLE;
		}, duration);
	}
};

Microscope.prototype.onDisconnected = function (reason) {
	var that = this;

	logger.error('disconnected due to ' + reason);

	that.state.status    = STATES.CONNECTING;
	that.state.connected = false;

	that.sendMessage(MESSAGES.STATUS, that.status());
};

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

Microscope.prototype.onMessage = function (message) {
	var that = this;

	var type    = message.type;
	var payload = message.payload;

	logger.info('=============[C » M]=============');
	logger.info('type: ', type);
	if (payload) logger.info('payload: ', payload);

	switch (type) {
		case MESSAGES.STATUS:
			that.onStatus(payload);
			break;

		case MESSAGES.EXPERIMENT_SET:
			that.onExperimentSet(payload);
			break;

		case MESSAGES.EXPERIMENT_CANCEL:
			that.onExperimentCancel(payload);
			break;

		case MESSAGES.EXPERIMENT_RUN:
			that.onExperimentRun(payload);
			break;

		case MESSAGES.STIMULUS:
			that.onStimulus(payload);
			break;

		case MESSAGES.EXPERIMENT_CLEAR:
			that.onExperimentClear(payload);
			break;

		case MESSAGES.MAINTENANCE:
			that.onMaintenance(payload);
			break;

		default:
			logger.error('invalid message: message type not handled');
			break;
	}
};

Microscope.prototype.onError = function (payload) {
	logger.error(payload)
};

Microscope.prototype.sendMessage = function (type, payload) {
	var newMessage     = {};
	newMessage.type    = type;
	newMessage.payload = payload;

	logger.debug('=============[M » C]=============');
	logger.debug('type: ', type);

	if (newMessage.payload) {
		logger.debug('payload: ', newMessage.payload);
	}

	this.server.emit(EVENTS.MESSAGE, newMessage);
};

Microscope.prototype.status = function () {
	return this.state;
};

Microscope.prototype.isAvailable = function () {
	return (this.state.status === STATES.IDLE);
};

Microscope.prototype.isRunning = function () {
	return (this.state.status === STATES.RUNNING);
};

Microscope.prototype.isQueued = function () {
	return (this.state.status === STATES.QUEUED);
};

Microscope.prototype.getPublicIP = function () {
	publicIp.v4().then(function (ip) {
		this.state.publicAddress = {
			ip:         ip,
			port:       0,      //todo
			cameraPort: 20005   // todo
		};

		//this.sendMessage(MESSAGE.STATUS, this.status());
	});
};

Microscope.prototype.getLocalIP = function () {
	this.state.localAddress = {
		ip:         internalIp.v4(),
		port:       8090,
		cameraPort: 8080
	};
};

module.exports = Microscope;


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