var tracer = require('tracer');
var colors = require('colors');

var config = require('../config');

module.exports = function (app) {
	"use strict";
	app.tracer = tracer;

	app.logger = app.tracer.colorConsole({
		format:     "{{timestamp}} <{{file}}:{{line}}> {{message}}",
		dateformat: "HH:MM:ss.L",
		level:      config.LOG_LEVEL,
		filters:    {
			log:   colors.white,
			trace: colors.magenta,
			debug: colors.blue,
			info:  colors.green,
			warn:  colors.yellow,
			error: [colors.red, colors.bold]
		}
	});

	app.tracer.setLevel(config.LOG_LEVEL);
};