import socketIO from 'socket.io';
import auth from './auth';

let indexOf = [].indexOf || function (item) {
        for (let i = 0, l = this.length; i < l; i++) {
            if (i in this && this[i] === item) return i;
        }
        return -1;
    };

function initializeSocketServer(server, db, config, logger) {
    logger.info('starting websocket server...');

    let authorize = auth.authorize;
    let sockets = {};

    let socketServer = socketIO.listen(server);

    socketServer.listen(config.port, (err) => {
        if (err) {
            logger.error(err);
            return callback(err);
        }

        logger.info("dispatcher is listening on " + config.port);

        socketServer.on('connection', function (socket) {
            logger.info('socket connecting...');
            logger.info('socket #{socket.id} connecting...');

            socket.on('authorize', function (auth, callback) {
                return authorize(auth, config, function (err) {

                    if (err) {
                        logger.error(err);
                        socket.disconnect();
                        socket.close();
                        return callback(err, null);
                    } else {
                        sockets[auth.identifier] = sockets[auth.identifier] || {};
                        let ref = socket.id;

                        if (indexOf.call(sockets[auth.identifier], ref) >= 0) {
                            sockets[auth.identifier][socket.id] = socket;
                        }

                        logger.info('socket #{socket.id} authenticated');

                        socket.on('getJoinQueueDataObj', function (callback) {
                            //todo
                            return callback(new Error('not implemented'));

                            //return callback(null, db.models.BpuExperiment.getDataObjToJoinQueue());
                        });

                        socket.on('getExp', function (experimentId, callback) {
                            return callback(new Error('not implemented'));
                        });

                        socket.on('/bpu/runExp/#ledsSet', function (lightData) {
                            if (app.bpuLedsSetMatch[lightData.sessionID]) {
                                return app.bpuLedsSetMatch[lightData.sessionID](lightData);
                            }
                        });

                        socket.on('/bpuCont/#submitExperimentRequest', function (queue, callback) {
                            return submitExperiment(app, config, queue, callback);
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
        socketServer: socketServer
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