"use strict";
var async = require('async');

var config    = require('../config');
var logger    = require('./logging');
var constants = require('../constants');

var Microscope = require('./microscope');

module.exports = function (app) {

	return {
		getMicroscopes: function (callback) {
			// logger.debug('fetching BPUs...');

			app.db.getBPUs(function (err, microscopes) {
				if (err) {
					logger.error(err);
					return callback(err);
				} else {
					microscopes.forEach(function (microscope) {
						if (microscope.name in app.microscopesIndex) {

							// database sync
							app.microscopesIndex[microscope.name].doc = microscope;

							// todo perform live sync here

							// todo remove microscopes which are not in passed list


						} else {

							// new microscope introduced in database
							app.microscopesIndex[microscope.name] = new Microscope({
								id:      microscope._id,
								name:    microscope.name,
								doc:     microscope,
								address: 'http://' + microscope.localAddr.ip + ':' + microscope.localAddr.serverPort
							});

							app.scheduler.addQueue(microscope.name);
						}
					});

					return callback(null);
				}
			});
		},

		showStatus: function (callback) {
			// logger.debug('checking BPUs...');

			var keys = Object.keys(app.microscopesIndex);

			keys.sort(function (objA, objB) {
				return app.microscopesIndex[objA].doc.index - app.microscopesIndex[objB].doc.index;
			});

			keys.forEach(function (key) {
				var microscope = app.microscopesIndex[key];

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

		}
	}
};