var env    = require('dotenv');
var tracer = require('tracer');
var colors = require('colors');

var LOG_LEVELS = require('./constants').LOG_LEVELS;

env.config();

var LOG_LEVEL = parseInt(process.env.LOGLEVEL, 0);

var logger = tracer.colorConsole(
	{
		format:     "{{timestamp}} <{{file}}:{{line}}> {{message}}",
		dateformat: "HH:MM:ss.L",
		level:      LOG_LEVELS[LOG_LEVEL],
		filters:    {
			log:   colors.white,
			trace: colors.magenta,
			debug: colors.blue,
			info:  colors.green,
			warn:  colors.yellow,
			error: [colors.red, colors.bold]
		}
	});

tracer.setLevel(LOG_LEVELS[LOG_LEVEL]);

module.exports = logger;