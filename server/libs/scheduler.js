// todo install redis steps
// https://www.digitalocean.com/community/tutorials/how-to-install-and-use-redis

var Queue = require('bee-queue');
var lodash = require('lodash');

var logger = require('./logging');
var config = require('./config');
var constants = require('./constants');

var EXPERIMENT_TYPE = constants.EXPERIMENT_TYPE;

// features to consider
// auto expiring keys
// - clear experiments if not started at their required time
// - clear completed experiments

function Scheduler(controller) {
	var that = this;
	that.controller = controller;

	// that.app              = app;
	// that.queues = {};
	// // object list of connected microscopes
	// that.microscopesIndex = {};

	// // object list of experiments from database
	// that.experiments = null;

	// // list of experiments in memory (mostly pending, running)
	// // push this to redis later
	// that.experimentsCache = [];

	// // any new experiment is collected here before being added to cache
	// that.newExperimentsIndex = {};

	// won't be needed if we keep posting errors
	that.errors = {
		experiment: [],
		live: [],
		bpu: []
	};

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
}

Scheduler.prototype.initialize = function(callback) {
	var that = this;

	that.queue.process(1, function(job, done) { // process 1 job at a time
		// logger.debug('processing job ' + job.id);

		var experiment = job.data;

		// todo grab the experiment from general queue and put it into specific microscope queue
		// based on
		// - user choice
		// - availability
		// - quality

		if (Object.keys(that.queues).length > 0) {

			// todo round robin scheduling based on id partitioning
			// todo employ more powerful partitioning method

			var activeMicroscopes = lodash.mapKeys(that.queues, function(value, key) {

			})

			var microscope = Object.keys(that.queues)[job.id % Object.keys(that.queues).length];
			that.addExperimentToMicroscope(experiment, microscope);

			return done(null, 'dispatched');
		} else {
			return done('microscope not available', 'failed');
		}


	});

	callback();
};


module.exports = Scheduler;