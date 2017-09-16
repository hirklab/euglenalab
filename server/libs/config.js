'use strict';
var env = require('dotenv');
env.config();

// var mainConfig = require('../../shared/mainConfig.js');
var constants = require('./constants');

module.exports = {
    IP: process.env.IP || 'localhost',
    PORT: parseInt(process.env.PORT || 5000),
    LOG_LEVEL: constants.LOG_LEVELS[2],
    DB_URL: (process.env.DB_URL || 'mongodb://localhost:27017/') + (process.env.DB || 'dev'),
    CRYPTO_KEY: process.env.CRYPTO_KEY,

    PROFILING: true,
    PROFILING_INTERVAL: 30 * 60 * 1000,
    LOOP_INTERVAL: 1000,
    USER_CONFIRMATION_TIMEOUT: 15 * 1000,
    INACTIVE_EXPERIMENT_TIMEOUT: 1 * 24 * 60 * 60 * 1000,
    CALLBACK_TIMEOUT: 1500,
    MICROSCOPE_INACTIVE_COUNT: 5,

    ORG_NAME: 'Riedel-Kruse Lab',
    PROJECT_NAME: 'Interactive Microbiology Lab',
    SYSTEM_EMAIL: 'euglena.hirk@gmail.com',

    REQUIRE_ACCOUNT_VERIFICATION: false,
    LOGIN_ATTEMPTS: {
        forIp: 50,
        forIpAndUser: 7,
        logExpiration: '20m'
    },

    SMTP: {
        FROM: {
            NAME: process.env.SMTP_FROM_NAME || module.exports.PROJECT_NAME,
            EMAIL: process.env.SMTP_FROM_ADDRESS || module.exports.SYSTEM_EMAIL
        },
        CREDENTIALS: {
            EMAIL: process.env.SMTP_USERNAME || module.exports.SYSTEM_EMAIL,
            PASSWORD: process.env.SMTP_PASSWORD || 'IngmarE350A',
            HOST: process.env.SMTP_HOST || 'smtp.gmail.com',
            SSL: true
        }
    }
};