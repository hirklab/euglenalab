// todo install redis steps
// https://www.digitalocean.com/community/tutorials/how-to-install-and-use-redis

var Queue = require('bee-queue');
var lodash = require('lodash');

var logger    = require('./logging');
var config    = require('../config');
var constants = require('../constants');

// features to consider
// auto expiring keys
// - clear experiments if not started at their required time
// - clear completed experiments

function Scheduler() {
	var that    = this;
	that.queues = {};

	that.queue = new Queue('scheduler', {
		removeOnSuccess: true,
		removeOnFailure: true
	});

	that.queue.on('ready', function () {
		logger.debug('main scheduler ready');

	});

	that.queue.on('error', function (err) {
		logger.error(err);
	});

	that.queue.on('succeeded', function (job, result) {
		// logger.info('job ' + job.id + ' succeeded :' +  job.data.description);

		// save it in database now
	});

	that.queue.on('failed', function (job, err) {
		logger.warn('job ' + job.id + ' failed :' + err);

		// save it in database now
	});

	that.queue.on('progress', function (jobId, progress) {
		// logger.debug('job ' + jobId + ' reported progress: ' + progress + '%');
	});
}

Scheduler.prototype.initialize = function (callback) {
	var that = this;

	that.queue.process(1, function (job, done) { // process 1 job at a time
		// logger.debug('processing job ' + job.id);

		var experiment = job.data;

		// grab the experiment from general queue and put it into specific microscope queue
		// based on
		// - user choice
		// - availability
		// - quality

		if (Object.keys(that.queues).length > 0) {

			// todo round robin scheduling based on id partitioning
			// todo employ more powerful partitioning method

			var microscope = Object.keys(that.queues)[job.id % Object.keys(that.queues).length];
			that.addExperimentToMicroscope(experiment, microscope);

			return done(null, 'dispatched');
		} else {
			return done('microscope not available', 'failed');
		}


	});

	callback();
};

Scheduler.prototype.addQueue = function (name, callback) {
	var that = this;

	if (name && name != '') {

		if (name in that.queues) {

		} else {
			that.queues[name] = new Queue(name, {
				removeOnSuccess: true,
				removeOnFailure: true
			});

			that.queues[name].on('ready', function () {
				logger.debug(name + ' scheduler ready');

			});

			that.queues[name].on('error', function (err) {
				logger.error(err);
			});

			that.queues[name].on('succeeded', function (job, result) {
				logger.info('job ' + job.id + ' on microscope ' + name + ' succeeded :' + job.data.description);

				// save it in database now
			});

			that.queues[name].on('failed', function (job, err) {
				logger.warn('job ' + job.id + ' on microscope ' + name + ' failed :' + err);

				// save it in database now
			});

			that.queues[name].on('progress', function (jobId, progress) {
				// logger.debug('job ' + jobId + ' on microscope ' + name + ' reported progress: ' + progress + '%');
			});

			that.queues[name].process(1, function (job, done) { // process 1 job at a time
				// logger.debug('processing job ' + job.id);

				var experiment = job.data;

				// run the experiment here
				// set experiment
				// get confirmation if live
				// connect user to microscope
				// run experiment now
				// push events or push experiment
				// wait for duration or user cancellation
				// finish experiment

				return done(null, 'completed');
			});
		}

		if (callback) callback();
	}
};

Scheduler.prototype.addExperimentToMicroscope = function (experiment, microscopeName, callback) {
	var that = this;


	// logger.info(experiment);

	var job = that.queues[microscopeName].createJob(experiment);

	job.save(function (err, job) {
		logger.debug('pushing a new experiment ' + job.id + ' on ' + microscopeName);
	});

	// job.on('progress', function (progress) {
	// 	logger.info('job ' + job.id + 'on microscope ' + microscopeName + ' reported progress: ' + progress + '%');
	// });

	if (callback) callback();
};

Scheduler.prototype.addExperiment = function (experiment, callback) {
	var that = this;

	// logger.info(experiment);

	var job = that.queue.createJob(experiment);

	job.save(function (err, job) {
		// logger.debug('pushing a new experiment ' + job.id + ' on main queue');
	});

	// job.on('progress', function (progress) {
	// 	logger.info('job ' + job.id + ' reported progress: ' + progress + '%');
	// });

	callback();
};

module.exports = Scheduler;