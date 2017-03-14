import socketIO from 'socket.io';
import {logger} from './logging';
import {authorize} from './auth';
import {submitExperiment} from './experiment';

function initializeSocketServer(server, clients, db, config, callback) {
  let sockets = {};

  let io = socketIO(server);

  server.listen(config.port, (err) => {
    if (err) {
      logger.error(err);
      return callback(err);
    }

    logger.debug("websocket server is ready");

    logger.info("dispatcher is listening on " + config.port);

    io.on('connection', (socket) => {
      logger.debug(`[${socket.id}] socket connecting...`);

      clients.push(socket);

      socket.on('setConnection', (auth, callback) => {
        logger.debug(`[${socket.id}] socket authorizing...`);

        authorize(auth, config, (err) => {

          if (err) {
            logger.error(err);

            socket.disconnect();
            // socket.close();

            return callback(err, null);
          } else {

            sockets[auth.Identifier] = sockets[auth.Identifier] || {};
            let ref = socket.id;

            if (!(ref in sockets[auth.Identifier])) {
              sockets[auth.Identifier][socket.id] = socket;
            }

            logger.info(`[${socket.id}] socket connected`);

            auth.Name = config.authenticClients[auth.Identifier].Name;
            auth.arePassKeysOpen = config.authenticClients[auth.Identifier].arePassKeysOpen;
            auth.PassKeys = config.authenticClients[auth.Identifier].PassKeys;

            callback(null, auth);

            socket.on('getJoinQueueDataObj', (auth, callback) => {
              logger.debug(`[${socket.id}] got experiment queue`);

              return callback(null, db.getExperimentJoinQueueDefaults(config));
            });

            socket.on('getExp', (auth, experimentId, callback) => {
              logger.debug(`[${socket.id}] sending experiment status`);

              return callback(new Error('not implemented'));
            });

            socket.on('/bpu/runExp/#ledsSet', (lightData) => {
              if (app.bpuLedsSetMatch[lightData.sessionID]) {
                logger.debug(`[${socket.id}] set LEDs`);

                return app.bpuLedsSetMatch[lightData.sessionID](lightData);
              }
            });

            socket.on('/bpuCont/#submitExperimentRequest', (auth, queue, callback) => {
              logger.debug(`[${socket.id}] submitting new experiment`);

              return submitExperiment(auth, queue, db, callback);
            });

            socket.on('disconnect', () => {
              logger.warn(`[${socket.id}] disconnected`);

              delete sockets[auth.Identifier][socket.id];
            });

            return callback(null, socket.id);
          }
        });
      });

      return socket;
    });
  });

  return {
    sockets: sockets,
    io: io
  };
}

export {initializeSocketServer};


// var setupSocketClientServer=function(callback) {
//     //Create Socket Server
//     var server=require('http').createServer(function(req, res) {
//         app.logger.warn(moduleName+' fn_serverHandler');
//     });
//
//     app.logger.debug('setupSocketClientServer@'+app.initParams.socketClientServerIP+':'+app.initParams.socketClientServerPort);
//
//     console.log('setupSocketClientServer@'+app.initParams.socketClientServerIP+':'+app.initParams.socketClientServerPort);
//
//     server.listen(app.initParams.socketClientServerPort, app.initParams.socketClientServerIP);
//
//     app.socketClientIo=socketIo(server);
//
//     app.socketClientIo.on('connection', function(socket) {
//         app.logger.info('socketClientIo:'+'connection:'+'socketid:'+socket.id);
//
//         console.log('socketClientIo:'+'connection:'+'socketid:'+socket.id);
//
//         app.socketConnections.push(socket);
//
//         socket.on('setConnection', function(serverInfo, cbfn_setConn) {
//             _verifyServerSocketConnection(serverInfo, function(err) {
//                 if(err) {
//                     console.log('setConnection _verifyServerSocketConnection end err', err);
//                     socket.disconnect();
//                     socket.close();
//                     cbfn_setConn(err, null);
//                 } else {
//                     if(app.Auth[serverInfo.Identifier].socketID!==null) {
//                         console.log('remove old socket for Auth');
//                         if(app.socketConnections.length>0) {
//                             app.socketConnections.forEach(function(otherSocket) {
//                                 if(otherSocket.id===app.Auth[serverInfo.Identifier].socketID) {
//                                     console.log('Duplicate server info: Disconnecting');
//                                     otherSocket.disconnect();
//                                 }
//                             });
//                         }
//                     }
//
//                     app.Auth[serverInfo.Identifier].socketID=socket.id;
//                     var retData={};
//                     retData.Identifier=app.Auth[serverInfo.Identifier].Identifier;
//                     retData.Name=app.Auth[serverInfo.Identifier].Name;
//                     retData.arePassKeysOpen=app.Auth[serverInfo.Identifier].arePassKeysOpen;
//                     retData.PassKeys=app.Auth[serverInfo.Identifier].PassKeys;
//
//                     cbfn_setConn(null, retData);
//
//                     //Setup socket funcs
//                     socket.on('getJoinQueueDataObj', function(serverInfo, callback) {
//                         _verifyServerSocketConnection(serverInfo, function(err) {
//                             if(err) {
//                                 console.log('getJoinQueueDataObj _verifyServerSocketConnection end err', err);
//                                 socket.disconnect();
//                                 socket.close();
//                                 socket=null;
//                                 cbfn_setConn(err, null);
//                             } else {
//                                 callback(null, app.db.models.BpuExperiment.getDataObjToJoinQueue());
//                             }
//                         });
//                     });
//                     socket.on(app.mainConfig.socketStrs.bpu_runExpLedsSet, function(lightData) {
//                         if(app.bpuLedsSetMatch[lightData.sessionID]) {
//                             app.bpuLedsSetMatch[lightData.sessionID](lightData);
//                         }
//                     });
//                     socket.on('getExp', function(serverInfo, expId, callbackToClient) {
//                         //pull exp by id
//                         callbackToClient('not implemented', null);
//                     });
//                     socket.on(app.mainConfig.socketStrs.bpuCont_submitExperimentRequest, function(serverInfo, joinQueueDataArray, callbackToClient) {
//                         _verifyServerSocketConnection(serverInfo, function(err) {
//                             if(err) {
//                                 console.log('submitExperimentRequest _verifyServerSocketConnection end err', err);
//                                 socket.disconnect();
//                                 socket.close();
//                                 socket=null;
//                                 cbfn_setConn(err, null);
//                             } else {
//                                 app.submitExperimentRequestHandler(app, serverInfo, joinQueueDataArray, callbackToClient);
//                             }
//                         });
//                     });
//                 }
//             });
//         });
//     });
//     callback(null);
// };

//
// var _verifyServerSocketConnection=function(serverInfo, callback) {
//     var err=null;
//     if(typeof serverInfo==='object') {
//         if(serverInfo.Identifier && typeof serverInfo.Identifier==='string') {
//             if(app.Auth[serverInfo.Identifier] && app.Auth[serverInfo.Identifier].Identifier===serverInfo.Identifier) {
//             } else {err='serverInfo Indentifier is incorrect';}
//         } else {err='serverInfo Identifier DNE';}
//     } else {err='serverInfo is not object';}
//     callback(err);
// };
