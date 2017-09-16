var socketClient = require('socket.io-client');
var _ = require('lodash');
var async = require('async');
var Queue = require('bee-queue');

// var myFunctions = require('../../shared/myFunctions.js');

var logger = require('./logging');

var config = require('./config');
var constants = require('./constants');
var CLIENT_MESSAGES = constants.CLIENT_MESSAGES;
var EXPERIMENT_TYPE = constants.EXPERIMENT_TYPE;

// var Scheduler = require('./scheduler');
var UserManager = require('./userManager');
var Microscope = require('./microscope');


// Constructor
function Controller(config, app) {
	var that = this;

	that.app = app;
	that.db = app.db;
	that.config = config;

    // object list of connected microscopes
    that.microscopesIndex = {};

    // object list of experiments from database
    that.experiments = null;

    // list of experiments in memory (mostly pending, running)
    // push this to redis later
    that.experimentsCache = [];

    // any new experiment is collected here before being added to cache
    that.newExperimentsIndex = {};

	that.userManager = new UserManager(config, app.io, app.sessionMiddleware, app.db);

	that.queue = new Queue('scheduler', {
		removeOnSuccess: true,
		removeOnFailure: true
	});

	that.queue.on('ready', function() {


	});

	that.queue.on('error', function(err) {
		logger.error(err);
	});

	that.queue.on('succeeded', function(job, result) {
		// logger.info('job ' + job.id + ' succeeded :' +  job.data.description);

		// todo save it in database now
	});

	that.queue.on('failed', function(job, err) {
		logger.warn('job ' + job.id + ' failed :' + err);

		// todo save it in database now
	});

	that.queue.on('progress', function(jobId, progress) {
		// logger.debug('job ' + jobId + ' reported progress: ' + progress + '%');
	});

	that.initialize(function() {
		logger.debug('main scheduler ready');
	});
}


Controller.prototype.initialize = function(callback) {
	var that = this;

	that.queue.process(1, function(job, done) { // process 1 job at a time
		// logger.debug('processing job ' + job.id);

		var experiment = job.data;

		// todo grab the experiment from general queue and put it into specific microscope queue
		// based on
		// - user choice
		// - availability
		// - quality



		// todo round robin scheduling based on id partitioning
		// todo employ more powerful partitioning method

		var activeMicroscopes = _.filter(Object.values(that.microscopesIndex), function(microscope) {
			return microscope.isConnected;
		})

		if (activeMicroscopes.length > 0) {
			that.addExperimentToMicroscope(experiment, activeMicroscopes[0]);
			return done(null, 'dispatched');
		} else {
			return done('microscope not available', 'failed');
		}

	});

	callback();
};

// class methods
Controller.prototype.connect = function(cb) {
	var that = this;
	logger.debug('connecting controller...');

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
};

Controller.prototype.addExperiment = function(experiment, callback) {
	var that = this;

	// logger.info(experiment);

	var job = that.queue.createJob(experiment);

	job.save(function(err, job) {
		// logger.debug('pushing a new experiment ' + job.id + ' on main queue');
	});

	job.on('progress', function(progress) {
		logger.info('job ' + job.id + ' reported progress: ' + progress + '%');
	});

	callback(null);
};


Controller.prototype.setStimulus = function(data) {
	var message = {
		type: 'experimentSet',
		payload: experiment
	};

	// this.socket.emit(this.config.mainConfig.socketStrs.bpu_runExpLedsSet, data);
};

Controller.prototype.addExperimentToMicroscope = function(experiment, microscope, callback) {
	var that = this;

	logger.info(microscope);

	microscope.addExperiment(experiment, callback);

	// job.save(function(err, job) {
	// 	logger.debug('pushing a new experiment ' + job.id + ' on ' + microscopeName);
	// });

	// job.on('progress', function (progress) {
	// 	logger.info('job ' + job.id + 'on microscope ' + microscopeName + ' reported progress: ' + progress + '%');
	// });

	// if (callback) callback();
};



Controller.prototype.loop = function() {
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

		that.notifyClients.bind(that)
	], function(err) {
		if (err) {
			logger.error(err);
		} else {
			setTimeout(function() {
				that.loop();
			}, config.LOOP_INTERVAL);
		}
	});
};

Controller.prototype.getMicroscopes = function(callback) {
	var that = this;
	// logger.debug('fetching BPUs...');

	that.db.getBPUs(function(err, microscopes) {
		if (err) {
			logger.error(err);
			return callback(err);
		} else {
			microscopes.forEach(function(microscope) {
				if (microscope.name in that.microscopesIndex) {

                    // database sync
                    that.microscopesIndex[microscope.name].doc = microscope;

                    // todo perform live sync here

                    // todo remove microscopes which are not in passed list


                } else {

					// new microscope introduced in database
					that.microscopesIndex[microscope.name] = new Microscope({
						id: microscope._id,
						name: microscope.name,
						doc: microscope,
						address: 'http://' + microscope.localAddr.ip + ':' + microscope.localAddr.serverPort
					});
				}
			});

            return callback(null);
        }
    });
};

Controller.prototype.showStatus = function(callback) {
	var that = this;
	// logger.debug('checking BPUs...');

    var keys = Object.keys(that.microscopesIndex);

	keys.sort(function(objA, objB) {
		return that.microscopesIndex[objA].doc.index - that.microscopesIndex[objB].doc.index;
	});

	keys.forEach(function(key) {
		var microscope = that.microscopesIndex[key];

		if (microscope.isConnected) {
			logger.info(microscope.doc.name + '(' + microscope.address + ')');
			logger.info('\tqueueTime:\t' + microscope.queueTime);
			logger.info('\texperiment:\t' + (microscope.experiment ? microscope.experiment.submittedAt : 'None'));
			// logger.info('\tTimeout:\t' + microscope.inactiveCount);
		} else {
			logger.error(microscope.doc.name + '(' + microscope.address + ')');
			logger.error('\texperiment:\t' + (microscope.experiment ? microscope.experiment.submittedAt : 'None'));
			// logger.error('\tTimeout:\t' + microscope.inactiveCount);
		}

    });

    return callback(null);
};

Controller.prototype.notifyClients = function(callback) {
	var that = this;

    var microscopes = _.values(that.microscopesIndex);

	var bpuDocs = _.chain(microscopes)
		.filter(function(microscope) {
			return microscope.isConnected;
		})
		.map(function(microscope) {
			var data = _.clone(microscope);

            // if (isLiveActive(bpuDoc.bpuStatus)) {
            // 	liveBpuExperimentPart = {
            // 		username:             bpuDoc.liveBpuExperiment.username,
            // 		bc_timeLeft:          bpuDoc.liveBpuExperiment.bc_timeLeft,
            // 		group_experimentType: bpuDoc.liveBpuExperiment.group_experimentType
            // 	};
            // }
            // 	// bpu_processingTime: bpuDoc.bpu_processingTime,

            // is live
            //(status === that.config.mainConfig.bpuStatusTypes.running ||
            // status === that.config.mainConfig.bpuStatusTypes.pendingRun ||
            // status === that.config.mainConfig.bpuStatusTypes.finalizing ||
            // status === that.config.mainConfig.bpuStatusTypes.reseting);

            // var bpuGroupsCrossCheckWithUser = function (user, bpuDoc) {
            //     for (var ind = 0; ind < bpuDoc.allowedGroups.length; ind++) {
            //         for (var jnd = 0; jnd < user.groups.length; jnd++) {
            //             if (bpuDoc.allowedGroups[ind] === user.groups[jnd]) return true;
            //         }
            //     }
            //     return false;
            // };

            return data.state;
        });

	var users = _.chain(that.userManager.users)
		.map(function(user) {
			return {
				_id: user._id,
				username: user.username
			}
		});

	// todo better to filter data only for microscopes which user is allowed to see
	that.userManager.sendMessage(CLIENT_MESSAGES.TX.STATUS, {
		microscopes: bpuDocs,
		experiments: that.experiments, //.toJSON(),
		users: users
	});


    return callback(null);
};


// export the class
module.exports = Controller;