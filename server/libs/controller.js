var socketClient = require('socket.io-client');
var _ = require('lodash');
var async = require('async');

var myFunctions = require('../../shared/myFunctions.js');

var logger = require('./logging');

var config = require('./config');
var constants = require('./constants');
var MESSAGES = constants.CLIENT_MESSAGES;

var Scheduler        = require('./scheduler');
var UserManager      = require('./userManager');
var Microscope      = require('./microscope');


// Constructor
function Controller(config, app) {
	var that = this;
	this.db = app.db;
	this.config = config;

	// object list of connected microscopes
	that.microscopesIndex = {};

	// object list of experiments from database
	that.experiments = null;

	// list of experiments in memory (mostly pending, running)
	// push this to redis later
	that.experimentsCache = [];

	// any new experiment is collected here before being added to cache
	that.newExperimentsIndex = {};

	this.userManager = new UserManager(config, app.io, app.sessionMiddleware, app.db);

	this.scheduler = new Scheduler();
	this.scheduler.initialize(function () {
		logger.debug('main scheduler ready');
	});

	this.socket = null;
}

// class methods
Controller.prototype.compileClientUpdateFromController = function(microscopes, listExperiment) {
	var that = this;

	var users = _.map(Object.values(that.userManager.users), function(user) {
		"use strict";
		return {
			id: user.userID,
			username: user.username
		};
	});

	Object.values(that.userManager.users).forEach(function(user) {
		_.map(user.sockets, function(socket) {

			var payload = {
				microscopes: microscopes,
				users: users
			};

			// todo filter microscopes which are not in user group

			var newMessage = {};
			newMessage.type = MESSAGES.TX.STATUS;
			newMessage.payload = payload;
			socket.emit('message', newMessage);
		});
	});
};

Controller.prototype.connect = function(cb) {
	var that = this;

	// var address = that.config.controllerAddress;
	// logger.debug('connecting controller...');
	//
	// that.socket = socketClient(address, {
	// 	multiplex: false,
	// 	reconnection: true
	// });
	//
	// that.socket.on('disconnect', function() {
	// 	logger.warn('controller disconnected');
	// });
	//
	// that.socket.on('connection', function() {
	// 	logger.info('controller => ' + address);
	//
	// 	cb(null, that);
	// });
	//
	// //update is joined in user socket connection
	// that.socket.on('message', function(message) {
	// 	var type = message.type;
	// 	var payload = message.payload;
	//
	// 	// logger.debug('=============[C » W]=============');
	// 	// logger.debug('type: ', type);
	//
	// 	if (type == 'update' && payload) {
	// 		that.compileClientUpdateFromController(payload.microscopes, payload.experiments);
	// 	}
	// });
	//
	// //Routes calls to user sockets if found
	// that.socket.on('activateLiveUser', function(session, liveUserConfirmTimeout, callbackToBpuController) {
	// 	var userSocket = myFunctions.getSocket(that.userManager.io, session.socketID);
	//
	// 	if (userSocket) {
	// 		logger.debug('activateLiveUser: sessionID: ' + session.sessionID + " socketID: " + session.socketID);
	//
	// 		userSocket.emit(that.config.mainConfig.userSocketStrs.user_activateLiveUser, session, liveUserConfirmTimeout, function(resObj) {
	// 			//logger.info('activateLiveUser', session.sessionID, session.socketID, resObj.didConfirm, resObj.err);
	// 			logger.debug('activeLiveUser Reply: ' + session.sessionID + " socketID: " + session.socketID + ', with: ' + resObj.didConfirm + ' err:' + resObj.err);
	//
	// 			callbackToBpuController(resObj);
	// 		});
	// 	} else {
	// 		logger.error("activateLiveUser: Couldn't find socketId");
	// 		callbackToBpuController({
	// 			err: 'could not find socketID',
	// 			didConfirm: false
	// 		});
	// 	}
	// });
	//
	// that.socket.on('sendUserToLiveLab', function(session, callbackToBpuController) {
	// 	var userSocket = myFunctions.getSocket(that.userManager.io, session.socketID);
	//
	// 	if (userSocket) {
	// 		logger.debug('sendUserToLiveLab sessionID: ' + session.sessionID + " socketID: " + session.socketID);
	//
	// 		userSocket.emit(that.config.mainConfig.userSocketStrs.user_sendUserToLiveLab, function(resObj) {
	// 			logger.debug('sendUserToLiveLab Reply: ' + session.sessionID + " socketID: " + session.socketID + ', err:' + resObj.err);
	//
	// 			callbackToBpuController(resObj);
	// 		});
	// 	} else {
	// 		callbackToBpuController({
	// 			err: 'could not find socketID',
	// 			didConfirm: false
	// 		});
	// 	}
	// });

	this.userManager.connect(this, cb);
	// cb(null, that);
};

Controller.prototype.submitExperiment = function(experiment, cb) {
	var that = this;

	var message = {
		type: 'experimentSet',
		payload: experiment
	};



	// that.socket.emit('message', message, cb);
};

Controller.prototype.setStimulus = function(data) {
	// this.socket.emit(this.config.mainConfig.socketStrs.bpu_runExpLedsSet, data);
};

Controller.prototype.loop = function () {
	var that = this;
	//utils.clearConsole();
	var startDate = new Date();

	// var microscopeUtils = require('./libs/microscopeManager')(app);
	// var experimentUtils = require('./libs/experimentManager')(app);

	async.series([
		that.getMicroscopes.bind(that),
		// that.showStatus.bind(that),

		// experimentUtils.checkExperiments,
		// experimentUtils.scheduleExperiments,
		// experimentUtils.updateExperimentsQueue,

		// experimentUtils.notifyClients
	], function (err) {
		if (err) {
			logger.error(err);
		} else {
			setTimeout(function () {
				that.loop();
			}, config.LOOP_INTERVAL);
		}
	});
};

Controller.prototype.getMicroscopes= function (callback) {
	var that = this;
	// logger.debug('fetching BPUs...');

	that.db.getBPUs(function (err, microscopes) {
		if (err) {
			logger.error(err);
			return callback(err);
		} else {
			microscopes.forEach(function (microscope) {
				if (microscope.name in that.microscopesIndex) {

					// database sync
					that.microscopesIndex[microscope.name].doc = microscope;

					// todo perform live sync here

					// todo remove microscopes which are not in passed list


				} else {

					// new microscope introduced in database
					that.microscopesIndex[microscope.name] = new Microscope({
						id:      microscope._id,
						name:    microscope.name,
						doc:     microscope,
						address: 'http://' + microscope.localAddr.ip + ':' + microscope.localAddr.serverPort
					});

					that.scheduler.addQueue(microscope.name);
				}
			});

			return callback(null);
		}
	});
};

Controller.prototype.showStatus= function (callback) {
	var that = this;
	// logger.debug('checking BPUs...');

	var keys = Object.keys(that.microscopesIndex);

	keys.sort(function (objA, objB) {
		return that.microscopesIndex[objA].doc.index - that.microscopesIndex[objB].doc.index;
	});

	keys.forEach(function (key) {
		var microscope = that.microscopesIndex[key];

		if (microscope.isConnected) {
			logger.info(microscope.doc.name + '(' + microscope.address + ')');
			logger.info('\tqueueTime:\t' + microscope.queueTime);
			logger.info('\texperiment:\t' + (microscope.experiment ? microscope.experiment.submittedAt : 'None'));
			// logger.info('\tTimeout:\t' + microscope.inactiveCount);
		}
		else {
			logger.error(microscope.doc.name + '(' + microscope.address + ')');
			logger.error('\texperiment:\t' + (microscope.experiment ? microscope.experiment.submittedAt : 'None'));
			// logger.error('\tTimeout:\t' + microscope.inactiveCount);
		}

	});

	return callback(null);
};


// export the class
module.exports = Controller;