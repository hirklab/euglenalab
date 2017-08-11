"use strict";

var _ = require('underscore');
var constants = require('../constants');
var CLIENT_MESSAGES = constants.CLIENT_MESSAGES;

// constructor
function UserManager(config, logger, io, sessionMiddleware, db) {
	this.config            = config;
	this.logger            = logger;
	this.io                = io;
	this.sessionMiddleware = sessionMiddleware;
	this.db                = db;
	this.users             = {};
}

// class methods
UserManager.prototype.connect = function (controller, cb) {
	var that = this;

	that.controller = controller;

	that.logger.debug('starting socket server...');

	that.io.sockets
		.use(function (socket, next) {
			that.sessionMiddleware(socket.request, {}, next);
		});

	that.io.sockets.on('connection', function (socket) {
		var found = false;
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
					userID:   currentUser._id,
					username: currentUser.username,
					sockets:   [],
					sessionID: socket.request.sessionID
				}
			}

			if (!found) {
				that.logger.debug('client ' + socket.id + ' connected');
				that.users[currentUser._id].sockets.push(socket);
				that.listConnectedUsers();
			}
		}

		socket.on('disconnect', function (reason) {
			that.logger.debug('client ' + socket.id + ' disconnected');

			//remove socket
			if (currentUser !== undefined && currentUser !== null) {
				if (currentUser._id in that.users) {
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

		socket.on('error', function (error) {
			that.logger.error(error);
		});

		// submit experiment to controller
		socket.on(that.config.mainConfig.userSocketStrs.user_submitExperimentRequest, function (joinQueueDataArray, callbackToClient) {
			that.logger.debug("submitting experiment to controller...");
			that.controller.submitExperiment(joinQueueDataArray, callbackToClient);
		});

		// submit stimulus data to controller
		socket.on(that.config.mainConfig.userSocketStrs.user_ledsSet, function (data) {
			that.logger.debug("sending data to controller...");
			that.controller.setStimulus(data);
		});

	});

	cb(null);
};

UserManager.prototype.listConnectedUsers = function () {
	var that = this;

	that.logger.info('========================================');

	_.map(that.users, function (user) {
		that.logger.info(user.username + '\t' + user.sockets.length + ' client(s)');// + '\t' + _.pluck(user.sockets, 'id'));
	});
};

// export the class
module.exports = UserManager;