var mainConfig = require('../shared/mainConfig.js');
var constants  = require('./constants');

// all durations in milliseconds
module.exports = {
	LOG_LEVEL:                   constants.LOG_LEVELS[2],
	DB_URL:                      mainConfig.adminFlags.getMongoUri(),
	SERVER_IP:                   'localhost',
	SERVER_PORT:                 mainConfig.adminFlags.getControllerPort(),
	PROFILING:                   true,
	PROFILING_INTERVAL:          30 * 60 * 1000,
	LOOP_INTERVAL:               1000,
	USER_CONFIRMATION_TIMEOUT:   15 * 1000,
	INACTIVE_EXPERIMENT_TIMEOUT: 1 * 24 * 60 * 60 * 1000,
	CALLBACK_TIMEOUT:            1500,
	MICROSCOPE_INACTIVE_COUNT:   5,

	AUTH: {
		C422691AA38F9A86EC02CB7B55D5F542: {
			Name:            'radiantllama',
			identifier:      'C422691AA38F9A86EC02CB7B55D5F542',
			arePassKeysOpen: false,
			PassKeys:        ['R-OpYLbT6Kk-GXyEmX1SOOOHDw157mJc'],
			socketID:        null,
			serverInfo:      null
		},
		b3cagcde2684ebd2cba325555ec2703b: {
			Name:            'InternalWeb1',
			identifier:      'b3cagcde2684ebd2cba325555ec2703b',
			arePassKeysOpen: true,
			PassKeys:        [],
			socketID:        null,
			serverInfo:      null
		},
		b3cagcde2684ebd2cba325555ec2703c: {
			Name:            'InternalWeb2',
			identifier:      'b3cagcde2684ebd2cba325555ec2703c',
			arePassKeysOpen: true,
			PassKeys:        [],
			socketID:        null,
			serverInfo:      null
		}
	}
};
