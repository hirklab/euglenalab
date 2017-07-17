var mongoose = require('mongoose');

var mainConfig = require('../shared/mainConfig.js');

var constants = {
	LOG_LEVELS: ['log', 'trace', 'debug', 'info', 'warn', 'error']
};

module.exports = {
	LOG_LEVEL: constants.LOG_LEVELS[2],
	DB_URL: mainConfig.adminFlags.getMongoUri(),
	SERVER_IP:'localhost',
	SERVER_PORT:mainConfig.adminFlags.getControllerPort(),
	mongooseObjID: mongoose.Types.ObjectId,
	runCounter: 0,
	SocketTimeoutTillReset: 30,
	errorRemoveMs: 60000,
	maxErrorPrint: 5,
	runLoopInterval: 1000,
	liveUserConfirmTimeout: 15000,
	lastScripterSendDate: new Date(),
	doSendScripters: true,
	ScripterSendInterval: 30 * 60 * 1000,
	nextToSendBpuName: null,
};
