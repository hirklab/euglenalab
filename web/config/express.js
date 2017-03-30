import express from 'express';
import logger from 'morgan';
import bodyParser from 'body-parser';
import cookieParser from 'cookie-parser';
import compress from 'compression';
import methodOverride from 'method-override';
import cors from 'cors';
import httpStatus from 'http-status';
import expressWinston from 'express-winston';
import expressValidation from 'express-validation';
import helmet from 'helmet';

import config from './env';
import winstonInstance from './winston';
import passport from './passport';

import routes from '../server/routes/index.route';
import APIError from '../server/helpers/api.error';

const app = express();

if (config.logging.morgan) {
  app.use(logger('dev'));
}

app.use(cookieParser());

// parse body params and attach them to req.body
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({
  extended: true
}));

app.use(methodOverride());
app.use(passport.initialize());

app.use(compress());

// secure apps by setting various HTTP headers
app.use(helmet());

// enable CORS - Cross Origin Resource Sharing
app.use(cors());

// enable detailed API logging in dev env
if (config.logging.winston) {
  expressWinston.requestWhitelist.push('body');
  expressWinston.responseWhitelist.push('body');

  app.use(expressWinston.logger({
    winstonInstance,
    meta: true, // optional: log meta data about request (defaults to true)
    msg: 'HTTP {{req.method}} {{req.url}} {{res.statusCode}} {{res.responseTime}}ms',
    colorStatus: true // Color the status code (default green, 3XX cyan, 4XX yellow, 5XX red).
  }));
}

// mount all routes on /api path
app.use('/', routes);

// if error is not an instanceOf APIError, convert it.
app.use((err, req, res, next) => {
  if (err instanceof expressValidation.ValidationError) {
    // validation error contains errors which is an array of error each containing message[]
    const unifiedErrorMessage = err.errors.map(error => error.messages.join('. ')).join(' and ');
    const error = new APIError(unifiedErrorMessage, err.status, true);
    return next(error);
  } else if (!(err instanceof APIError)) {
    const apiError = new APIError(err.message, err.status, true);
    return next(apiError);
  } else {
    return next(err);
  }
});

// catch 404 and forward to error handler
app.use((req, res, next) => {
  const err = new APIError('route not found', httpStatus.NOT_FOUND);
  return next(err);
});

// log error in winston when not using tests
if (config.logging.winston) {
  app.use(expressWinston.errorLogger({
    winstonInstance
  }));
}

// error handler, send stacktrace only during development
app.use((err, req, res, next) => // eslint-disable-line no-unused-vars
  res.status(err.status).json({
    code: err.status,
    message: err.message,
    status: httpStatus[err.status],
    // stack: config.logging.stacktrace ? err.stack : {}
  })
);

export default app;