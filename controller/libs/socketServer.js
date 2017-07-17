var http = require('http');
var socketIo       = require('socket.io');
var socketIoClient = require('socket.io-client');

var config = require('../config');

function _objectHasAuthKey(obj, key) {
	if (obj[key] !== null && obj[key] !== undefined &&
		typeof obj[key] === 'string' && obj[key].length === 32) {
		return true;
	} else {
		return false;
	}
}

function _verifyServerSocketConnection (serverInfo, callback) {
	var err = null;
	if (typeof serverInfo === 'object') {
		if (serverInfo.Identifier && typeof serverInfo.Identifier === 'string') {
			if (app.Auth[serverInfo.Identifier] && app.Auth[serverInfo.Identifier].Identifier === serverInfo.Identifier) {
			} else {
				err = 'serverInfo Identifier is incorrect';
			}
		} else {
			err = 'serverInfo Identifier DNE';
		}
	} else {
		err = 'serverInfo is not object';
	}
	callback(err);
}

module.exports = function (app, callback) {
	"use strict";

	var server = http.createServer(function(req,res){
	});

	server.on('listening',function(){
		app.logger.info('socket server => http://' + config.SERVER_IP + ':' + config.SERVER_PORT);
	});

	server.listen(config.SERVER_IP, config.SERVER_PORT);

	app.socketClientIo = socketIo(server);

	app.socketClientIo.on('connection', function (socket) {
		app.logger.info('socketClientIo:' + 'connection:' + 'socketid:' + socket.id);

		app.socketConnections.push(socket);

		socket.on('setConnection', function (serverInfo, cbfn_setConn) {
			_verifyServerSocketConnection(serverInfo, function (err) {
				if (err) {
					app.logger.error(err);
					socket.disconnect();
					socket.close();
					cbfn_setConn(err, null);
				} else {
					if (app.Auth[serverInfo.Identifier].socketID !== null) {
						app.logger.warn('remove old socket for Auth');
						if (app.socketConnections.length > 0) {
							app.socketConnections.forEach(function (otherSocket) {
								if (otherSocket.id === app.Auth[serverInfo.Identifier].socketID) {
									app.logger.warn('duplicate server info: disconnecting');
									otherSocket.disconnect();
								}
							});
						}
					}

					app.Auth[serverInfo.Identifier].socketID = socket.id;
					var retData                              = {};
					retData.Identifier                       = app.Auth[serverInfo.Identifier].Identifier;
					retData.Name                             = app.Auth[serverInfo.Identifier].Name;
					retData.arePassKeysOpen                  = app.Auth[serverInfo.Identifier].arePassKeysOpen;
					retData.PassKeys                         = app.Auth[serverInfo.Identifier].PassKeys;

					cbfn_setConn(null, retData);

					socket.on('getJoinQueueDataObj', function (serverInfo, cb) {
						_verifyServerSocketConnection(serverInfo, function (err) {
							if (err) {
								app.logger.error('getJoinQueueDataObj _verifyServerSocketConnection end err', err);
								socket.disconnect();
								socket.close();
								socket = null;
								cbfn_setConn(err, null);
							} else {
								cb(null, app.db.models.BpuExperiment.getDataObjToJoinQueue());
							}
						});
					});

					socket.on(app.mainConfig.socketStrs.bpu_runExpLedsSet, function (lightData) {
						if (app.bpuLedsSetMatch[lightData.sessionID]) {
							// console.log(lightData);
							app.bpuLedsSetMatch[lightData.sessionID](lightData);
						}
					});

					socket.on('getExp', function (serverInfo, expId, cb) {
						cb('not implemented', null);
					});

					socket.on(app.mainConfig.socketStrs.bpuCont_submitExperimentRequest, function (serverInfo, joinQueueDataArray, cb) {
						_verifyServerSocketConnection(serverInfo, function (err) {
							if (err) {
								app.logger.error('submitExperimentRequest _verifyServerSocketConnection end err', err);
								socket.disconnect();
								socket.close();
								socket = null;
								cbfn_setConn(err, null);
							} else {
								app.submitExperimentRequestHandler(app, serverInfo, joinQueueDataArray, cb);
							}
						});
					});
				}
			});
		});
	});

	callback(null);
};

