'use strict';

//dependencies
var express          = require('express'),
    expressValidator = require('express-validator'),
    cookieParser     = require('cookie-parser'),
    bodyParser       = require('body-parser'),
    session          = require('express-session'),
    mongoStore       = require('connect-mongo')(session),
    http             = require('http'),
    path             = require('path'),
    passport         = require('passport'),
    jwt              = require('jsonwebtoken'),
    mongoose         = require('mongoose'),
    helmet           = require('helmet'),
    fs               = require('fs'),
    csrf             = require('csurf'),
    colors           = require('colors'),
    tracer           = require('tracer'),
    socketIO         = require('socket.io'),
    async            = require('async'),

    config           = require('./libs/config'),
    logger           = require('./libs/logging'),
    Controller       = require('./libs/controller'),
    UserManager      = require('./libs/userManager');

// todo get rid of these functions
// myFunctions      = require('../shared/myFunctions');

var app = express();

//setup server base path
var parts = __dirname.split('/');
parts.pop();
app.serverBase = '';
parts.forEach(function (part) {
	app.serverBase += '/' + part;
});

// todo get rid of these functions
// app.myFunctions = myFunctions;

// todo get rid of these functions
app.utility          = {};
app.utility.sendmail = require('../shared/utils/sendmail');
app.utility.slugify  = require('../shared/utils/slugify');
app.utility.workflow = require('../shared/utils/workflow');

app.config = config;

app.server = http.createServer(app);

app.controller  = null;
app.userManager = null;

// todo get rid of this config
app.mainConfig = app.config.mainConfig;

mongoose.Promise = global.Promise;
app.db           = mongoose.createConnection(config.mongodb.uri);
app.db.on('error', logger.error.bind(logger, 'db connection error: '));

app.sessionMiddleware = session({
	resave:            true,
	saveUninitialized: true,
	secret:            config.cryptoKey,
	store:             new mongoStore({url: config.mongodb.uri})
});

// requires app.db
require('../shared/models/index')(app, mongoose);

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

app.use(app.sessionMiddleware);

app.use(passport.initialize());
app.use(passport.session());

//setup routes for api before csrf middleware
app.use('/api', require('./libs/api'));

// helmet(app);
// app.use(helmet.frameguard('allow-from', 'www.golabz.eu'));
// app.use(helmet.frameguard('allow-from', 'graasp.eu'));
// app.use(helmet.frameguard('allow-from', 'shindig2.epfl.ch'));
// app.use(helmet.frameguard('allow-from', 'gateway.golabz.eu'));

app.use(csrf({cookie: {signed: true}}));

app.use(function (req, res, next) {
	res.setHeader('Access-Control-Allow-Origin', '*');
	res.setHeader('Access-Control-Request-Method', '*');
	res.setHeader('Access-Control-Allow-Methods', 'OPTIONS, GET');
	res.setHeader('Access-Control-Allow-Headers', '*');

	res.cookie('_csrfToken', req.csrfToken());

	res.locals.user = {};
	if (req.user) {
		res.locals.user.username = req.user.username;
	}

	next();
});

// app.locals.projectName = app.config.projectName;
// app.locals.copyrightYear = new Date().getFullYear();
// app.locals.copyrightName = app.config.companyName;
// app.locals.cacheBreaker = 'br34k-01';

require('./libs/passport')(app, passport);

// app.use(require('./views/http/index').http500);

logger.debug('starting server...');

app.server.listen(app.config.port, function () {

	logger.info('server => ' + 'http://localhost:' + app.config.port);

	logger.debug('connecting database...');

	app.io = socketIO.listen(app.server, {'pingInterval': 5000, 'pingTimeout': 10000});

	app.db.once('open', function () {
		logger.info('database => ' + config.mongodb.uri);

		async.waterfall([
			function (callback) {
				app.userManager = new UserManager(app.config, app.io, app.sessionMiddleware, app.db);
				callback(null);
			},
			function (callback) {
				app.controller = new Controller(app.config, app.userManager);
				callback(null);
			},
			function (callback) {
				app.controller.connect(callback);
			},
			function (controller, callback) {
				app.userManager.connect(controller, callback);
			}
		], function (err) {
			if (err) {
				logger.error(err);
			} else {
				logger.info('app initialized');
				app.isInitialized = true;
			}
		});

	});
});

