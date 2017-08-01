var socketIo       = require('socket.io');
var socketIoClient = require('socket.io-client');
var async          = require('async');
var mongoose       = require('mongoose');
var path           = require('path');

var config = require('./config');

var filename = path.basename(__filename);


//Main Object
var app = {
    startDate: new Date(),
    config:config,

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

var setupLogger = function (callback) {
    require('./libs/logging')(app);
    callback(null);
};

var setupMongoose = function (callback) {
    app.logger.debug('setting database...');
    require('./libs/database')(app, callback);
};

var setupSocketClientServer = function (callback) {
    app.logger.debug('setting socket server...');
    require('./libs/socketServer')(app, callback);
};

var getExperiments = function (callback) {
    app.logger.debug('fetching experiments...');

    app.db.getExperiments(function (err, experiments) {
        if (err) {
            app.logger.error(err);
            callback(err);
        } else {
            app.logger.debug('got experiments');

            app.experiments = experiments;
            callback(null);
        }
    });
};

var init = function (callback) {
    async.series([
        setupLogger,
        setupMongoose,
        setupSocketClientServer,
        getExperiments
    ], function (err) {
        if (err) {
            app.logger.error(err);
            callback(err);
        } else {
            app.logger.info('app initialized');
            callback(null);
        }
    });
};

var loop = function () {
    app.utils.clearConsole();
    app.startDate = new Date();

    var microscopeUtils = require('./libs/microscope')(app);
    var experimentUtils = require('./libs/experiment')(app);

    async.series([
        microscopeUtils.getMicroscopes,
        microscopeUtils.checkIfConnected,

        experimentUtils.checkExperiments,
        experimentUtils.scheduleExperiments,
        experimentUtils.updateExperimentsQueue,
        experimentUtils.notifyClients
    ], function (err) {
        if (err) {
            app.logger.error(err);
        } else {
            setTimeout(function () {
                loop();
            }, config.LOOP_INTERVAL);
        }
    });
};

init(function (err) {
    if (err) {
        app.logger.error(err);
    } else {
        loop();
    }
});