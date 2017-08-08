// import env from 'dotenv';
var tracer = require('tracer');
var colors = require('colors');

var LOG_LEVELS = require('../constants').LOG_LEVELS;

// env.config();

var logger = tracer.colorConsole(
	{
		format:     "{{timestamp}} <{{file}}:{{line}}> {{message}}",
		dateformat: "HH:MM:ss.L",
		level:      LOG_LEVELS[0],
		filters:    {
			log:   colors.white,
			trace: colors.magenta,
			debug: colors.blue,
			info:  colors.green,
			warn:  colors.yellow,
			error: [colors.red, colors.bold]
		}
	});

tracer.setLevel(LOG_LEVELS[2]);

module.exports = logger;