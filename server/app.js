'use strict';

//dependencies
var express = require('express'),
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
    csrf = require('csurf'),
    colors = require('colors'),
    tracer = require('tracer'),
    socketIO = require('socket.io'),
    async = require('async'),
    config = require('./config'),
    Controller = require('./libs/controller'),
    UserManager = require('./libs/userManager'),
    myFunctions = require('../shared/myFunctions');

var LOGGER_LEVELS = ['log', 'trace', 'debug', 'info', 'warn', 'error'];

var app = express();

app.tracer = tracer;

app.logger = app.tracer.colorConsole({
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

app.utility = {};
app.utility.sendmail = require('../shared/utils/sendmail');
app.utility.slugify = require('../shared/utils/slugify');
app.utility.workflow = require('../shared/utils/workflow');

app.config = config;

app.server = http.createServer(app);

app.controller = null;
app.userManager = null;

//setup server base path
var parts = __dirname.split('/');
parts.pop();
app.serverBase = '';
parts.forEach(function (part) {
    app.serverBase += '/' + part;
});

app.mainConfig = app.config.mainConfig;

app.db = mongoose.createConnection(config.mongodb.uri);
app.db.on('error', app.logger.error.bind(app.logger, 'db connection error: '));

app.sessionMiddleware = session({
    resave: true,
    saveUninitialized: true,
    secret: config.cryptoKey,
    store: new mongoStore({url: config.mongodb.uri})
});

require('../shared/mongoDb/schema/models')(app, mongoose);

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
    res.locals.user.defaultReturnUrl = req.user && req.user.defaultReturnUrl();
    res.locals.user.username = req.user && req.user.username;

    next();
});

// app.locals.projectName = app.config.projectName;
// app.locals.copyrightYear = new Date().getFullYear();
// app.locals.copyrightName = app.config.companyName;
// app.locals.cacheBreaker = 'br34k-01';

require('./libs/passport')(app, passport);

// require('./routes')(app, passport);

app.use(require('./views/http/index').http500);

app.logger.debug('starting server...');

app.server.listen(app.config.port, function () {

    app.logger.info('server => ' + 'http://localhost:' + app.config.port);

    app.logger.debug('connecting database...');

    app.io = socketIO.listen(app.server, {'pingInterval': 5000, 'pingTimeout': 10000});

    app.db.once('open', function () {
        app.logger.info('database => ' + config.mongodb.uri);

        async.waterfall([
            function (callback) {
                app.userManager = new UserManager(app.config, app.logger, app.io, app.sessionMiddleware, app.db);
                callback(null);
            },
            function (callback) {
                app.controller = new Controller(app.config, app.logger, app.userManager);
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
                app.logger.error(err);
            } else {
                app.logger.info('app initialized');
                app.isInitialized = true;
            }
        });

    });
});

