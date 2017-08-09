var socketIo       = require('socket.io');
var socketIoClient = require('socket.io-client');
var async          = require('async');
var mongoose       = require('mongoose');
var path           = require('path');
var Agenda           = require('agenda');

var config = require('./config');
var logger = require('./libs/logging');

var filename = path.basename(__filename);


//Main Object
var app = {
    startDate: new Date(),

    scheduler: null,

    utils:                          require('../shared/myFunctions.js'),
    mainConfig:                     require('../shared/mainConfig.js'),
    submitExperimentRequestHandler: require('./libs/submitExperimentRequestHandler.js'),

    // object list of connected microscopes
    microscopesIndex: {},

    // list of connected servers
    clients: [],

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

    bpuLedsSetMatch: {},

    Auth: {
        C422691AA38F9A86EC02CB7B55D5F542: {
            Name:            'radiantllama',
            Identifier:      'C422691AA38F9A86EC02CB7B55D5F542',
            arePassKeysOpen: false,
            PassKeys:        ['R-OpYLbT6Kk-GXyEmX1SOOOHDw157mJc'],
            socketID:        null,
            serverInfo:      null
        },
        b3cagcde2684ebd2cba325555ec2703b: {
            Name:            'InternalWeb1',
            Identifier:      'b3cagcde2684ebd2cba325555ec2703b',
            arePassKeysOpen: true,
            PassKeys:        [],
            socketID:        null,
            serverInfo:      null
        },
        b3cagcde2684ebd2cba325555ec2703c: {
            Name:            'InternalWeb2',
            Identifier:      'b3cagcde2684ebd2cba325555ec2703c',
            arePassKeysOpen: true,
            PassKeys:        [],
            socketID:        null,
            serverInfo:      null
        }
    }
};


var setupMongoose = function (callback) {
    logger.debug('setting database...');
    require('./libs/database')(app, callback);
};

var setupScheduler = function(callback){
	logger.debug('setting job scheduler...');
	app.scheduler = new Agenda({db: {address: config.DB_URL, collection: 'jobs' }});

	app.scheduler.on('ready', function() {
		app.scheduler.start();

		callback(null);
	});
}

var setupSocketClientServer = function (callback) {
    logger.debug('setting socket server...');
    require('./libs/socketServer')(app, callback);
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
        setupSocketClientServer,
        getExperiments
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
    app.utils.clearConsole();
    app.startDate = new Date();

    var microscopeUtils = require('./libs/microscopeManager')(app);
    var experimentUtils = require('./libs/experiment')(app);

    async.series([
        microscopeUtils.getMicroscopes,
        microscopeUtils.showStatus,

        experimentUtils.checkExperiments,
        experimentUtils.scheduleExperiments,
        experimentUtils.updateExperimentsQueue,

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

init(function (err) {
    if (err) {
        logger.error(err);
    } else {
        loop();
    }
});