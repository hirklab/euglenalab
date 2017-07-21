var async = require('async');
var os = require('os');
var fs = require('fs');
var exec = require('child_process').exec;
var socketIo = require('socket.io');
var lodash = require('lodash');
var tracer = require('tracer');
var colors = require('colors');
var path = require('path');

var script_initializeBpu = require('./initializeBpu.js');

var filename = path.basename(__filename);

var home_dir = process.env.HOME || process.env.HOMEPATH || process.env.USERPROFILE;

var LOGGER_LEVELS = ['log', 'trace', 'debug', 'info', 'warn', 'error'];

const MACHINE = process.env.MACHINE;

var isFake = MACHINE !== 'raspberrypi';

var app = {
	//Basic
	name: filename,
	startDate: new Date(),

	//Logger
	logger: null,
	loggerLevel: 'log',

	//Other Constant Scripts/Data
	MainConfig: require('../shared/mainConfig.js'),
	BpuAutoLightData: require('../shared/autoUserData.json'),
	BpuTestLightData: require('../shared/testLightUserData.json'),
	myFunctions: require('../shared/myFunctions.js'),

	//Scripts for longer seequences
	script_socketBpu: require('./socketBpu.js'),
	script_resetBpu: require('./resetBpu.js'),
	script_runExperiment: require('./runExperiment.js'),
	script_fakeMongo: require('./fakeMongo.js'),

	//Deps needed throughout application
	async: async,

	//Init Flags
	//Init Objects
	bpu: null,
	bpuConfig: null,
	db: null,
	//Init Info
	mainDataDir: home_dir + '/bpuData',
	expDataDir: home_dir + '/bpuData/tempExpData',
	mountedDataDir:  (isFake? home_dir + '/bpuEuglenaData/eug100': '/mnt/bpuEuglenaData/' + os.hostname()),
	bpuStatusTypes: null,

	//Run Flags
	isFlushing: false,
	isExperimentAdded: false,
	isExperimentOverAndWaitingForPickup: false,

	//Run Objects
	exp: null,
	didConfirmRun: false,
	didConfirmTimeoutRun: false,
	//Run Info
	bpuStatus: null,
	bpuStatusError: null,

};

app.tracer = tracer;

app.logger = app.tracer.colorConsole(
	{
		format: "{{timestamp}} <{{file}}:{{line}}> {{message}}",
		dateformat: "HH:MM:ss.L",
		level: LOGGER_LEVELS[0],
		filters: {
			log: colors.white,
			trace: colors.magenta,
			debug: colors.blue,
			info: colors.green,
			warn: colors.yellow,
			error: [colors.red, colors.bold]
		}
	});
app.tracer.setLevel(LOGGER_LEVELS[2]);

var deps = {fs: fs, os: os, exec: exec, socketIo: socketIo, lodash: lodash};

script_initializeBpu(app, deps, function (err) {
	if (err) {
		app.logger.error('application initialization Error ' + ' ' + err);
	} else {
		app.logger.warn('application initialization end');

		//Check for Objects
		var didFail = true;
		if (app.bpuConfig === null || app.bpuConfig === undefined) {
			app.logger.error('application initialization no app.bpuConfig');
		} else if (app.bpuStatusTypes === null || app.bpuStatusTypes === undefined) {
			app.logger.error('application initialization no app.bpuStatusTypes');
		} else if (app.db === null || app.db === undefined) {
			app.logger.error('application initialization no app.db');
		} else {
			didFail = false;
		}

		//App is ready
		if (didFail) {
			app.logger.error('application initialization Failed');
		} else if (app.bpuStatus !== app.bpuStatusTypes.initializingDone) {
			app.logger.error('status is not app.bpuStatusTypes.initializingDone its ' + app.bpuStatus);
		} else {
			app.logger.warn('application initialization Okay');
			//Reset to begin
			var opts = {};
			app.logger.debug('application initialization reseting to begin');
			app.script_resetBpu(app, deps, opts, function (err) {
				if (app.bpu === null || app.bpu === undefined) {
					app.logger.error('application initialization reseting issue no app.bpu');
				} else if (err) {
					app.logger.error('application initialization reseting ' + err);
				} else {
					console.log(app.bpuConfig);
					app.logger.debug('application initialization READY FOR EXPERIMENT');
				}
			});
		}
	}
});
