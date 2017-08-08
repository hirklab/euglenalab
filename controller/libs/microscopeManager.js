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
			logger.debug('fetching BPUs...');

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

		checkIfConnected: function (callback) {
			logger.debug('checking BPUs...');

			var parallel = [];
			var keys     = Object.keys(app.microscopesIndex);

			keys.sort(function (objA, objB) {
				return app.microscopesIndex[objA].doc.index - app.microscopesIndex[objB].doc.index;
			});

			keys.forEach(function (key) {
				parallel.push(app.microscopesIndex[key].check.bind(app.microscopesIndex[key]));
			});

			async.parallel(parallel, function (err) {
				keys.forEach(function (key) {
					logger.info(app.microscopesIndex[key].doc.name + '(' + app.microscopesIndex[key].address + ')');

					app.microscopesIndex[key].messages.sort(function (objA, objB) {
						return objA.time - objB.time;
					});

					app.microscopesIndex[key].messages.forEach(function (msgObj) {
						if (msgObj.isErr) {
							logger.error('\t' + msgObj.msg);
						} else {
							logger.info('\t' + msgObj.msg);
						}
					});
				});

				if (err) {
					logger.error(err);
				}

				return callback(null);
			});
		},
	}
};