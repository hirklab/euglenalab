"use strict";

var _         = require('underscore');
var logger    = require('./logging');
var User      = require('./user');
var constants = require('./constants');
var EVENTS    = constants.EVENTS;
var MESSAGES  = constants.CLIENT_MESSAGES;

// constructor
function UserManager(config, io, sessionMiddleware, db) {
	this.config            = config;
	this.io                = io;
	this.sessionMiddleware = sessionMiddleware;
	this.db                = db;
	this.users             = {};
}

// class methods
UserManager.prototype.connect = function (controller, cb) {
	var that = this;

	that.controller = controller;

	logger.debug('starting socket server...');

	that.io.sockets
		.use(function (socket, next) {
			that.sessionMiddleware(socket.request, {}, next);
		});

	that.io.sockets.on(EVENTS.CONNECT, function (socket) {
		if (socket
			&& socket.request.session.hasOwnProperty('passport') && socket.request.session.passport
			&& socket.request.session.passport.hasOwnProperty('user') && socket.request.session.passport.user) {

			var found       = false;
			var currentUser = socket.request.session.passport.user;

			if (currentUser !== undefined && currentUser !== null) {
				if (currentUser._id in that.users) {
					that.users[currentUser._id].sockets = _.reject(that.users[currentUser._id].sockets, function (d) {
						return !d.connected;
					});

					found = _.find(that.users[currentUser._id].sockets, function (available) {
						return available.id === socket.id;
					});

				} else {
					that.users[currentUser._id] = {
						_id:       currentUser._id,
						username:  currentUser.username,
						sockets:   [],
						sessionID: socket.request.sessionID // not used anywhere
					};
				}

				if (!found) {
					logger.debug('client ' + socket.id + ' connected');

					that.users[currentUser._id].sockets.push(socket);
					that.listConnectedUsers();
				}
			}

			socket.on(EVENTS.DISCONNECT, function (reason) {
				logger.debug('client ' + socket.id + ' disconnected');

				//remove socket
				if (currentUser !== undefined && currentUser !== null) {
					if (currentUser._id in that.users) {

						// remove socket which got disconnected
						that.users[currentUser._id].sockets = _.reject(that.users[currentUser._id].sockets, function (d) {
							return d.id === socket.id;
						});

						//remove user with no socket connections
						if (that.users[currentUser._id].sockets.length === 0) {
							delete that.users[currentUser._id];
						}

						that.listConnectedUsers();
					}
				}
			});

			socket.on(EVENTS.ERROR, function (error) {
				logger.error(error);
			});

			socket.on(EVENTS.MESSAGE, function (message, cb) {
				if (message) {
					var type    = message.type;
					var payload = message.payload;

					logger.debug('====================================');
					logger.debug('[RX] ' + currentUser.username + ': ' + type);
					if (payload) logger.debug(Object.values(payload).join(' / '));

					switch (type) {
						case MESSAGES.RX.EXPERIMENT_SET:
							that.onExperimentSet(currentUser, payload);
							break;

						case MESSAGES.RX.EXPERIMENT_CONFIRMATION:
							that.onExperimentRun(currentUser, payload);
							break;

						case MESSAGES.RX.EXPERIMENT_EXTEND_DURATION:
							// that.onExperimentRun(currentUser, payload);
							break;

						case MESSAGES.RX.EXPERIMENT_TRANSFER_CONTROL:
							// that.onExperimentRun(currentUser, payload);
							break;

						case MESSAGES.RX.EXPERIMENT_CANCEL:
							that.onExperimentCancel(currentUser, payload);
							break;

						case MESSAGES.RX.STIMULUS:
							that.onStimulus(currentUser, payload);
							break;

						case MESSAGES.RX.MAINTENANCE:
							that.onMaintenance(currentUser, payload);
							break;
					}
				}
			});

		}else{
			// no authentication
			// todo disconnect
		}
	});

	cb(null);
};

UserManager.prototype.onExperimentSet = function (user, payload, callback) {
	// logger.debug("submitting experiment to controller...");
	var that = this;
	that.controller.submitExperiment(experiment, cb);
};

UserManager.prototype.onExperimentRun = function (user, payload, callback) {
	var that = this;
};

UserManager.prototype.onStimulus = function (user, payload, callback) {
	var that = this;
	that.controller.setStimulus(data);
};


UserManager.prototype.listConnectedUsers = function () {
	var that = this;

	logger.info('========================================');
	_.map(that.users, function (user) {
		logger.info(user.username + '\t' + user.sockets.length + ' client(s)'); // + '\t' + _.pluck(user.sockets, 'id'));
	});
};

// export the class
module.exports = UserManager;