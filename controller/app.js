var socketIo       = require('socket.io');
var socketIoClient = require('socket.io-client');
var async          = require('async');
var mongoose       = require('mongoose');
var path           = require('path');


var config    = require('./config');
var logger    = require('./libs/logging');
var Webserver = require('./libs/webserver');
var Scheduler = require('./libs/scheduler');

var filename = path.basename(__filename);
logger.debug(filename);


//Main Object
var app = {
	startDate: new Date(),

	scheduler: null,

	utils:      require('../shared/myFunctions.js'),
	mainConfig: require('../shared/mainConfig.js'),
	// submitExperimentRequestHandler: require('./libs/submitExperimentRequestHandler.js'),

	// object list of connected microscopes
	microscopesIndex: {},

	// object list of experiments from database
	experiments: null,

	//list of experiments in memory (mostly pending, running)
	experimentsCache: [],

	// any new experiment is collected here before being added to cache
	newExperimentsIndex: {},

	errors: {
		experiment: [],
		live:       [],
		bpu:        []
	},

	bpuLedsSetMatch: {}
};

var setupMongoose = function (callback) {
	logger.debug('setting database...');
	require('./libs/database')(app, callback);
};

var setupScheduler = function (callback) {
	logger.debug('setting job scheduler...');
	app.scheduler = new Scheduler(app);
	app.scheduler.initialize(callback);
};

var setupWebserver = function (callback) {
	logger.debug('setting socket server...');
	app.webserver = new Webserver(callback);
};

var getExperiments = function (callback) {
	logger.debug('fetching experiments...');

	app.db.getExperiments(function (err, experiments) {
		if (err) {
			logger.error(err);
			callback(err);
		} else {
			logger.debug('got experiments');

			app.experiments = experiments;
			callback(null);
		}
	});
};

var init = function (callback) {
	async.series([
		setupMongoose,
		setupScheduler,
		setupWebserver,
		// getExperiments
	], function (err) {
		if (err) {
			logger.error(err);
			callback(err);
		} else {
			logger.info('app initialized');
			callback(null);
		}
	});
};

var loop = function () {
	// app.utils.clearConsole();
	app.startDate = new Date();

	var microscopeUtils = require('./libs/microscopeManager')(app);
	var experimentUtils = require('./libs/experimentManager')(app);

	async.series([
		microscopeUtils.getMicroscopes,
		// microscopeUtils.showStatus,

		// experimentUtils.checkExperiments,
		// experimentUtils.scheduleExperiments,
		// experimentUtils.updateExperimentsQueue,

		experimentUtils.notifyClients
	], function (err) {
		if (err) {
			logger.error(err);
		} else {
			setTimeout(function () {
				loop();
			}, config.LOOP_INTERVAL);
		}
	});
};

var gracefulShutdown = function () {
	logger.info('shutting down controller...');

	if (app.scheduler) {
		logger.info('shutting down scheduler...');

		// app.scheduler.stop(function () {
		process.exit(0);
		// });
	} else {
		process.exit(0);
	}
};

process.on('SIGTERM', gracefulShutdown);
process.on('SIGINT', gracefulShutdown);

init(function (err) {
	if (err) {
		logger.error(err);
	} else {
		setInterval(function () {
			var experiment = {
				type:           'batch',
				description:    new Date(),
				duration:       15, //85,
				machine:        {
					ip:       "171.65.103.56",
					hostname: "sr17-4dd5a61365.stanford.edu",
					city:     "Stanford",
					region:   "California"
				},
				bpu:            {
					name: 'eug100'
				},
				proposedEvents: [
					{time: 0, topLED: 0, rightLED: 0, bottomLED: 0, leftLED: 0},
					{time: 15000, topLED: 100, rightLED: 0, bottomLED: 0, leftLED: 0},
					// {time: 30000, topLED: 0, rightLED: 100, bottomLED: 0, leftLED: 0},
					// {time: 45000, topLED: 0, rightLED: 0, bottomLED: 100, leftLED: 0},
					// {time: 60000, topLED: 0, rightLED: 0, bottomLED: 0, leftLED: 100},
					// {time: 75000, topLED: 0, rightLED: 0, bottomLED: 0, leftLED: 0}
				],
				submittedAt:    "2017-08-16T19:44:35.333Z"
			};

			app.scheduler.addExperiment(experiment, function () {

			})
		}, 1.5 * 60000); // send experiment every 10 minute


		loop();
	}
});

