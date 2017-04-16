import mongoose from 'mongoose';
import util from 'util';
import Promise from 'bluebird'; // eslint-disable-line no-global-assign

import config from './env';

const debug = require('debug')('config:database');

mongoose.Promise = Promise;

mongoose.connect(config.database.url, {
  server: {
    socketOptions: {
      keepAlive: 1
    }
  }
});

mongoose.connection.on('error', () => {
  throw new Error(`unable to connect to database: ${config.database.url}`);
});

// print mongoose logs in dev env
if (config.database.debug) {
  mongoose.set('debug', (collectionName, method, query, doc) => {
    debug(`${collectionName}.${method}`, util.inspect(query, false, 20), doc);
  });
}

export default mongoose;
