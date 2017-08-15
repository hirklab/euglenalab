var socketClient = require('socket.io-client');
var _            = require('lodash');

var myFunctions     = require('../../shared/myFunctions.js');
var constants       = require('../constants');
var CLIENT_MESSAGES = constants.CLIENT_MESSAGES;

// Constructor
function Controller(config, logger, userManager) {
	this.config      = config;
	this.logger      = logger;
	this.userManager = userManager;
}

// class methods
Controller.prototype.compileClientUpdateFromController = function (microscopes, listExperiment) {
	var that = this;

	var users = _.map(Object.values(that.userManager.users), function (user) {
		"use strict";
		return {id: user.userID, username: user.username};
	});

	Object.values(that.userManager.users).forEach(function (user) {
		_.map(user.sockets, function (socket) {

			var payload = {
				microscopes: microscopes,
				users:       users
			};

			// todo filter microscopes which are not in user group

			var newMessage     = {};
			newMessage.type    = CLIENT_MESSAGES.STATUS;
			newMessage.payload = payload;
			socket.emit('message', newMessage);
		});
	});
};

Controller.prototype.connect = function (cb) {
	var that = this;

	var address = that.config.controllerAddress;
	that.logger.debug('connecting controller...');

	that.socket = socketClient(address, {multiplex: false, reconnection: true});

	that.socket.on('disconnect', function () {
		that.logger.warn('controller disconnected');
	});

	that.socket.on('connection', function () {
		that.logger.info('controller => ' + address);

		cb(null, that);
	});

	//update is joined in user socket connection
	that.socket.on('message', function (message) {
		var type    = message.type;
		var payload = message.payload;

		// that.logger.debug('=============[C » W]=============');
		// that.logger.debug('type: ', type);

		if (type == 'update' && payload) {
			that.compileClientUpdateFromController(payload.microscopes, payload.experiments);
		}
	});

	//Routes calls to user sockets if found
	that.socket.on('activateLiveUser', function (session, liveUserConfirmTimeout, callbackToBpuController) {
		var userSocket = myFunctions.getSocket(that.userManager.io, session.socketID);

		if (userSocket) {
			that.logger.debug('activateLiveUser: sessionID: ' + session.sessionID + " socketID: " + session.socketID);

			userSocket.emit(that.config.mainConfig.userSocketStrs.user_activateLiveUser, session, liveUserConfirmTimeout, function (resObj) {
				//this.logger.info('activateLiveUser', session.sessionID, session.socketID, resObj.didConfirm, resObj.err);
				that.logger.debug('activeLiveUser Reply: ' + session.sessionID + " socketID: " + session.socketID + ', with: ' + resObj.didConfirm + ' err:' + resObj.err);

				callbackToBpuController(resObj);
			});
		} else {
			that.logger.error("activateLiveUser: Couldn't find socketId");
			callbackToBpuController({err: 'could not find socketID', didConfirm: false});
		}
	});

	that.socket.on('sendUserToLiveLab', function (session, callbackToBpuController) {
		var userSocket = myFunctions.getSocket(that.userManager.io, session.socketID);

		if (userSocket) {
			that.logger.debug('sendUserToLiveLab sessionID: ' + session.sessionID + " socketID: " + session.socketID);

			userSocket.emit(that.config.mainConfig.userSocketStrs.user_sendUserToLiveLab, function (resObj) {
				that.logger.debug('sendUserToLiveLab Reply: ' + session.sessionID + " socketID: " + session.socketID + ', err:' + resObj.err);

				callbackToBpuController(resObj);
			});
		} else {
			callbackToBpuController({err: 'could not find socketID', didConfirm: false});
		}
	});

	cb(null, that);
};

Controller.prototype.submitExperiment = function (queue, cb) {
	var that = this;

	this.socket.emit(that.config.mainConfig.socketStrs.bpuCont_submitExperimentRequest, that.auth, queue, function (err, resDataArray) {
		that.logger.debug("experiment submitted to controller");
		cb(err, resDataArray);
	});
};

Controller.prototype.setStimulus = function (data) {
	this.socket.emit(this.config.mainConfig.socketStrs.bpu_runExpLedsSet, data);
};

// export the class
module.exports = Controller;