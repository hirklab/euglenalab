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
	this.port   = parseInt(port);
	this.url    = null;
	this.server = null;
	this.client = null; // only controller connects for now,
                        // change this to list when multiple controllers can connect,
                        // cloud based resource sharing

	this.errors = [];  // {type, message}

	this.state            = {};
	this.state.hid        = hid;
	this.state.name       = name;
	this.state.status     = STATES.CONNECTING;
	this.state.connected  = false;
	this.state.experiment = null;

	// todo get estimate of time left if experiment running

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
}

Microscope.prototype.onStatus = function (payload) {
	var that = this;
	that.sendMessage(MESSAGES.STATUS, that.status());
}

Microscope.prototype.onExperimentSet = function (payload) {
	var that = this;

	if (that.isAvailable()) {

		//reset board
		that.board.configure();

		that.state.status = STATES.QUEUED;

		var experiment = payload.experiment;

		// 		app.exp.exp_eventsToRun.sort(function (objA, objB) {
		// 			return objB.time - objA.time
		// 		});
		// 		app.exp_eventsRunTime = app.exp.exp_eventsToRun[0].time;
		//
		// 		app.didConfirmRun        = false;
		// 		app.didConfirmTimeoutRun = false;
		// 		setTimeout(function () {
		// 			if (!app.didConfirmRun) {
		// 				app.didConfirmTimeoutRun = true;
		// 				app.script_resetBpu(app, deps, opts, function (err) {
		// 					if (app.bpu === null || app.bpu === undefined) {
		// 						app.logger.error('socketBpu bpu_setExp reseting issue no app.bpu');
		// 					} else if (err) {
		// 						app.logger.error('socketBpu bpu_setExp reseting ' + err);
		// 					} else {
		// 						app.logger.debug('socketBpu bpu_setExp READY FOR EXPERIMENT');
		// 					}
		// 				});
		// 			}
		// 		}, resetTimeout);

		// todo: create a folder to save

		// todo: get events to run

		that.state.experiment             = experiment;
		that.state.experiment.status      = EXPERIMENT.QUEUED;
		that.state.experiment.submittedAt = new Date();
	}else{
		// already has experiment -> faillll



	}
}

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
}

Microscope.prototype.onExperimentRun = function (payload) {

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
}

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
		// 

		// todo : other cleanup activities

		//reset board
		that.board.configure();
		that.state.experiment    = null;
		that.state.allowStimulus = false;
		that.state.status        = STATES.IDLE;

	}
}

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
}

Microscope.prototype.onDisconnected = function (reason) {
	var that = this;

	logger.error('disconnected due to ' + reason);

	that.state.status    = STATES.CONNECTING;
	that.state.connected = false;

	that.sendMessage(MESSAGES.STATUS, that.status());
}

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
}

Microscope.prototype.onError = function (payload) {
	logger.error(payload)
}

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
}

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
			port:       0,
			cameraPort: 20005  // todo
		};

		//this.sendMessage(MESSAGE.STATUS, this.status());
	});
};

Microscope.prototype.getLocalIP = function () {
	this.state.localAddress = {
		ip:         internalIp.v4(),
		port:       0,
		cameraPort: 80
	};
};

module.exports = Microscope;