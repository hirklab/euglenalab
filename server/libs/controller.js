var socketClient = require('socket.io-client');

var myFunctions = require('../../shared/myFunctions.js');

// Constructor
function Controller(config, logger, userManager) {
	this.config      = config;
	this.logger      = logger;
	this.userManager = userManager;
}

// class methods
Controller.prototype.compileClientUpdateFromController = function (bpuDocs, listExperiment, runningQueueTimesPerBpuName) {
	var that = this;

	var waitTimePerBpuName = {};
	var updatePerSessionID = {};

	var addBpuToSessionID = function (sessID, bpuExp) {
		if (sessID !== null && sessID !== undefined) {
			if (updatePerSessionID[sessID] === null || updatePerSessionID[sessID] === undefined) {
				updatePerSessionID[sessID]         = {};
				updatePerSessionID[sessID].bpuExps = [];
				updatePerSessionID[sessID].expTags = [];
			}
			updatePerSessionID[sessID].bpuExps.push(bpuExp);
		}
	};

	var addExpToSessionID = function (sessID, expTag) {
		if (sessID !== null && sessID !== undefined) {
			if (updatePerSessionID[sessID] === null || updatePerSessionID[sessID] === undefined) {
				updatePerSessionID[sessID]         = {};
				updatePerSessionID[sessID].bpuExps = [];
				updatePerSessionID[sessID].expTags = [];
			}
			updatePerSessionID[sessID].expTags.push(expTag);
		}

	};

	var bpuGroupsCrossCheckWithUser = function (user, bpuDoc) {
		for (var ind = 0; ind < bpuDoc.allowedGroups.length; ind++) {
			for (var jnd = 0; jnd < user.groups.length; jnd++) {
				if (bpuDoc.allowedGroups[ind] === user.groups[jnd]) return true;
			}
		}
		return false;
	};

	var isLiveActive = function (status) {
		return (status === that.config.mainConfig.bpuStatusTypes.running ||
		status === that.config.mainConfig.bpuStatusTypes.pendingRun ||
		status === that.config.mainConfig.bpuStatusTypes.finalizing ||
		status === that.config.mainConfig.bpuStatusTypes.reseting);
	};

	//Create bpu updates and sort active bpus experiments into session id
	var bpusUpdate = [];

	if (bpuDocs) {
		bpuDocs.forEach(function (bpuDoc) {

			if(bpuDoc) {
				var liveBpuExperimentPart = null;

				if (isLiveActive(bpuDoc.bpuStatus)) {
					liveBpuExperimentPart = {
						username:             bpuDoc.liveBpuExperiment.username,
						bc_timeLeft:          bpuDoc.liveBpuExperiment.bc_timeLeft,
						group_experimentType: bpuDoc.liveBpuExperiment.group_experimentType
					};
				}

				var bpuObj = {
					name:               bpuDoc.name, index: bpuDoc.index,
					bpuStatus:          bpuDoc.bpuStatus,
					bpu_processingTime: bpuDoc.bpu_processingTime,

					liveBpuExperiment: liveBpuExperimentPart
				};
				//Add to Session Update
				if (bpuObj.liveBpuExperiment) {
					addBpuToSessionID(bpuDoc.liveBpuExperiment.sessionID, JSON.parse(JSON.stringify(bpuObj)));
				}
				bpuObj.allowedGroups = bpuDoc.allowedGroups;                 //should be deleted before going out
				//Add to bpu Update
				bpusUpdate.push(bpuObj);
			}
		});
	}

	//Sort Queue Exps and New Exp By sessionID
	Object.keys(listExperiment).forEach(function (key) {
		if (key[0] !== '_') {
			if (key.search('eug') > -1 || key === 'newExps') {
				listExperiment[key].forEach(function (expTag) {
					if (expTag.session) {
						addExpToSessionID(expTag.session.sessionID, expTag);
					}
				});
			}
		}
	});

	//Connect session ids with sockets
	Object.keys(that.userManager.io.sockets.sockets).forEach(function (socketKey) {
		var socketID = socketKey;
		if (socketKey.split('#').length > 0) socketID = socketKey.split('#')[1];

		var socket = that.userManager.io.sockets.sockets[socketKey];
		if (socket.sessionDoc) {
			var socketUpdateObj = {
				bpuExps:      [],
				queueExpTags: [],
				groupBpus:    []
			};
			if (updatePerSessionID[socket.sessionDoc.sessionID]) {
				if (updatePerSessionID[socket.sessionDoc.sessionID].bpuExps) {
					socketUpdateObj.bpuExps = updatePerSessionID[socket.sessionDoc.sessionID].bpuExps;
				}
				if (updatePerSessionID[socket.sessionDoc.sessionID].expTags) {
					socketUpdateObj.queueExpTags = updatePerSessionID[socket.sessionDoc.sessionID].expTags;
				}
			}
			bpuDocs.forEach(function (bpuDoc) {
				//Check if bpu is in session user groups
				if (bpuGroupsCrossCheckWithUser({groups: socket.sessionDoc.user.groups}, bpuDoc)) {
					var bpuDocJson = JSON.parse(JSON.stringify(bpuDoc));
					if (runningQueueTimesPerBpuName[bpuDoc.name]) {
						bpuDocJson.runningQueueTime = runningQueueTimesPerBpuName[bpuDoc.name];
					} else {
						bpuDocJson.runningQueueTime = 0;
					}
					delete bpuDocJson.allowedGroups;
					socketUpdateObj.groupBpus.push(bpuDocJson);
				}
			});
			socket.emit('update', socketUpdateObj);
		}
	});
};

Controller.prototype.connect = function (cb) {
	var that = this;

	var serverInfo = {
		Identifier:             that.config.myWebServerIdentifier,
		name:                   that.config.myWebServerName,
		socketClientServerPort: that.config.myControllerPort
	};

	var addr = that.config.controllerAddress;
	that.logger.debug('connecting controller...');

	that.socket = socketClient(addr, {multiplex: false, reconnection: true});

	that.socket.on('disconnect', function () {
		that.logger.warn('controller disconnected');
	});

	that.socket.on('connect', function () {
		that.logger.info('controller => ' + addr);

		that.socket.emit('setConnection', serverInfo, function (err, auth) {
			if (err) {
				that.logger.error('controller authentication failed: ' + err);
				cb(err, that);
			} else {
				that.logger.info('controller authenticated: ' + auth.Name);
				that.auth = auth;
				cb(null, that);
			}
		});
	});

	//update is joined in user socket connection
	that.socket.on('update', function (bpuDocs, listExperiment, runningQueueTimesPerBpuName) {
		that.compileClientUpdateFromController(bpuDocs, listExperiment, runningQueueTimesPerBpuName);
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