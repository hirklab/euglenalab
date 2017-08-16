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

							// todo a new queue needs to be created for this microscope
						}
					});

					return callback(null);
				}
			});
		},

		showStatus: function (callback) {
			// logger.debug('checking BPUs...');

			var parallel = [];
			var keys     = Object.keys(app.microscopesIndex);

			keys.sort(function (objA, objB) {
				return app.microscopesIndex[objA].doc.index - app.microscopesIndex[objB].doc.index;
			});

			keys.forEach(function (key) {
				var microscope = app.microscopesIndex[key];
				logger.info(microscope.doc.name + '(' + microscope.address + ')');

				if (microscope.isConnected) {
					logger.info('\tconnected:\t' + microscope.isConnected);
					logger.info('\tqueueTime:\t' + microscope.queueTime);
					logger.info('\texperiment:\t' + microscope.experiment);
					// logger.info('\tTimeout:\t' + microscope.inactiveCount);
				}
				else {
					logger.error('\tconnected:\t' + microscope.isConnected);
					logger.info('\texperiment:\t' + microscope.experiment);
					// logger.error('\tTimeout:\t' + microscope.inactiveCount);
				}

			});

			return callback(null);

		}
	}
};