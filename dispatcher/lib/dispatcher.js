import http from 'http';
import express from 'express';
import async from 'async';
import mongoose from 'mongoose';
import _ from 'lodash';
import {EXPERIMENT_STATUS, PROFILERS, GROUPS, BPU_STATUS, ROUTES} from './constants';
import {router} from './router';
import {Database} from './db';
import * as utils from './bpu';
import {initializeSocketServer} from './sockets';
import {logger} from './logging'

mongoose.Promise = require('bluebird');

class Dispatcher {
  constructor(config) {
    this.status = 'initializing...';
    this.config = config;
    this.server = null;
    this.queues = {};
    this.bpuList = [];
    this.webClients = [];
    this.experiments = [];
    this.newExperiments = {};
    this.queueTimePerBPU = {};
    this.startDate = new Date();
  }

  prepare(callback) {
    async.waterfall([
      (callback) => {
        this._connectDatabase(callback);
      },
      (callback) => {
        this._startWebServer(callback);
      },
      (callback) => {
        this._startSocketServer(callback);
      },
      (callback) => {
        this._getExperimentQueues(callback);
      },
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
      })
    }, this.config.loopTimeout);
  }

  status() {

  }

  die() {

  }

  _connectDatabase(callback) {
    logger.debug('connecting database...');

    this.db = new Database(this.config);
    this.db.connect((err) => {
      if (err) {
        logger.error(err);
        return callback(err);
      }

      return callback(null);
    });
  }

  _startWebServer(callback) {
    if (router == null) {
      return callback("router load error");
    }

    logger.debug('starting webserver...');

    // let app = express();
    // app.use(router);

    this.server = http.createServer((req,res)=>{
      //app
    });

    this.server.listen(this.config.port, this.config.ip, (err) => {
      if (err) {
        logger.error(err);
        return callback(err);
      } else {
        logger.debug("webserver is ready");
        return callback(null);
      }
    });
  }

  _startSocketServer(callback) {
    let socketjs = initializeSocketServer(this.server, this.webClients, this.db, this.config, callback);

    if (socketjs == null) {
      return callback("sockets load error");
    }

    logger.debug('starting websocket server...');

    // this.sockets = socketjs.sockets;
    this.socketServer = socketjs.io;

    return callback(null);
  }

  _getExperimentQueues(callback) {
    this.db.getExperimentQueues((err, queues) => {
      if (err) {
        logger.error(err);
        return callback(err);
      }

      this.queues = queues;
      return callback(null, this.queues);
    });
  }

  _getBPUs(callback) {
    this.db.getBpus((err, bpuList) => {
      if (err) {
        logger.error(err);
        return callback(err);
      }

      bpuList.forEach((bpu) => {
        if (this.bpuList[bpu.name]) {
          this.bpuList[bpu.name].doc = bpu;
        } else {
          this.bpuList[bpu.name] = {
            doc: bpu,
            socket: null,
            socketTimeouts: 0,
            queueTime: 0,
            messages: [],
            connected: false,
          };
        }

      });

      return callback(null);
    });
  }

  _verifyBPUs(callback) {
    let workflow = [];

    let keys = Object.keys(this.bpuList);

    keys.forEach((key) => {
      this.bpuList[key].connected = false;

      workflow.push((callback) => {
        utils.verify(this.bpuList[key], this.db, this.config, this.startDate, this.status, callback)
      });
    });

    async.parallel(workflow, (err) => {
      if (err) {
        logger.error(err);
        return callback(null);
      }

      return callback(null);
    });
  }

  _processExperiments(queues, callback) {
    utils.processQueues(queues, this.bpuList, this.experiments, this.newExperiments, this.startDate, this.status, callback);
  }

  _verifyExperiments(callback) {
    async.waterfall([
      (callback) => {
        logger.debug('fetching new experiments...');
        this.db.getNewExperiments(callback);
      },
      (queues, callback) => {
        logger.debug('processing experiments...');
        this._processExperiments(queues, callback);
      }
    ], (err) => {
      if (err) {
        logger.error(err);
        return callback(err);
      }

      return callback(null);
    });
  }

  _executeExperiments(callback) {
    this.experiments.sort((objA, objB) => {
      return objA.exp_submissionTime - objB.exp_submissionTime;
    });

    let bpuQueues = _.groupBy(this.experiments, 'exp_lastResort.bpuName');

    let experimentQueue = [];
    Object.keys(this.bpuList).forEach((key) => {
      // BPU has experiments to execute?
      if (bpuQueues[key] && bpuQueues[key].length > 0) {
        // is BPU ready to run experiment?
        if (this.bpuList[key].doc.bpuStatus === BPU_STATUS.READY) {
          //push 1st experiment in queue for the BPU
          experimentQueue.push(utils.executeExperiment.bind(bpuQueues[key][0], this.bpuList[key], this.sockets, this.config, callback));
        } else {
          this.experiments.push(bpuQueues[key][0]);
        }
      }
    });

    if (experimentQueue.length > 0) {
      async.parallel(experimentQueue, (err) => {
        if (err) {
          logger.error(err);
          return callback(err);
        }

        return callback(null);
      });
    } else {
      return callback(null);
    }
  }

  _updateExperiments(callback) {
    //Add left over new experiments
    logger.debug('adding left over new experiments...');

    while (Object.keys(this.newExperiments).length > 0) {
      let expTag = this.newExperiments[Object.keys(this.newExperiments)[0]];
      this.queues.newExps.push(expTag);
      delete this.newExperiments[Object.keys(this.newExperiments)[0]];
    }

    //Add sorted pub docs to this listExpDoc
    logger.debug('adding experiments to BPU queues...');

    while (this.experiments.length > 0) {
      let expDoc = this.experiments.shift();
      let newTag = expDoc.getExperimentTag();

      if (newTag.exp_lastResort.bpuName in this.queues) {
        this.queues[newTag.exp_lastResort.bpuName].push(newTag);
      }
      else {
        logger.error('BPU Name in experiment ID: ' + newTag._id + ' has BPU Name: ' + newTag.exp_lastResort.bpuName + ', but that BPU is not preset in app.listExperiment');
      }
    }

    //Save to database
    logger.debug('saving queues to database...');
    this.queues.save((err, updatedQueues) => {
      if (err) {
        logger.error(err);
        return callback(err);
      }
      return callback(null);
    });
  }

  _updateClients(callback) {
    logger.info(this.webClients);

    if (this.webClients.length > 0) {
      let bpuDocs = _.map(this.bpuList, (bpu) => {
        return bpu.doc.toJSON();
      });

      this.webClients.forEach((socket) => {
        if (socket.connected) {
          logger.info(`updating connected client ${socket.id}...`);
          socket.emit(ROUTES.WEBSERVER.GET_STATUS, bpuDocs, this.queues.toJSON(), this.config.queueTimePerBPU, callback);
        }
      });
    }

    return callback(null);
  }

  _loop(callback) {
    logger.debug('=================================');

    async.waterfall([
      (callback) => {
        logger.debug('fetching BPUs...');

        this._getBPUs(callback);
      },
      (callback) => {
        logger.debug('verifying BPUs...');

        this._verifyBPUs(callback);
      },
      (callback) => {
        logger.debug('verifying Experiments...');

        this._verifyExperiments(callback);
      },
      (callback) => {
        logger.debug('executing Experiments...');

        this._executeExperiments(callback);
      },
      (callback) => {
        logger.debug('updating Experiments...');

        this._updateExperiments(callback)
      },
      (callback) => {
        logger.debug('updating Clients...');

        this._updateClients(callback)
      }
    ], (err, result) => {
      if (err) {
        logger.error(err);
        return callback(err);
      }

      // this._loop((err)=>{
      //     if (err) {
      //         logger.error(err);
      //         // return callback(err);
      //     }
      // });

      return callback(null);
    });
  }
}

export default Dispatcher;
