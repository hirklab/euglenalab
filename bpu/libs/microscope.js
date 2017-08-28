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

var logger = require('./logging');
var Board  = require('./board');

var constants         = require('./constants');
var EVENTS            = constants.EVENTS;
var STATES            = constants.STATES;
var MESSAGES          = constants.MESSAGES;
var EXPERIMENT_STATUS = constants.EXPERIMENT_STATUS;
var EXPERIMENT_TYPE   = constants.EXPERIMENT_TYPE;


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
	this.state             = {};
	this.state.hid         = hid;  // todo use this as primary identity of device rather than name
	this.state.name        = name;
	this.state.status      = STATES.CONNECTING;
	this.state.isConnected = false;
	this.state.experiment  = null;
	this.state.queueTime   = 0;

	this.board = new Board();
	this.board.configure();
}

Microscope.prototype.initialize = function (callback) {
	var that = this;

	var httpServer = http.createServer(function (req, res) {
		res.writeHead(200, {
			'Content-Type': 'application/json'
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

	if (callback) callback(null);
};

Microscope.prototype.onConnected = function (socket, callback) {
	var that = this;

	that.url = 'http://' + that.ip + ":" + that.port;
	logger.info('microscope ' + that.name + ' connected at ' + that.url);

	socket.on(EVENTS.MESSAGE, that.onMessage.bind(that));

	socket.on(EVENTS.ERROR, that.onError.bind(that));

	socket.on(EVENTS.DISCONNECT, that.onDisconnected.bind(that));

	that.state.isConnected = true;

	if (that.state.status === STATES.CONNECTING) {
		that.state.status = STATES.IDLE;
	}

	that.onStatus();

	that.client = socket;

	if (callback) callback(null);
};

Microscope.prototype.onStatus = function (payload, callback) {
	var that = this;

	that.sendMessage(MESSAGES.STATUS, that.status());

	if (callback) callback();
};

Microscope.prototype.onExperimentSet = function (payload, callback) {
	var that = this;
	var err  = null;

	if (that.isAvailable()) {

		//reset board
		that.board.configure();

		that.state.status = STATES.QUEUED;

		var experiment = payload.experiment;
		// todo: create a folder to save
		// todo: get events to run
		experiment.status      = EXPERIMENT_STATUS.QUEUED;
		experiment.submittedAt = new Date();

		that.state.experiment              = experiment;
		that.state.experiment.actualEvents = [];

		if(that.state.experiment.type == EXPERIMENT_TYPE.LIVE){
			// no need to set separate event
			// we should let events be sent whatever be the mode of experiment
			// flexibility to be controlled by admin
		}
	} else {
		// already has experiment -> faillll
		err = 'microscope not idle';
	}

	that.onStatus(null);

	if (callback) callback(err);
};

Microscope.prototype.onExperimentCancel = function (payload, callback) {
	var that = this;

	if (that.isQueued() || that.isRunning()) {
		that.state.experiment.status      = EXPERIMENT_STATUS.CANCELLED;
		that.state.experiment.cancelledAt = new Date();

		// cleanup activities
		that.onExperimentClear();
	}

	that.onStatus();

	if (callback) callback(null);
};

Microscope.prototype.onExperimentRun = function (payload, callback) {
	var that = this;

	if (that.isQueued()) {
		that.state.experiment.status    = EXPERIMENT_STATUS.RUNNING;
		that.state.experiment.startedAt = new Date();

		that.state.status = STATES.RUNNING;

		async.series([
			function (cb) {
				// that.board.startRecording();
				// that.board.startProjector();

				var events = lodash.clone(that.state.experiment.proposedEvents);

				var event = null;

				var loop = setInterval(function () {
					that.onStatus();

					if (that.state.experiment) {

						var now      = new Date().getTime();
						var timeDiff = now - that.state.experiment.startedAt;

						if (event == null && events.length > 0) {
							event = events.shift();
						}

						if (event && parseInt(event.time) <= parseInt(timeDiff)) {
							//run the event now
							var devices = Object
								.keys(event)
								.filter(function (key) {
									return key !== 'time';
								})
								.map(function (key) {
									return {
										name:  key,
										value: event[key]
									}
								});

							logger.info(event);
							logger.info(timeDiff);
							logger.info(devices);

							that.onExecuteEvent(devices);

							event = null;
						}

						if (event == null && events.length === 0 && (timeDiff / 1000) >= that.state.experiment.duration) {
							clearInterval(loop);
							return cb(null);
						}
					} else {
						clearInterval(loop);
						return cb(null);
					}
				}, 20); // run every 20 milliseconds

			}
		], function (err) {
			if (err) {
				logger.error('completing experiment');
				logger.error(err);

				// cancel experiment
				that.onExperimentFailed(err, callback);
			} else {
				that.onExperimentExecuted(null, callback);
			}
		})
	}
};

Microscope.prototype.onStimulus = function (payload, callback) {
	var that = this;

	var currentTime = new Date();

	if (that.isRunning()) {

		if ('event' in payload) {
			// push to queue of events which will be executed in loop
			that.state.experiment.proposedEvents.push({
				time:  currentTime,
				event: payload.event
			});

			// that.onExecuteEvent(payload.event);
		}
	}

	if (callback) callback(null);
};

Microscope.prototype.onExecuteEvent = function (payload, callback) {
	var that = this;

	var currentTime = new Date();

	lodash.each(payload, function (device) {
		that.board.setDevice(device.name, device.value);
	});

	that.state.experiment.actualEvents.push({
		time:  currentTime,
		event: payload
	});

	if (callback) callback(null);
};

Microscope.prototype.onExperimentExecuted = function (error, callback) {
	var that = this;

	that.state.experiment.status     = EXPERIMENT_STATUS.EXECUTED;
	that.state.experiment.executedAt = new Date();

	that.onExperimentClear(error, callback);

};

Microscope.prototype.onExperimentFailed = function (error, callback) {
	var that = this;

	that.state.experiment.status   = EXPERIMENT_STATUS.FAILED;
	that.state.experiment.failedAt = new Date();

	if (error) {
		that.state.experiment.reason = error;
	}

	that.onExperimentClear(error, callback);
};

// call this event when experiment needs to be removed from queue or cancelled or failed
// it saves the experiment and clears the queue for new experiment
Microscope.prototype.onExperimentClear = function (error, callback) {
	var that = this;

	if (that.isRunning()) {
		async.waterfall([
			function (cb) {
				// todo save that experiment

				// funcs.push(finalizeData);
				// funcs.push(movePackageToMountedDrive);

				logger.info('saving experiment');

				if(cb) cb(null);
			},
			function (err, cb) {
				// todo : other cleanup activities if any

				//reset board
				that.board.configure();

				that.state.experiment = null;
				that.state.status     = STATES.IDLE;
				that.state.queueTime  = 0;

				if(cb) cb(err);
			}
		], function (err, result) {
			if (err) {
				logger.error(err);
			}

			that.onStatus(callback);
		});
	}
};

Microscope.prototype.onMaintenance = function (payload, callback) {
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

	if (callback) callback(null);
};

Microscope.prototype.onDisconnected = function (reason) {
	var that = this;

	logger.error('disconnected due to ' + reason);

	that.state.status    = STATES.CONNECTING;
	that.state.isConnected = false;

	that.sendMessage(MESSAGES.STATUS, that.status());
};

Microscope.prototype.onMessage = function (message, callback) {
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
			that.onExperimentSet(payload, callback);
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

		case MESSAGES.MAINTENANCE:
			that.onMaintenance(payload);
			break;

		default:
			logger.error('invalid message: type not handled');
			break;
	}

	if (callback) callback(null);
};

Microscope.prototype.onError = function (payload) {
	logger.error(payload)
};

Microscope.prototype.sendMessage = function (type, payload) {
	var newMessage     = {};
	newMessage.type    = type;
	newMessage.payload = payload;

	// logger.debug('=============[M » C]=============');
	// logger.debug('type: ', type);
	//
	// if (newMessage.payload) {
	// 	logger.debug('payload: ', newMessage.payload);
	// }

	this.server.emit(EVENTS.MESSAGE, newMessage);
};

Microscope.prototype.status = function () {
	var that = this;

	if (that.isRunning()) {

		var now = new Date().getTime();

		// logger.info((now - that.state.experiment.startedAt));


		var elapsed = ((now - that.state.experiment.startedAt) / 1000);

		if (elapsed > that.state.experiment.duration) {
			elapsed = that.state.experiment.duration;
		}

		that.state.queueTime = that.state.experiment.duration - elapsed;
	}

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