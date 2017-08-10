"use strict";
var async          = require('async');

var config = require('../config');
var logger = require('./logging');
var constants    = require('../constants');

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
						if (app.microscopesIndex[microscope.name]) {
							app.microscopesIndex[microscope.name].doc = microscope;
						} else {
							app.microscopesIndex[microscope.name] = new Microscope({
								name:    microscope.name,
								doc:     microscope,
								address: 'http://' + microscope.localAddr.ip + ':' + microscope.localAddr.serverPort
							});
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
					// logger.info('\tTimeout:\t' + microscope.inactiveCount);
				}
				else {
					logger.error('\tconnected:\t' + microscope.isConnected);
					// logger.error('\tTimeout:\t' + microscope.inactiveCount);
				}

			});

			return callback(null);

		}
	}
};