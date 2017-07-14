'use strict';
//dependencies
var config = require('./config'),
	express = require('express'),
	expressValidator = require('express-validator'),
	cookieParser = require('cookie-parser'),
	bodyParser = require('body-parser'),
	session = require('express-session'),
	mongoStore = require('connect-mongo')(session),
	http = require('http'),
	path = require('path'),
	passport = require('passport'),
	jwt = require('jsonwebtoken'),
	mongoose = require('mongoose'),
	helmet = require('helmet'),
	fs = require('fs'),
	_ = require('lodash'),
	csrf = require('csurf'),
	colors = require('colors'),
	tracer = require('tracer'),
	socketClient = require('socket.io-client'),
	async = require('async'),
	myFunctions = require('../shared/myFunctions.js');

var LOGGER_LEVELS = ['log', 'trace', 'debug', 'info', 'warn', 'error'];

//create express app
var app = express();

app.tracer = tracer;

app.logger = app.tracer.colorConsole(
	{
		format: "{{timestamp}} <{{file}}:{{line}}> {{message}}",
		dateformat: "HH:MM:ss.L",
		level: LOGGER_LEVELS[0],
		filters: {
			log: colors.white,
			trace: colors.magenta,
			debug: colors.blue,
			info: colors.green,
			warn: colors.yellow,
			error: [colors.red, colors.bold]
		}
	});
app.tracer.setLevel(LOGGER_LEVELS[2]);

app.myFunctions = myFunctions;

//keep reference to config
app.config = config;

//setup the web server
app.server = http.createServer(app);

//setup server base path
var parts = __dirname.split('/');
parts.pop();
app.serverBase = '';
parts.forEach(function (part) {
	app.serverBase += '/' + part;
});

//setup mongoose
app.db = mongoose.createConnection(config.mongodb.uri);
app.db.on('error', console.error.bind(console, 'mongoose connection error: '));

app.bpuLogLevel = LOGGER_LEVELS[2];
app.bpuExpLogLevel = LOGGER_LEVELS[2];
app.userLogLevel = LOGGER_LEVELS[2];
app.listExpLogLevel = LOGGER_LEVELS[2];

var sessionMiddleware = session({
	resave: true,
	saveUninitialized: true,
	secret: config.cryptoKey,
	store: new mongoStore({url: config.mongodb.uri})
});

//config data models
require('../shared/mongoDb/schema/models')(app, mongoose);

//settings
app.disable('x-powered-by');

app.set('port', config.port);

app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'jade');

//middleware
app.use(require('morgan')('dev'));
app.use(require('compression')());
app.use(require('serve-static')(path.join(__dirname, 'public')));
app.use(require('method-override')());

app.use(bodyParser.json());
app.use(bodyParser.urlencoded({extended: true}));

app.use(cookieParser(config.cryptoKey));

app.use(sessionMiddleware);

app.use(passport.initialize());
app.use(passport.session());

//setup routes for api before csrf middleware
require('./api')(app, passport);

app.use(csrf({cookie: {signed: true}}));

helmet(app);
app.use(helmet.frameguard('allow-from', 'www.golabz.eu'));
app.use(helmet.frameguard('allow-from', 'graasp.eu'));
app.use(helmet.frameguard('allow-from', 'shindig2.epfl.ch'));
app.use(helmet.frameguard('allow-from', 'gateway.golabz.eu'));  //browser console said not recognized directive and will be ignored

//response locals
app.use(function (req, res, next) {
	res.setHeader('Access-Control-Allow-Origin', '*');
	res.setHeader('Access-Control-Request-Method', '*');
	res.setHeader('Access-Control-Allow-Methods', 'OPTIONS, GET');
	res.setHeader('Access-Control-Allow-Headers', '*');

	res.cookie('_csrfToken', req.csrfToken());
	res.locals.user = {};
	res.locals.user.defaultReturnUrl = req.user && req.user.defaultReturnUrl();
	res.locals.user.username = req.user && req.user.username;
	next();
});

//global locals
app.locals.projectName = app.config.projectName;
app.locals.copyrightYear = new Date().getFullYear();
app.locals.copyrightName = app.config.companyName;
app.locals.cacheBreaker = 'br34k-01';

//setup passport
require('./passport')(app, passport);

//setup routes
require('./routes')(app, passport);

//custom (friendly) error handler
app.use(require('./views/http/index').http500);

//setup utilities
app.utility = {};
app.utility.sendmail = require('./util/sendmail');
app.utility.slugify = require('./util/slugify');
app.utility.workflow = require('./util/workflow');

//listen up
app.logger.debug('starting server...');

app.server.listen(app.config.port, function () {
	app.mainConfig = app.config.mainConfig;
	app.bpuControllerSocket = null;
	
	app.logger.info('server => ' + 'http://localhost:'+ app.config.port);

	app.logger.debug('connecting database...');

	app.db.once('open', function () {
		app.logger.info('database => ' + config.mongodb.uri);

		//My Things
		app.isResortingQueue = false;
		app.isSoapChecking = false;

		app.randomIntFromInterval = function (min, max) {
			return Math.floor(Math.random() * (max - min + 1) + min);
		};

		var connectController = function (callback) {
			app.bpuAuthObject = null;

			var serverInfo = {
				Identifier: app.config.myWebServerIdentifier,
				name: app.config.myWebServerName,
				socketClientServerIP: 'localhost',
				socketClientServerPort: app.config.myControllerPort
			};

			var addr = 'http://' + serverInfo.socketClientServerIP + ':' + serverInfo.socketClientServerPort;
			app.logger.debug('connecting controller...');

			app.bpuControllerSocket = socketClient(addr, {multiplex: false, reconnection: true});

			app.bpuControllerSocket.on('disconnect', function () {
				app.logger.warn('controller disconnected');
			});

			app.bpuControllerSocket.on('connect', function () {
				app.logger.info('controller => ' + addr);

				app.bpuControllerSocket.emit('setConnection', serverInfo, function (err, bpuAuthObject) {
					if (err) {
						app.logger.error('controller authentication failed: ' + err);
					} else {
						app.logger.info('controller authenticated: ' + bpuAuthObject.Name);
						app.bpuAuthObject = bpuAuthObject;
					}
				});
			});

			//update is joined in user socket connection
			app.bpuControllerSocket.on('update', function (bpuDocs, listExperiment, runningQueueTimesPerBpuName) {
				_compileClientUpdateFromController(bpuDocs, listExperiment, runningQueueTimesPerBpuName);
			});

			//Routes calls to user sockets if found
			app.bpuControllerSocket.on('activateLiveUser', function (session, liveUserConfirmTimeout, callbackToBpuController) {
				var userSocket = app.myFunctions.getSocket(app.io, session.socketID);

				if (userSocket) {
					app.logger.debug('activateLiveUser: sessionID: ' + session.sessionID + " socketID: " + session.socketID);

					userSocket.emit(app.mainConfig.userSocketStrs.user_activateLiveUser, session, liveUserConfirmTimeout, function (resObj) {
						//app.logger.info('activateLiveUser', session.sessionID, session.socketID, resObj.didConfirm, resObj.err);
						app.logger.debug('activeLiveUser Reply: ' + session.sessionID + " socketID: " + session.socketID + ', with: ' + resObj.didConfirm + ' err:' + resObj.err);
						callbackToBpuController(resObj);
					});
				} else {
					app.logger.error("activateLiveUser: Couldn't find socketId");
					callbackToBpuController({err: 'could not find socketID', didConfirm: false});
				}
			});

			app.bpuControllerSocket.on('sendUserToLiveLab', function (session, callbackToBpuController) {
				var userSocket = app.myFunctions.getSocket(app.io, session.socketID);

				if (userSocket) {
					app.logger.debug('sendUserToLiveLab sessionID: ' + session.sessionID + " socketID: " + session.socketID);
					userSocket.emit(app.mainConfig.userSocketStrs.user_sendUserToLiveLab, function (resObj) {
						//app.logger.info('sendUserToLiveLab', session.sessionID, session.socketID, resObj.didConfirm, resObj.err);
						app.logger.debug('sendUserToLiveLab Reply: ' + session.sessionID + " socketID: " + session.socketID + ', err:' + resObj.err);
						callbackToBpuController(resObj);
					});
				} else {
					callbackToBpuController({err: 'could not find socketID', didConfirm: false});
				}
			});

			callback(null);
		};

		var connectUsers = function (callback) {
			app.logger.debug('starting socket server...');

			app.io = require('socket.io')
				.listen(app.server);

			app.io.sockets
				.use(function (socket, next) {
					// Wrap the express middleware
					sessionMiddleware(socket.request, {}, next);
				});

			//Socket
			app.io.sockets.on('connection', function (socket) {
				app.logger.info('session => ' + socket.request.sessionID);
				app.logger.info('user ' + socket.request.session.passport.user + ' @ ' + socket.id + ' connected');

				socket.emit(app.mainConfig.userSocketStrs.user_setConnection, function (sessDocJson) {
					//Update and find session
					var updateObj = {
						lastUpdateTime: new Date().getTime(),
						isVerified: true,
						sessionID: sessDocJson.sessionID,
						socketHandle: sessDocJson.socketHandle,
						socketID: sessDocJson.socketID,
					};

					//app.logger.debug(updateObj);

					//app.db.models.Session.findByIdAndUpdate(sessDocJson._id, updateObj, {new:true}, function(err, sessDoc) {
					app.db.models.Session.findOneAndUpdate({'sessionID': sessDocJson.sessionID}, updateObj, {new: true}, function (err, sessDoc) {
						if (err) {
							socket.emit(app.mainConfig.userSocketStrs.user_serverError, 'Session:' + err);
						} else if (sessDoc === null || sessDoc === undefined) {
							socket.emit(app.mainConfig.userSocketStrs.user_serverError, 'Session:' + 'dne');
						} else {
							var hasLiveExp = false;
							var checkLiveExpId = 'fake';
							if (sessDoc.liveBpuExperiment && sessDoc.liveBpuExperiment.id) {
								checkLiveExpId = sessDoc.liveBpuExperiment.id;
							}
							app.db.models.BpuExperiment.findById(checkLiveExpId, {exp_status: 1}, function (err, expDoc) {
								if (err || expDoc === null || expDoc === undefined) {
								} else {
									if (expDoc.exp_status === 'addingtobpu' || expDoc.exp_status === 'running') {
										hasLiveExp = true;
									}
								}
								if (!hasLiveExp) {
									sessDoc.liveBpuExperiment.id = null;
									sessDoc.save();
								}
								socket.sessionDoc = sessDoc;

								//Allow clients to send experiment requests to bpu controller
								socket.on(app.mainConfig.userSocketStrs.user_submitExperimentRequest, function (joinQueueDataArray, callbackToClient) {
									app.logger.debug("submitting experiment to controller...");

									app.bpuControllerSocket.emit(app.mainConfig.socketStrs.bpuCont_submitExperimentRequest, app.bpuAuthObject, joinQueueDataArray, function (err, resDataArray) {
										app.logger.debug("experiment submitted to controller");
										callbackToClient(err, resDataArray);
									});
								});

								socket.on(app.mainConfig.userSocketStrs.user_ledsSet, function (setLedsData) {
									app.logger.debug("sending data to controller...");
									app.bpuControllerSocket.emit(app.mainConfig.socketStrs.bpu_runExpLedsSet, setLedsData);
								});
							});
						}
					});
				});
			});
		};

		//Series Funcs
		var seriesFuncs = [];
		seriesFuncs.push(connectController);
		seriesFuncs.push(connectUsers);
		//Series Run
		async.waterfall(seriesFuncs, function (err) {
			if (err) {
				app.logger.error(err);
			} else {
				app.logger.info('app initialized');
				app.isInitialized = true;
			}
		});
	});
});

var _compileClientUpdateFromController = function (bpuDocs, listExperiment, runningQueueTimesPerBpuName) {
	var waitTimePerBpuName = {};
	var updatePerSessionID = {};

	var addBpuToSessionID = function (sessID, bpuExp) {
		if (sessID !== null && sessID !== undefined) {
			if (updatePerSessionID[sessID] === null || updatePerSessionID[sessID] === undefined) {
				updatePerSessionID[sessID] = {};
				updatePerSessionID[sessID].bpuExps = [];
				updatePerSessionID[sessID].expTags = [];
			}
			updatePerSessionID[sessID].bpuExps.push(bpuExp);
		}
	};

	var addExpToSessionID = function (sessID, expTag) {
		if (sessID !== null && sessID !== undefined) {
			if (updatePerSessionID[sessID] === null || updatePerSessionID[sessID] === undefined) {
				updatePerSessionID[sessID] = {};
				updatePerSessionID[sessID].bpuExps = [];
				updatePerSessionID[sessID].expTags = [];
			}
			updatePerSessionID[sessID].expTags.push(expTag);
		}

	};

	var bpuGroupsCrossCheckWithUser = function (user, bpuDoc) {
		for (var ind = 0; ind < bpuDoc.allowedGroups.length; ind++) {
			for (var jnd = 0; jnd < user.groups.length; jnd++) {
				if (bpuDoc.allowedGroups[ind] === user.groups[jnd]) return true;
			}
		}
		return false;
	};

	var isLiveActive = function (status) {
		if (status == app.mainConfig.bpuStatusTypes.running ||
			status == app.mainConfig.bpuStatusTypes.pendingRun ||
			status == app.mainConfig.bpuStatusTypes.finalizing ||
			status == app.mainConfig.bpuStatusTypes.reseting) {
			return true;
		}
		return false;
	};

	//Create bpu updates and sort active bpus experiments into session id
	var bpusUpdate = [];
	bpuDocs.forEach(function (bpuDoc) {

		var liveBpuExperimentPart = null;

		if (isLiveActive(bpuDoc.bpuStatus)) {
			liveBpuExperimentPart = {
				username: bpuDoc.liveBpuExperiment.username,
				bc_timeLeft: bpuDoc.liveBpuExperiment.bc_timeLeft,
				group_experimentType: bpuDoc.liveBpuExperiment.group_experimentType,
			};
		}

		var bpuObj = {
			name: bpuDoc.name, index: bpuDoc.index,
			bpuStatus: bpuDoc.bpuStatus,
			bpu_processingTime: bpuDoc.bpu_processingTime,

			liveBpuExperiment: liveBpuExperimentPart,
		};
		//Add to Session Update
		if (bpuObj.liveBpuExperiment) {
			addBpuToSessionID(bpuDoc.liveBpuExperiment.sessionID, JSON.parse(JSON.stringify(bpuObj)));
		}
		bpuObj.allowedGroups = bpuDoc.allowedGroups;                 //should be deleted before going out
		//Add to bpu Update
		bpusUpdate.push(bpuObj);
	});

	//Sort Queue Exps and New Exp By sessionID
	Object.keys(listExperiment).forEach(function (key) {
		if (key[0] !== '_') {
			if (key.search('eug') > -1 || key === 'newExps') {
				listExperiment[key].forEach(function (expTag) {
					if (expTag.session) {
						addExpToSessionID(expTag.session.sessionID, expTag);
					}
				});
			}
		}
	});

	//Connect session ids with sockets
	Object.keys(app.io.sockets.sockets).forEach(function (socketKey) {
		var socketID = socketKey;
		if (socketKey.split('#').length > 0) socketID = socketKey.split('#')[1];

		var socket = app.io.sockets.sockets[socketKey];
		if (socket.sessionDoc) {
			var socketUpdateObj = {
				bpuExps: [],
				queueExpTags: [],
				groupBpus: [],
			};
			if (updatePerSessionID[socket.sessionDoc.sessionID]) {
				if (updatePerSessionID[socket.sessionDoc.sessionID].bpuExps) {
					socketUpdateObj.bpuExps = updatePerSessionID[socket.sessionDoc.sessionID].bpuExps;
				}
				if (updatePerSessionID[socket.sessionDoc.sessionID].expTags) {
					socketUpdateObj.queueExpTags = updatePerSessionID[socket.sessionDoc.sessionID].expTags;
				}
			}
			bpuDocs.forEach(function (bpuDoc) {
				//Check if bpu is in session user groups
				if (bpuGroupsCrossCheckWithUser({groups: socket.sessionDoc.user.groups}, bpuDoc)) {
					var bpuDocJson = JSON.parse(JSON.stringify(bpuDoc));
					if (runningQueueTimesPerBpuName[bpuDoc.name]) {
						bpuDocJson.runningQueueTime = runningQueueTimesPerBpuName[bpuDoc.name];
					} else {
						bpuDocJson.runningQueueTime = 0;
					}
					delete bpuDocJson.allowedGroups;
					socketUpdateObj.groupBpus.push(bpuDocJson);
				}
			});
			socket.emit('/#update', socketUpdateObj);
		}
	});
};
