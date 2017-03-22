import socketIO from 'socket.io';
import _ from 'lodash';
import async from 'async';
import logger from './logging';

import {
  EXPERIMENT_STATUS,
  PROFILERS,
  GROUPS,
  BPU_STATUS,
  ROUTES
} from './constants';

class ClientManager {
  constructor(config, webserver, db, experimentManager, bpuManager) {
    this.config = config;
    this.db = db;
    this.server = webserver.getServer();
    this.experimentManager = experimentManager;
    this.bpuManager = bpuManager;
    this.webClients = [];
  }

  start(callback) {
    this.defineRoutes((err) => {
      if (err) {
        return callback(err);
      } else {
        return callback(null);
      }
    });
  }

  authorize(auth, callback) {
    if (auth === null || !auth.hasOwnProperty('Identifier') || auth.Identifier.length <= 0) {
      return callback('missing auth identity');

    } else {
      let ref = auth.Identifier;

      if (!(ref in this.config.authenticClients)) {
        return callback('incorrect auth');
      } else {
        callback(null);
      }
    }
  }

  createAuthRoute(socket, callback) {

    this.authorize(this.auth, (err) => {

      if (err) {
        logger.error(`[${socket.id}] web client authorization failed`);
        logger.error(err);

        socket.disconnect();
        socket.close();
        socket = null;

        return callback(err);
      } else {
        logger.info(`[${socket.id}] web client authorized`);
        return callback(null);
      }
    });
  }

  defineRoutes(callback) {
    this.io = socketIO(this.server);

    this.io.on(ROUTES.WEBSERVER.CONNECT, (socket) => {
      logger.info(`[${socket.id}] web client connecting...`);

      socket.on(ROUTES.WEBSERVER.AUTHORIZE, (auth, cb) => {
        logger.debug(`[${socket.id}] web client authorizing...`);

        this.auth = auth;

        this.createAuthRoute(socket, (err) => {
          if (err) {
            logger.error(err);

            return callback(err, null);
          } else {
            this.checkReconnection();
            this.addClient(socket);

            this.auth.Name = this.config.authenticClients[auth.Identifier].Name;
            this.auth.arePassKeysOpen = this.config.authenticClients[auth.Identifier].arePassKeysOpen;
            this.auth.PassKeys = this.config.authenticClients[auth.Identifier].PassKeys;

            cb(null, _.clone(this.auth));
          }
        });
      });

      socket.on(ROUTES.WEBSERVER.GET_QUEUE, (auth, cb) => {
        this.createAuthRoute(socket, (err) => {
          if (err) {
            logger.error(err);

            return cb(err, null);
          } else {
            logger.debug(`[${socket.id}] got experiment queue`);

            return cb(null, this.db.getExperimentJoinQueueDefaults(this.config));
          }
        });
      });

      socket.on(ROUTES.WEBSERVER.GET_EXPERIMENT, (auth, experimentId, cb) => {
        this.createAuthRoute(socket, (err) => {
          if (err) {
            logger.error(err);

            return cb(err, null);
          } else {
            logger.debug(`[${socket.id}] sending experiment status`);

            return cb(new Error('not implemented'));
          }
        });
      });

      socket.on(ROUTES.WEBSERVER.SET_LEDS, (lightData) => {
        this.createAuthRoute(socket, (err) => {
          if (err) {
            logger.error(err);

            return callback(err, null);
          } else {
            //todo
            // if (app.bpuLedsSetMatch[lightData.sessionID]) {
            //   logger.debug(`[${socket.id}] set LEDs`);
            //
            //   return app.bpuLedsSetMatch[lightData.sessionID](lightData);
            // }
          }
        });
      });

      socket.on(ROUTES.WEBSERVER.SUBMIT_EXPERIMENT, (auth, queue, cb) => {
        // this.createAuthRoute(socket, (err) => {
        //   if (err) {
        //     logger.error(err);
        //     return cb(err, null);
        //   } else {
            logger.debug(`[${socket.id}] submitting new experiment`);
            return this.experimentManager.submitExperiment(auth, queue, this.db, cb);
          // }
        // });
      });

      socket.on(ROUTES.WEBSERVER.DISCONNECT, () => {
        logger.warn(`[${socket.id}] disconnected`);

        _.remove(this.webClients, {
          id: socket.id
        });

        // return callback(null);
      });
    });

    return callback(null);
  }

  checkReconnection() {
    // remove duplicate node - only one client for each identifier
    if (this.config.authenticClients[this.auth.Identifier].socketID !== null) {
      if (this.webClients.length > 0) {
        this.webClients.forEach((client) => {
          if (client.id === this.config.authenticClients[this.auth.Identifier].socketID) {
            client.disconnect();
          }
        });
      }
    }
  }

  addClient(socket) {
    this.webClients.push(socket);

    this.config.authenticClients[this.auth.Identifier].socketID = socket.id;

    logger.info(`[${socket.id}] web client connected`);
  }

  sync(callback) {
    if (this.webClients.length > 0) {

      let queues = this.experimentManager.getRawQueues();
      let bpuDocs = this.bpuManager.getRawBPUs();

      this.webClients.forEach((client) => {
        if (client.connected) {
          logger.info(`updating connected client ${client.id}...`);
          client.emit(ROUTES.WEBSERVER.GET_STATUS, bpuDocs, queues, this.experimentManager.getQueueTimes(), callback);
        }
      });
    }

    return callback(null);
  }

  getUserConfirmation(session, callback) {
    logger.info('asking user consent for live experiment...');
    async.some(this.webClients, (client, cb) => {
      if (client.connected) {
        client.emit('activateLiveUser', session, this.config.userConfirmationTimeout, (result) => {
          logger.info('response from client for confirmation');
          logger.info(result);
          if (result.err || !result.didConfirm) {
            return cb(null, false, client);
          } else {
            return cb(null, true, client);
          }
        });
      }
    }, (err, confirmed, client) => {
      return callback(confirmed, client);
    });
  }

  startExperiment(client, session, callback) {
    client.emit('sendUserToLiveLab', session, (result) => {
      if (result.err) {
        logger.error(err);
        return callback(false);
      } else {
        return callback(true);
      }
    });
  }
}

export default ClientManager;
