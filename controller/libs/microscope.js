"use strict";

var async = require('async');
var os    = require('os');
var fs    = require('fs');
var http  = require('http');
// var publicIp   = require('public-ip');
// var internalIp = require('internal-ip');
var exec           = require('child_process').exec;
var socketIOClient = require('socket.io-client');
var lodash         = require('lodash');
// var Queue          = require('bee-queue');


var logger    = require('./logging');
var config    = require('../config');
var constants = require('../constants');

var EVENTS   = constants.BPU_EVENTS;
var STATES   = constants.BPU_STATES;
var MESSAGES = constants.BPU_MESSAGES;

function Microscope(config) {
	var that           = this;
	that.id            = config.name; // use id everywhere to find this microscope
	that.name          = config.name;
	that.doc           = config.doc;
	that.address       = config.address;
	that.socket        = null;
	that.inactiveCount = 0;
	that.queueTime     = 0;
	that.messages      = [];
	that.isConnected   = false;
	that.status        = STATES.OFFLINE;
	// that.queue         = new Queue(that.name);

	// only expose this state - keep rest of variables as internal state
	that.state = {};

	that.connect(function (err) {
		if (err) {
			logger.error(err);
		}
	});
}

Microscope.prototype.connect = function (callback) {
	var that = this;

	// new connection to BPU
	if (that.socket == null) {
		that.socket = socketIOClient('http://' + that.doc.localAddr.ip + ':' + that.doc.localAddr.serverPort, {
			multiplex:    false,
			reconnection: true
		});

		that.socket.on(EVENTS.CONNECT, function () {
			logger.info('connected to microscope at ' + that.address);
			that.sendMessage(MESSAGES.STATUS, null);
		});

		that.socket.on(EVENTS.DISCONNECT, function (msg) {
			that.onDisconnected(null, false);
		});

		that.socket.on(EVENTS.MESSAGE, function (message) {
			if (message) {
				var type    = message.type;
				var payload = message.payload;

				logger.debug('====================================');
				logger.debug('[RX] ' + that.doc.name + ': ' + type);
				if (payload) logger.debug(Object.values(payload).join(' / '));

				switch (type) {
					case MESSAGES.CONNECTED:
						that.onConnected(payload);
						break;

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

					case MESSAGES.DISCONNECTED:
						that.onDisconnected(payload, null);
						break;

					default:
						logger.error('invalid message: message type not handled');
						break;
				}
			}
		});

		// todo remove this dependency
		// that.setStimulus = function (setStimulus) {
		// 	that.socket.emit(app.mainConfig.socketStrs.bpu_runExpLedsSet, setStimulus);
		// };

		callback(null);
	} else {

		// connection timed out
		if (that.inactiveCount > config.MICROSCOPE_INACTIVE_COUNT) {
			that.onDisconnected(null, true);
			callback('timeout');
		} else {
			// connection looks fine
			callback(null);
		}
	}
};

Microscope.prototype.onConnected = function (payload) {
	var that         = this;
	that.isConnected = true;
	that.status      = STATES.IDLE;
};

Microscope.prototype.onStatus = function (payload) {
	var that         = this;
	that.isConnected = true;
	that.status      = payload.status;
	that.state       = {
		id:that.id,
		name:that.name,
		status:that.status,
		experiment:payload.experiment,
		queueTime:payload.queueTime,
		isConnected:that.isConnected
	};

};

// Microscope.prototype.onExperimentSet = function(payload){
//
// }
//
// Microscope.prototype.onExperimentCancel = function(payload){
//
// }
//
// Microscope.prototype.onExperimentRun = function(payload){
//
// }
//
// Microscope.prototype.onStimulus = function(payload){
//
// }
//
// Microscope.prototype.onExecuteEvent = function(payload){
//
// }
//
// Microscope.prototype.onExperimentClear = function(payload){
//
// }
//
// Microscope.prototype.onMaintenance = function(payload){
//
// }

Microscope.prototype.onDisconnected = function (payload, timeout) {
	var that = this;

	// this.socket.disconnect();
	// this.socket = null;

	that.isConnected = false;

	if (timeout) {
		that.inactiveCount = 0;
	}

	that.status = STATES.OFFLINE;
};

// Microscope.prototype.onSaveExperiment = function (exp) {
// 	"use strict";
//
// 	var o_savePath = options.savePath || '/home/pi/bpuData/tempExpData';
//
// 	if (exp !== null) {
// 		exp.exp_metaData.saveTime          = new Date();
// 		exp.exp_metaData.lightDataSoapPath = o_savePath + "/" + "lightdata.json";
// 		exp.exp_metaData.lightDataPath     = o_savePath + "/" + "lightdata_meta.json";
// 		var saveName                       = exp._id || "noExpId";
// 		var saveFullPath                   = o_savePath + "/" + saveName + ".json";
// 		exp.exp_metaData.ExpFullPath       = saveFullPath;
// 		exp.exp_metaData.ExpName           = saveName;
// 		//Save Full Exp Schema
// 		fs.writeFile(exp.exp_metaData.ExpFullPath, JSON.stringify(exp, null, 4), function (err) {
// 			if (err) {
// 				callback('writeFile ExpFullPath ' + err, null);
// 			} else {
// 				//Save Exp Light Data with Meta
// 				var lightDataWithMeta = {
// 					metaData:    exp.exp_metaData,
// 					eventsToRun: exp.exp_eventsRan,
// 				};
//
// 				fs.writeFile(exp.exp_metaData.lightDataPath, JSON.stringify(lightDataWithMeta, null, 4), function (err) {
// 					if (err) {
// 						callback('writeFile lightDataPath ' + err, null);
// 					} else {
// 						//Save Exp Light Data
// 						var lightData = {
// 							eventsToRun: exp.exp_eventsRan,
// 						};
// 						fs.writeFile(exp.exp_metaData.lightDataSoapPath, JSON.stringify(lightData, null, 4), function (err) {
// 							if (err) {
// 								callback('writeFile lightDataSoapPath ' + err, null);
// 							} else {
// 								callback(null, exp);
// 							}
// 						});
// 					}
// 				});
// 			}
// 		});
// 	}
// };
//
//
// Microscope.prototype.handleMessage = function(message){
// 	var that = this;
//
// 	var type = message.type;
// 	var payload = message.payload;
//
// 	logger.debug('====================================');
// 	logger.debug('[RX] ' + type);
// 	logger.debug(payload);
//
// 	switch (type) {
// 		case MESSAGES.CONNECTED:
// 			that.onConnected(payload);
// 			break;
//
// 		case MESSAGES.STATUS:
// 			logger.debug('send status');
// 			that.onStatus(payload);
// 			break;
//
// 		case MESSAGES.EXPERIMENT_SET:
// 			that.onExperimentSet(payload);
// 			break;
//
// 		case MESSAGES.EXPERIMENT_CANCEL:
// 			that.onExperimentCancel(payload);
// 			break;
//
// 		case MESSAGES.EXPERIMENT_RUN:
// 			that.onExperimentRun(payload);
// 			break;
//
// 		case MESSAGES.STIMULUS:
// 			that.onStimulus(payload);
// 			break;
//
// 		case MESSAGES.EXPERIMENT_CLEAR:
// 			that.onExperimentClear(payload);
// 			break;
//
// 		case MESSAGES.MAINTENANCE:
// 			that.onMaintenance(payload);
// 			break;
//
// 		case MESSAGES.DISCONNECTED:
// 			that.onDisconnected(payload);
// 			break;
//
// 		default:
// 			logger.error('invalid message: message type not handled');
// 			break;
// 	}
// }
//
// Microscope.prototype.handleError = function(payload){
//
// }
//


Microscope.prototype.sendMessage = function (type, payload) {
	var newMessage     = {};
	newMessage.type    = type;
	newMessage.payload = payload;

	logger.debug('[TX -> M]: ' + this.name + ': ' + type);
	if (payload) logger.debug(payload);

	this.socket.emit(EVENTS.MESSAGE, newMessage, function (err) {
		if (err) {
			logger.error(err);
		}
	});
};

//
//
// Microscope.prototype.disconnect = function(payload){
//
// }
//
// Microscope.prototype.status = function () {
// 	return this.state;
// };
//
// Microscope.prototype.isAvailable = function () {
// 	return (this.state.status === STATES.IDLE);
// };
//
// Microscope.prototype.isRunning = function () {
// 	return (this.state.status === STATES.RUNNING);
// };
//
// Microscope.prototype.isQueued = function () {
// 	return (this.state.status === STATES.QUEUED);
// };
//
// Microscope.prototype.getPublicIP = function () {
// 	publicIp.v4().then(function (ip) {
// 		this.state.publicAddress = {
// 			ip:         ip,
// 			port:       0,
// 			cameraPort: 20005  // todo
// 		};
//
// 		//this.sendMessage(MESSAGE.STATUS, this.status());
// 	});
// };
//
// Microscope.prototype.getLocalIP = function () {
// 	this.state.localAddress = {
// 		ip:         internalIp.v4(),
// 		port:       0,
// 		cameraPort: 80
// 	};
// };
//
// Microscope.prototype.connect = function () {
// 	var that = this;
//
// 	var httpServer = http.createServer();
// 	httpServer.listen(that.port, that.ip);
//
// 	that.server = socketIO(httpServer);
//
// 	that.server.on(EVENTS.CONNECT, function (socket) {
// 		logger.info('microscope connected at '+ that.ip + ':'+ that.port);
//
// 		// socket.on(app.socketStrs.bpu_ping, function (callback) {
// 		// 	var emitStr = app.socketStrs.bpu_ping;
// 		// 	var retStr  = emitStr + 'Res';
// 		// 	var resObj  = {err: null, bpuStatus: app.bpuStatus};
// 		// 	//Log
// 		// 	//app.logger.info(moduleName+' '+emitStr);
// 		//
// 		// 	//Run
// 		//
// 		// 	//Return
// 		// 	socket.emit(retStr, resObj);
// 		// 	if (typeof callback === 'function') callback(resObj.err, resObj);
// 		// });
//
// 		socket.on(EVENTS.MESSAGE, that.handleMessage.bind(that));
//
// 		socket.on(EVENTS.ERROR, that.handleError.bind(that));
//
// 		that.state.connected = 1;
//
// 		if (that.state.status === STATES.CONNECTING) {
// 			that.state.status = STATES.IDLE;
// 		}
//
// 		that.sendMessage(MESSAGES.STATUS, that.status());
//
// 		// socket.on(app.socketStrs.bpu_getStatus, function (callback) {
// 		// 	//Init
// 		// 	var emitStr = app.socketStrs.bpu_getStatus;
// 		// 	var retStr  = emitStr + 'Res';
// 		// 	var resObj  = {
// 		// 		//id
// 		// 		index:       app.bpuConfig.index,
// 		// 		name:        app.bpuConfig.name,
// 		// 		//status
// 		// 		err:         null,
// 		// 		bpuStatus:   app.bpuStatus,
// 		// 		expOverId:   null,
// 		// 		//Exp
// 		// 		exp:         null,
// 		// 		expTimeLeft: 0
// 		// 	};
// 		//
// 		// 	//Log
// 		// 	//app.logger.info(moduleName+' '+emitStr+':'+app.bpuStatus);
// 		//
// 		// 	//Run
// 		// 	if (app.exp) {
// 		// 		resObj.exp = app.exp;
// 		// 		if (app.isExperimentOverAndWaitingForPickup) {
// 		// 			app.isExperimentOverAndWaitingForPickup = false;
// 		// 			resObj.expOverId                        = app.exp._id;
// 		// 			var opts                                = {};
// 		// 			app.logger.debug(moduleName + ' script_resetBpu ' + 'start');
// 		// 			app.script_resetBpu(app, deps, opts, function (err) {
// 		// 				app.logger.debug(moduleName + ' script_resetBpu ' + 'end');
// 		// 				if (err) {
// 		// 					app.logger.error(moduleName + ' script_resetBpu ' + err);
// 		// 				} else {
// 		// 					app.logger.debug(moduleName + ' run experiment done READY FOR Next EXPERIMENT');
// 		// 					callback(null);
// 		// 				}
// 		// 			});
// 		//
// 		// 			//While Bpu Has Exp: Check for Run Bad Status
// 		// 		} else {
// 		// 			if (app.bpuStatus === app.bpuStatusTypes.runningFailed) {
// 		// 				app.logger.error('app.exp***********Get Status Bpu Status ' + app.bpuStatus + ' Error*********' + app.bpuStatusError);
// 		// 				app.logger.error('app.exp           Make sure this is not a big deal and force reset here');
// 		//
// 		// 			} else if (app.bpuStatus === app.bpuStatusTypes.finalizingFailed) {
// 		// 				app.logger.error('app.exp***********Get Status Bpu Status ' + app.bpuStatus + ' Error*********' + app.bpuStatusError);
// 		// 				app.logger.error('app.exp           Make sure this is not a big deal and force reset here');
// 		//
// 		// 			} else if (app.bpuStatus === app.bpuStatusTypes.resetingFailed) {
// 		// 				app.logger.error('app.exp***********Get Status Bpu Status ' + app.bpuStatus + ' Error*********' + app.bpuStatusError);
// 		// 				app.logger.error('app.exp           Make sure this is not a big deal...reset is being forced');
// 		// 				app.script_resetBpu(app, deps, {}, function (err) {
// 		// 					app.logger.debug(moduleName + ' script_resetBpu ' + 'end');
// 		// 					if (err) {
// 		// 						app.logger.error(moduleName + 'app.exp force script_resetBpu ' + err);
// 		// 					} else {
// 		// 						app.logger.debug(moduleName + 'app.exp force reset done done READY FOR Next EXPERIMENT');
// 		// 						callback(null);
// 		// 					}
// 		// 				});
// 		//
// 		// 			} else {
// 		// 				console.log('1', app.exp_eventsRunTime, (new Date().getTime() - app.exp.exp_runStartTime));
// 		// 				resObj.expTimeLeft = app.exp_eventsRunTime || 0;
// 		// 				if (app.bpuStatus !== app.bpuStatusTypes.pendingRun) {
// 		// 					if (app.exp_eventsRunTime && app.exp.exp_runStartTime) {
// 		// 						resObj.expTimeLeft = app.exp_eventsRunTime - (new Date().getTime() - app.exp.exp_runStartTime);
// 		// 					}
// 		// 				}
// 		// 				app.logger.trace('Exp Time Left:' + resObj.expTimeLeft);
// 		// 			}
// 		// 		}
// 		//
// 		// 		//While Bpu Does Not Have Exp: Check for Bad Status
// 		// 	} else {
// 		//
// 		// 		if (app.bpuStatus === app.bpuStatusTypes.initializingFailed) {
// 		// 			app.logger.error('***********Get Status Bpu Status ' + app.bpuStatus + ' Error*********' + app.bpuStatusError);
// 		// 			app.logger.error('           Make sure this is not a big deal and force reset here');
// 		//
// 		// 		} else if (app.bpuStatus === app.bpuStatusTypes.resetingFailed) {
// 		// 			app.logger.error('***********Get Status Bpu Status ' + app.bpuStatus + ' Error*********' + app.bpuStatusError);
// 		// 			app.logger.error('           Make sure this is not a big deal and force reset here');
// 		// 		}
// 		// 	}
// 		//
// 		// 	//Return
// 		// 	if (typeof callback === 'function') callback(resObj);
// 		// });
// 		//
// 		// socket.on(app.socketStrs.bpu_setExp, function (exp, resetTimeout, callback) {
// 		// 	//Init
// 		// 	var emitStr = app.socketStrs.bpu_setExp;
// 		// 	var retStr  = emitStr + 'Res';
// 		// 	var resObj  = {err: null, bpuStatus: app.bpuStatus};
// 		//
// 		// 	//Log
// 		// 	app.logger.info(moduleName + ' ' + emitStr);
// 		//
// 		// 	if (app.exp !== null) {
// 		// 		resObj.err = 'already has exp';
// 		// 		//Return
// 		// 		if (typeof callback === 'function') callback(resObj.err, resObj);
// 		// 	} else if (app.bpuStatus !== app.bpuStatusTypes.resetingDone) {
// 		// 		resObj.err = 'status is not app.bpuStatusTypes.resetingDone its ' + app.bpuStatus;
// 		// 		//Return
// 		// 		if (typeof callback === 'function') callback(resObj.err, resObj);
// 		// 	} else if (exp.exp_eventsToRun.length === 0) {
// 		// 		resObj.err = 'app.exp.exp_eventsToRun.length===0';
// 		// 		//Return
// 		// 		if (typeof callback === 'function') callback(resObj.err, resObj);
// 		// 	} else {
// 		// 		app.bpuStatus = app.bpuStatusTypes.pendingRun;
// 		// 		app.exp       = exp;
// 		//
// 		// 		app.exp.exp_eventsToRun.sort(function (objA, objB) {
// 		// 			return objB.time - objA.time
// 		// 		});
// 		// 		app.exp_eventsRunTime = app.exp.exp_eventsToRun[0].time;
// 		//
// 		// 		app.didConfirmRun        = false;
// 		// 		app.didConfirmTimeoutRun = false;
// 		// 		setTimeout(function () {
// 		// 			if (!app.didConfirmRun) {
// 		// 				app.didConfirmTimeoutRun = true;
// 		// 				app.script_resetBpu(app, deps, opts, function (err) {
// 		// 					if (app.bpu === null || app.bpu === undefined) {
// 		// 						app.logger.error('socketBpu bpu_setExp reseting issue no app.bpu');
// 		// 					} else if (err) {
// 		// 						app.logger.error('socketBpu bpu_setExp reseting ' + err);
// 		// 					} else {
// 		// 						app.logger.debug('socketBpu bpu_setExp READY FOR EXPERIMENT');
// 		// 					}
// 		// 				});
// 		// 			}
// 		// 		}, resetTimeout);
// 		// 		//Return
// 		// 		if (typeof callback === 'function') callback(resObj.err, resObj);
// 		// 	}
// 		// });
// 		//
// 		// socket.on(app.socketStrs.bpu_runExp, function (callback) {
// 		// 	if (!app.didConfirmTimeoutRun && app.exp !== null) {
// 		// 		app.didConfirmRun = true;
// 		// 		//If Live Add setleds
// 		// 		if (app.exp.group_experimentType === 'live') {
// 		// 			//Set LEDs
// 		// 			var ledsSet = function (lightData, cb_fn) {
// 		// 				//Init
// 		// 				var emitStr = app.socketStrs.bpu_runExpLedsSet;
// 		// 				var retStr  = emitStr + 'Res';
// 		// 				var resObj  = {err: null, bpuStatus: app.bpuStatus};
// 		//
// 		// 				//Log
// 		// 				//app.logger.info(moduleName+' '+emitStr);
// 		//
// 		// 				//Run
// 		// 				var timeNow       = new Date().getTime();
// 		// 				lightData.setTime = timeNow;
// 		// 				var doReset       = false;
// 		// 				resObj            = app.bpu.ledsSet(lightData, doReset);
// 		// 				resObj.err        = null;
// 		// 				app.exp.exp_eventsRan.push(resObj);
// 		// 				//Return
// 		// 				if (typeof cb_fn === 'function') cb_fn(resObj.err, resObj);
// 		// 			};
// 		// 			//Listender
// 		// 			socket.on(app.socketStrs.bpu_runExpLedsSet, ledsSet);
// 		// 		}
// 		//
// 		// 		//Run
// 		// 		var options = {};
// 		// 		app.logger.debug(moduleName + ' script_runExperiment start');
// 		// 		app.script_runExperiment(app, deps, options, app.exp, function (err) {
// 		// 			app.logger.debug(moduleName + ' script_runExperiment end');
// 		//
// 		// 			//If Live Add setleds
// 		// 			if (app.exp.group_experimentType === 'live') {
// 		// 				socket.removeListener(app.socketStrs.bpu_runExpLedsSet, ledsSet);
// 		// 			}
// 		//
// 		// 			if (err) {
// 		// 				app.logger.error(moduleName + ' script_runExperiment ' + err);
// 		// 			} else {
// 		// 				// if no error set flag for pick, used in get status ping
// 		// 				if (app.bpuStatus === app.bpuStatusTypes.finalizingDone) {
// 		// 					app.isExperimentOverAndWaitingForPickup = true;
// 		// 				}
// 		// 			}
// 		// 		});
// 		//
// 		// 		//Return
// 		// 		if (typeof callback === 'function') callback({err: null});
// 		// 	} else {
// 		// 		//Return
// 		// 		if (typeof callback === 'function') callback('already canceled', null);
// 		// 	}
// 		// });
// 		//
// 		// socket.on(app.socketStrs.bpu_resetBpu, function (isUserCancel, userSessionID) {
// 		// 	var doReset = true;
// 		// 	if (isUserCancel) {
// 		// 		if (app.exp === null || app.exp.session.sessionID !== userSessionID) {
// 		// 			doReset = false;
// 		// 		}
// 		// 	}
// 		// 	if (doReset) {
// 		// 		//Init
// 		// 		var emitStr = app.socketStrs.bpu_resetBpu;
// 		// 		var retStr  = emitStr + 'Res';
// 		// 		var resObj  = {err: null, bpuStatus: app.bpuStatus};
// 		//
// 		// 		//Log
// 		// 		app.logger.info(moduleName + ' ' + emitStr);
// 		//
// 		// 		//Run
// 		// 		app.script_resetBpu(app, deps, opts, function (err, data) {
// 		// 			resObj.resetData = data;
// 		//
// 		// 			//Return
// 		// 			if (typeof callback === 'function') callback(resObj.err, resObj);
// 		//
// 		// 		});
// 		// 	}
// 		// });
//
// 		socket.on(EVENTS.DISCONNECT, function (reason) {
// 			logger.error('disconnected due to ' + reason);
// 		});
//
// 	});
// };


// todo seems junk method - no need to clear if they are not maintained as part of microscope
// microscope needs to look into queue and if experiment expired, remove it from execution and update status in queue

// Microscope.prototype.clear = function (bpuObj, cb_clearBpuExp) {
// 	if (bpuObj.getStatusResObj.expOverId !== null && bpuObj.getStatusResObj.expOverId !== undefined) {
// 		if (bpuObj.doc.status === BPU_STATES.IDLE) {
// 			var updateObj = {
// 				exp_serverClearTime: new Date().getTime(),
// 				exp_status:          'servercleared',
// 			};
// 			app.db.models.BpuExperiment.findByIdAndUpdate(bpuObj.getStatusResObj.expOverId, updateObj, function (err, savedExpDoc) {
// 				if (err) {
// 					app.errors.experiment.push({
// 						time: new Date(),
// 						err:  bpuObj.doc.name + ' fn_clearBpuExp BpuExperiment.findByIdAndUpdate ' + err
// 					});
// 					cb_clearBpuExp(bpuObj.doc.name + ' fn_clearBpuExp BpuExperiment.findByIdAndUpdate ' + err);
// 				} else {
// 					cb_clearBpuExp(null);
// 				}
// 			});
// 		} else {
// 			app.errors.experiment.push({
// 				time: new Date(),
// 				err:  bpuObj.doc.name + ' fn_clearBpuExp ' + 'has expOverId:' + bpuObj.getStatusResObj.expOverId + ' but status is ' + bpuObj.doc.status + '!=' + app.mainConfig.bpuStatusTypes.finalizingDone
// 			});
// 			cb_clearBpuExp(bpuObj.doc.name + ' fn_clearBpuExp ' + 'has expOverId:' + bpuObj.getStatusResObj.expOverId + ' but status is ' + bpuObj.doc.status + '!=' + app.mainConfig.bpuStatusTypes.finalizingDone);
// 		}
// 	} else {
// 		cb_clearBpuExp(null);
// 	}
// };

module.exports = Microscope;