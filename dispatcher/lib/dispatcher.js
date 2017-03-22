import http from 'http';
import express from 'express';
import async from 'async';
import mongoose from 'mongoose';
import _ from 'lodash';
import {
  EXPERIMENT_STATUS,
  PROFILERS,
  GROUPS,
  BPU_STATUS,
  ROUTES
} from './constants';
import Webserver from './webserver';
import Database from './db';
import ClientManager from './clientManager';
import ExperimentManager from './experimentManager';
import BPUManager from './bpuManager';
import logger from './logging'

mongoose.Promise = require('bluebird');


class Dispatcher {
  constructor(config) {
    this.status = 'initializing...';
    this.config = config;
    this.startDate = new Date();
  }

  prepare(callback) {
    logger.info('initializing...');

    async.waterfall([
      (callback) => {
        this._connectDatabase(callback);
      },
      (callback) => {
        this._startWebServer(callback);
      },
      (callback) => {
        this._startExperimentManager(callback);
      },
      (callback) => {
        this._startBPUManager(callback);
      },
      (callback) => {
        this._startClientManager(callback);
      }
    ], (err, result) => {
      callback(err, result);
    });
  }

  run() {
    setInterval(() => {
      this._loop((err) => {
        if (err) {
          logger.error(err);
        }
      });
    }, this.config.loopTimeout);
  }

  _connectDatabase(callback) {
    logger.debug('connecting database...');

    this.db = new Database(this.config);
    this.db.connect((err) => {
      if (err) {
        logger.error(err);
        return callback(err);
      } else {
        logger.info(`database connected`);
        return callback(null);
      }
    });
  }

  _startWebServer(callback) {
    this.server = new Webserver(this.config);

    logger.debug('starting webserver...');
    this.server.start((err) => {
      if (err) {
        logger.error(err);
        return callback(err);
      } else {
        logger.info(`webserver is listening on ${this.config.port}`);
        return callback(null);
      }
    });
  }

  _startExperimentManager(callback) {
    this.experimentManager = new ExperimentManager(this.config, this.db);

    this.experimentManager.getExperimentQueues((err) => {
      if (err) {
        logger.error(err);
        return callback(err);
      } else {
        return callback(null);
      }
    });
  }

  _startBPUManager(callback) {
    this.bpuManager = new BPUManager(this.config, this.db, this.experimentManager);
    return callback(null);
  }

  _startClientManager(callback) {
    this.clientManager = new ClientManager(this.config, this.server, this.db, this.experimentManager, this.bpuManager);

    logger.debug('starting client manager...');
    this.clientManager.start((err) => {
      if (err) {
        logger.error(err);
        return callback(err);
      } else {
        logger.info(`dispatcher is listening on ${this.config.port}`);
        return callback(null);
      }
    });
  }

  _syncBPUs(callback) {
    this.bpuManager.sync(this.clientManager, (err) => {
      if (err) {
        logger.error(err);
        return callback(err);
      } else {
        return callback(null);
      }
    });
  }

  _syncExperiments(callback) {
    this.experimentManager.sync(this.bpuManager, (err) => {
      if (err) {
        logger.error(err);
        return callback(err);
      } else {
        return callback(null);
      }
    });
  }


  /**
   * [_updateClients description]
   * @param  {Function} callback [description]
   * @return {[type]}            [description]
   */
  _syncClients(callback) {
    this.clientManager.sync((err) => {
      if (err) {
        logger.error(err);
        return callback(err);
      } else {
        return callback(null);
      }
    });
  }

  _loop(callback) {
    logger.info('=================================');

    async.waterfall([
      (callback) => {
        logger.debug('syncing BPUs...');

        this._syncBPUs(callback);
      },
      (callback) => {
        logger.debug('syncing Experiments...');

        this._syncExperiments(callback);
      },
      (callback) => {
        logger.debug('syncing web clients...');

        this._syncClients(callback);
      }
    ], (err, result) => {
      if (err) {
        logger.error(err);
        return callback(err);
      } else {

        // this._loop((err)=>{
        //     if (err) {
        //         logger.error(err);
        //         // return callback(err);
        //     }
        // });

        return callback(null);
      }
    });
  }
}

export default Dispatcher;