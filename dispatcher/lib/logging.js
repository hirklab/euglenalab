import log4js from 'log4js';

import {config} from './config';


let logger = log4js.getLogger(config.name);
logger.setLevel(config.logLevel);

export {logger};