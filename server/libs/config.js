'use strict';
var env = require('dotenv');
env.config();

// var mainConfig = require('../../shared/mainConfig.js');
var constants = require('./constants');

module.exports = {
	IP:         process.env.IP || 'localhost',
	PORT:       parseInt(process.env.PORT || 5000),
	LOG_LEVEL:  constants.LOG_LEVELS[2],
	DB_URL:     (process.env.DB_URL || 'mongodb://localhost:27017/') + (process.env.DB || 'dev'),
	CRYPTO_KEY: process.env.CRYPTO_KEY,

	PROFILING:                   true,
	PROFILING_INTERVAL:          30 * 60 * 1000,
	LOOP_INTERVAL:               1000,
	USER_CONFIRMATION_TIMEOUT:   15 * 1000,
	INACTIVE_EXPERIMENT_TIMEOUT: 1 * 24 * 60 * 60 * 1000,
	CALLBACK_TIMEOUT:            1500,
	MICROSCOPE_INACTIVE_COUNT:   5,

	companyName: 'Riedel-Kruse Lab',
	projectName: 'Interactive Microbiology Lab',
	systemEmail: 'euglena.hirk@gmail.com',

	requireAccountVerification: false,
	loginAttempts:              {
		forIp:         50,
		forIpAndUser:  7,
		logExpiration: '20m'
	},
	smtp:                       {
		from:        {
			name:    process.env.SMTP_FROM_NAME || module.exports.projectName,
			address: process.env.SMTP_FROM_ADDRESS || module.exports.systemEmail
		},
		credentials: {
			user:     process.env.SMTP_USERNAME || module.exports.systemEmail,
			password: process.env.SMTP_PASSWORD || 'IngmarE350A',
			host:     process.env.SMTP_HOST || 'smtp.gmail.com',
			ssl:      true
		}
	}
};