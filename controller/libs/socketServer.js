var http           = require('http');
var socketIo       = require('socket.io');
var socketIoClient = require('socket.io-client');

var config = require('../config');
var logger = require('./logging');

function _objectHasAuthKey(obj, key) {
	if (obj[key] !== null && obj[key] !== undefined &&
		typeof obj[key] === 'string' && obj[key].length === 32) {
		return true;
	} else {
		return false;
	}
}

module.exports = function (app, callback) {
	"use strict";

	function _verifyServerSocketConnection(serverInfo, callback) {
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

	app.server = http.createServer(function (req, res) {
		res.writeHead(200, {
			'Content-Type': 'application/json',
		});
		res.end();
	});

	app.server.listen(config.SERVER_PORT, function () {
		logger.info('socket server => http://' + config.SERVER_IP + ':' + config.SERVER_PORT);
	});

	process.on('SIGTERM', function () {
		logger.warn("shutting down server...");
		app.server.close();
		logger.warn("server shutdown!");
		process.exit(1);
	});

	app.socketClientIo = socketIo(app.server);

	app.socketClientIo.on('connection', function (socket) {
		// logger.info('socketClientIo:' + 'connection:' + 'socketid:' + socket.id);

		app.clients.push(socket);

		socket.on('setConnection', function (serverInfo, cbfn_setConn) {
			_verifyServerSocketConnection(serverInfo, function (err) {
				if (err) {
					logger.error(err);
					socket.disconnect();
					socket.close();
					cbfn_setConn(err, null);
				} else {
					if (app.Auth[serverInfo.Identifier].socketID !== null) {
						logger.warn('remove old socket for Auth');
						if (app.clients.length > 0) {
							app.clients.forEach(function (otherSocket) {
								if (otherSocket.id === app.Auth[serverInfo.Identifier].socketID) {
									logger.warn('duplicate server info: disconnecting');
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
								logger.error('getJoinQueueDataObj _verifyServerSocketConnection end err', err);
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
								logger.error('submitExperimentRequest _verifyServerSocketConnection end err', err);
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

