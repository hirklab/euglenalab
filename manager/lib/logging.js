import env from 'dotenv';
import log4js from 'log4js';

env.config();

const LOG_LEVEL = process.env.LOG_LEVEL;
const COMPONENT_NAME = process.env.COMPONENT_NAME;

const logger = log4js.getLogger(COMPONENT_NAME);
logger.setLevel(LOG_LEVEL);

export default logger;