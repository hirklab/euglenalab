var mainConfig = require('../shared/mainConfig.js');
var constants = require('./constants');

// all durations in milliseconds
module.exports = {
    LOG_LEVEL: constants.LOG_LEVELS[2],
    DB_URL: mainConfig.adminFlags.getMongoUri(),
    SERVER_IP: 'localhost',
    SERVER_PORT: mainConfig.adminFlags.getControllerPort(),
    LOOP_INTERVAL: 1000,
    PROFILING: true,
    PROFILING_INTERVAL: 30 * 60 * 1000,
    USER_CONFIRMATION_TIMEOUT: 15 * 1000,
    MICROSCOPE_INACTIVE_COUNT: 30,
    INACTIVE_EXPERIMENT_TIMEOUT: 1 * 24 * 60 * 60 * 1000,
    CALLBACK_TIMEOUT: 1500,
    isDevelopment: mainConfig.adminFlags.isDevelopment()
};
