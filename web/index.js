import mongoose from 'mongoose';
import util from 'util';
import Promise from 'bluebird'; // eslint-disable-line no-global-assign

import config from './config/env';
import app from './config/express';
import database from './config/database';

const debug = require('debug')('web:index');

// module.parent check is required to support mocha watch
// src: https://github.com/mochajs/mocha/issues/1912
if (!module.parent) {
	// listen on port config.port
	app.listen(config.server.port, () => {
		debug(`server started on port ${config.server.port} (${config.env})`);
	});
}

export default app;