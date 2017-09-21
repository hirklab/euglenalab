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
  helmet = require('helmet'),
  fs = require('fs'),
  csrf = require('csurf'),
  socketIO = require('socket.io'),
  async = require('async'),

  config = require('./libs/config'),
  logger = require('./libs/logging'),
  Controller = require('./libs/controller');

// todo get rid of these functions
// myFunctions      = require('../shared/myFunctions');

var app = express();

//setup server base path
var parts = __dirname.split('/');
parts.pop();
app.webserverBase = '';
parts.forEach(function(part) {
  app.webserverBase += '/' + part;
});

app.config = config;

app.webserver = http.createServer(app);

app.controller = null;

app.sessionMiddleware = session({
  resave: true,
  saveUninitialized: true,
  secret: config.CRYPTO_KEY,
  store: new mongoStore({
    url: config.DB_URL
  })
});

app.disable('x-powered-by');
app.set('port', config.PORT);
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'jade');

//middleware
app.use(require('morgan')('dev'));
app.use(require('compression')());
app.use(require('serve-static')(path.join(__dirname, 'public')));
app.use(require('method-override')());

app.use(bodyParser.json());
app.use(bodyParser.urlencoded({
  extended: true
}));

app.use(cookieParser(config.CRYPTO_KEY));

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

app.use(csrf({
  cookie: {
    signed: true
  }
}));

app.use(function(req, res, next) {
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



// app.use(require('./views/http/index').http500);

logger.debug('starting server...');

var gracefulShutdown = function() {
  if (app.controller) {
    logger.info('shutting down controller...');

    // app.scheduler.stop(function () {
    process.exit(0);
    // });
  } else {
    process.exit(0);
  }
};

process.on('SIGTERM', gracefulShutdown);
process.on('SIGINT', gracefulShutdown);

async.waterfall([
  function(callback) {
    require('./libs/database')(app, callback);
  },
  function(db, callback) {
    app.db = db;

    // app.scheduler = new Scheduler(app);
    // app.scheduler.initialize(function () {
    //  logger.debug('main scheduler ready');
    // });

    require('./libs/passport')(app, passport);

    app.webserver.listen(config.PORT, function() {

      logger.info('server => ' + 'http://localhost:' + config.PORT);

      logger.debug('connecting database...');

      app.io = socketIO.listen(app.webserver, {
        'pingInterval': 4000,
        'pingTimeout': 8000
      });

      callback(null);
    });
  },
  function(callback) {
    logger.info('database => ' + config.DB_URL);

    app.controller = new Controller(config, app);
    app.controller.connect(callback);
  },
  function(callback) {
    app.controller.loop();
    callback(null);
  }
], function(err) {
  if (err) {
    logger.error(err);
  } else {
    logger.info('app initialized');
    app.isInitialized = true;
  }
});