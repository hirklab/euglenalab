import socketIO from 'socket.io';
import _ from 'lodash';
import {logger} from './logging';
import {authorize} from './auth';
import {submitExperiment} from './experiment';
import {EXPERIMENT_STATUS, PROFILERS, GROUPS, BPU_STATUS, ROUTES} from './constants';

function initializeSocketServer(server, webClients, db, config, callback) {
  // let sockets = {};
  let io = socketIO(server);

  logger.info("dispatcher is listening on " + config.port);

  io.on(ROUTES.WEBSERVER.CONNECT, (socket) => {
    logger.debug(`[${socket.id}] web client connecting...`);

    socket.on(ROUTES.WEBSERVER.AUTHORIZE, (auth, callback) => {
      logger.debug(`[${socket.id}] web client authorizing...`);

      authorize(auth, config, (err) => {

        if (err) {
          logger.error(err);

          socket.disconnect();
          socket.close();
          socket = null;

          return callback(err, null);
        } else {

          // remove duplicate node - only one client for each identifier
          if (config.authenticClients[auth.Identifier].socketID !== null) {
            if (webClients.length > 0) {
              webClients.forEach((client) => {
                if (client.id === config.authenticClients[auth.Identifier].socketID) {
                  client.disconnect();
                }
              });
            }
          }

          webClients.push(socket);

          config.authenticClients[auth.Identifier].socketID = socket.id;

          // sockets[auth.Identifier] = sockets[auth.Identifier] || {};
          //
          // if (!(socket.id in sockets[auth.Identifier])) {
          //   sockets[auth.Identifier][socket.id] = socket;
          // }

          logger.info(`[${socket.id}] web client connected`);

          auth.Name = config.authenticClients[auth.Identifier].Name;
          auth.arePassKeysOpen = config.authenticClients[auth.Identifier].arePassKeysOpen;
          auth.PassKeys = config.authenticClients[auth.Identifier].PassKeys;

          callback(null, _.clone(auth));

          socket.on(ROUTES.WEBSERVER.GET_QUEUE, (auth, callback) => {
            authorize(auth, config, (err) => {

              if (err) {
                logger.error(err);

                socket.disconnect();
                socket.close();
                socket = null;

                return callback(err, null);
              } else {

                logger.debug(`[${socket.id}] got experiment queue`);

                return callback(null, db.getExperimentJoinQueueDefaults(config));
              }
            });
          });

          socket.on(ROUTES.WEBSERVER.GET_EXPERIMENT, (auth, experimentId, callback) => {
            logger.debug(`[${socket.id}] sending experiment status`);

            return callback(new Error('not implemented'));
          });

          socket.on(ROUTES.WEBSERVER.SET_LEDS, (lightData) => {
            //todo
            if (app.bpuLedsSetMatch[lightData.sessionID]) {
              logger.debug(`[${socket.id}] set LEDs`);

              return app.bpuLedsSetMatch[lightData.sessionID](lightData);
            }
          });

          socket.on(ROUTES.WEBSERVER.SUBMIT_EXPERIMENT, (auth, queue, callback) => {
            authorize(auth, config, (err) => {

              if (err) {
                logger.error(err);

                socket.disconnect();
                socket.close();
                socket = null;

                return callback(err, null);
              } else {
                logger.debug(`[${socket.id}] submitting new experiment`);

                return submitExperiment(auth, queue, db, callback);
              }
            });
          });

          socket.on(ROUTES.WEBSERVER.DISCONNECT, () => {
            logger.warn(`[${socket.id}] disconnected`);

            delete sockets[auth.Identifier][socket.id];

            _.remove(webClients, {
              id: socket.id
            });
          });

          return callback(null, socket.id);
        }
      });
    });

    return socket;
  });

  return {
    // sockets: sockets,
    io: io
  };
}

export {initializeSocketServer};
