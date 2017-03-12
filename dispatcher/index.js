import log4js from 'log4js';

import {config} from './lib/config';
import Dispatcher from './lib/dispatcher';
import {Dashboard} from './lib/dashboard';


let logger = log4js.getLogger(config.name);
logger.setLevel(config.logLevel);

let dispatcher = new Dispatcher(config, logger);
dispatcher.prepare((err, queues) => {
    if (err) {
        logger.error(err);
    } else {
        dispatcher.run();

        // let dashboard = new Dashboard(config, logger, 20, 12, dispatcher);
        // dashboard.run();
    }
});



