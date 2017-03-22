import config from './lib/config';
import Dispatcher from './lib/dispatcher';
import {Dashboard} from './lib/dashboard';
import logger from './lib/logging'

let dispatcher = new Dispatcher(config);
dispatcher.prepare((err, queues) => {
    if (err) {
        logger.error(err);
    } else {
        dispatcher.run();

        // let dashboard = new Dashboard(config, logger, 20, 12, dispatcher);
        // dashboard.run();
    }
});



