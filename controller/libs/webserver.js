var http = require('http');
var socketIO = require('socket.io');
var lodash = require('lodash');

var config = require('../config');
var logger = require('./logging');
var constants = require('../constants');
var EVENTS = constants.EVENTS;
var MESSAGES = constants.MESSAGES;
var STATES = constants.STATES;

function Webserver(callback) {
	var that = this;
	that.url = null;
	that.ip = config.SERVER_IP;
	that.port = config.SERVER_PORT;
	that.server = null;
	that.client = null; // single connection to webserver

	that.state = {};
	this.state.status = STATES.CONNECTING;
	this.state.connected = false;

	var httpServer = http.createServer(function(req, res) {
		res.writeHead(200, {
			'Content-Type': 'application/json'
		});
		res.end();
	});

	httpServer.listen(that.port, that.ip);

	process.on('SIGTERM', function() {
		logger.warn("shutting down server...");

		httpServer.close();

		logger.warn("server shutdown!");
		process.exit(1);
	});

	that.server = socketIO(httpServer);

	that.initialize(callback);
}

Webserver.prototype.initialize = function(callback) {
	var that = this;

	that.url = 'http://' + that.ip + ":" + that.port;
	logger.info('controller connected at ' + that.url);

	that.server.on(EVENTS.CONNECT, that.onConnected.bind(that));

	callback(null);
};

Webserver.prototype.onConnected = function(socket) {
	var that = this;

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

Webserver.prototype.onMessage = function(message) {
	var that = this;

	var type = message.type;
	var payload = message.payload;

	logger.info('=============[W » C]=============');
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

		case MESSAGES.STIMULUS:
			that.onStimulus(payload);
			break;

		case MESSAGES.MAINTENANCE:
			that.onMaintenance(payload);
			break;

		default:
			logger.error('invalid message: message type not handled');
			break;
	}
};

Webserver.prototype.onExperimentSet = function(payload) {
	var that = this;
	logger.debug(payload);
	// pass experiment to scheduler

	// if (that.isAvailable()) {

	// that.state.status = STATES.QUEUED;

	var experiment = payload;
	experiment.submittedAt = new Date();

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
	// 						app.logger.error('socketBpu bpu_setExp resetting issue no app.bpu');
	// 					} else if (err) {
	// 						app.logger.error('socketBpu bpu_setExp resetting ' + err);
	// 					} else {
	// 						app.logger.debug('socketBpu bpu_setExp READY FOR EXPERIMENT');
	// 					}
	// 				});
	// 			}
	// 		}, resetTimeout);

	// todo: create a folder to save

	// todo: get events to run

	// that.state.experiment = experiment;
	// that.state.experiment.status      = EXPERIMENT.QUEUED;
	// that.state.experiment.submittedAt = new Date();

	logger.debug(experiment);
	// } else {
	// already has experiment -> faillll


	// }

	// socket.on(app.mainConfig.socketStrs.bpuCont_submitExperimentRequest, function (serverInfo, joinQueueDataArray, cb) {
	// 	app.submitExperimentRequestHandler(app, serverInfo, joinQueueDataArray, cb);
	// });
};

Webserver.prototype.onExperimentCancel = function(payload) {
	if (this.isQueued() || this.isRunning()) {
		// this.state.experiment.status      = EXPERIMENT_STATUS.CANCELLED;
		this.state.experiment.cancelledAt = new Date();

		// todo save this experiment

		this.state.experiment = null;

		// todo : other cleanup activities

		this.state.status = STATES.IDLE;
	}
};

Webserver.prototype.onStimulus = function(payload) {
	var that = this;

	if (that.isRunning()) {

		if ('event' in payload) {
			that.onExecuteEvent(payload.event);
		}
	}

	// socket.on(app.mainConfig.socketStrs.bpu_runExpLedsSet, function (lightData) {
	// 	if (app.bpuLedsSetMatch[lightData.sessionID]) {
	// 		// console.log(lightData);
	// 		app.bpuLedsSetMatch[lightData.sessionID](lightData);
	// 	}
	// });
};

Webserver.prototype.onExecuteEvent = function(payload) {
	var that = this;

	var currentTime = new Date();

	// that.state.experiment.actualEvents.push({
	// 	time:  currentTime,
	// 	event: payload
	// });
};

Webserver.prototype.onMaintenance = function(payload) {
	var that = this;
	if (that.isAvailable()) {
		var duration = 1; // default duration of 1 ms  // todo push it to config

		// that.state.status = STATES.MAINTENANCE;

		// if ('devices' in payload) {
		// 	var devices = payload.devices;
		//
		// 	lodash.each(devices, function (device) {
		// 		that.board.setDevice(device.name, device.value);
		// 	});
		// }
		//
		// if ('flush' in payload) {
		// 	var flush = payload.flush;
		// 	that.board.flush(flush.duration);
		// 	duration = flush.duration;
		// }

		setTimeout(function() {
			that.state.status = STATES.IDLE;
		}, duration);
	}
};

Webserver.prototype.onError = function(payload) {
	logger.error(payload)
};

Webserver.prototype.onDisconnected = function(reason) {
	var that = this;

	logger.error('disconnected due to ' + reason);

	that.state.status = STATES.CONNECTING;
	that.state.connected = false;

	that.sendMessage(MESSAGES.STATUS, that.status());

};

Webserver.prototype.sendMessage = function(type, payload) {
	var that = this;

	var newMessage = {};
	newMessage.type = type;
	newMessage.payload = payload;

	// logger.debug('=============[C » W]=============');
	// logger.debug('type: ', type);

	// if (newMessage.payload) {
	// 	logger.debug('payload: ', newMessage.payload);
	// }

	that.server.emit(EVENTS.MESSAGE, newMessage);
};

Webserver.prototype.status = function() {
	return this.state;
};

// todo replace this with better authentication function
Webserver.prototype.verify = function(auth, callback) {
	var err = 'invalid auth';

	if (auth && typeof auth === 'object') {
		if (auth.hasOwnProperty('identifier') && auth.identifier && typeof auth.identifier === 'string') {
			if (auth.identifier in config.AUTH && config.AUTH[auth.identifier].identifier === auth.identifier) {
				err = null;
			} else {
				err = 'invalid identifier';
			}
		}
	}

	callback(err);
};

module.exports = Webserver;