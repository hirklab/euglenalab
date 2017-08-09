"use strict";
var async          = require('async');
var socketIO       = require('socket.io');
var socketIOClient = require('socket.io-client');

var config = require('../config');
var logger = require('./logging');

var constants    = require('../constants');
var BPU_STATES   = constants.BPU_STATES;
var BPU_EVENTS   = constants.BPU_EVENTS;
var BPU_MESSAGES = constants.BPU_MESSAGES;

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
					logger.info('\tConnected:\t' + microscope.isConnected);
					// logger.info('\tTimeout:\t' + microscope.inactiveCount);
				}
				else {
					logger.error('\tConnected:\t' + microscope.isConnected);
					// logger.error('\tTimeout:\t' + microscope.inactiveCount);
				}

			});

			return callback(null);

		},
	}
};