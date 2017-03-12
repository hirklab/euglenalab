/**
 * Created by shirish.goyal on 2/23/17.
 */

// import * as io from 'socket.io';
import express from 'express';
import async from 'async';
import mongoose from 'mongoose';
import {router} from './router';
import {Database} from './db';
import * as utils from './bpu';

mongoose.Promise = require('bluebird');

class Dispatcher {
    constructor(config, logger) {
        this.status = 'initializing...';
        this.config = config;
        this.logger = logger;
        this.server = express();
        this.queues = {};
        this.bpuList = [];
        this.experiments = [];
        this.startDate = new Date();
    }

    prepare(callback) {
        async.waterfall([
            (callback) => {
                this._connectDatabase(callback);
            },
            (config, callback) => {
                this._startWebServer(config, callback);
            },
            (config, callback) => {
                this._startSocketServer(config, callback);
            },
            (config, callback) => {
                this._getExperimentQueue(config, callback);
            },
        ], (err, result) => {
            callback(err, result);
        });
    }

    run() {
        this._loop((err, callback) => {
            if (err) {
                this.logger.error(err);
            }

            setTimeout(() => {
                this._loop();
            }, this.config.loopTimeout);
        });
    }

    status() {

    }

    die() {

    }

    _connectDatabase(callback) {
        this.status = 'connecting database...';
        this.db = new Database(this.config, this.logger);
        this.db.connect((err, config) => {
            if (err) {
                this.logger.error(err);
                return callback(err);
            }

            return callback(null, this.config);
        });
    }

    _startWebServer(config, callback) {
        if (router == null) {
            return callback("router load error");
        }

        this.status = 'starting webserver...';
        this.server.use(router);

        return this.server.listen(config.port, (err) => {
            if (err) {
                this.logger.error(err);
                return callback(err);
            }

            this.logger.info("dispatcher is listening on " + config.port);
            return callback(null, config);
        });
    }

    _startSocketServer(config, callback) {
        let socketjs = require('./sockets', this, config, this.logger);

        if (socketjs == null) {
            return callback("sockets load error");
        }

        this.status = 'starting websocket server...';

        this.sockets = socketjs.sockets;
        this.socketServer = socketjs.socketServer;
        this.logger.info("websocket server is ready");

        return callback(null, config);
    }

    _getExperimentQueue(config, callback) {
        this.status = 'fetching experiments...';
        this.db.getExperimentQueues((err, queues) => {
            if (err) {
                return callback(err);
            }

            this.queues = queues;
            return callback(null, this.queues);
        });
    }

    _getBPUs(callback) {
        this.status = 'fetching BPU list...';
        this.db.getBpus((err, bpuList) => {
            if (err) {
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

            return callback(null, this.bpuList);
        });
    }

    _loop(callback) {
        // workflow.push(checkExpsAndResort);
        // workflow.push(sendExpsToBpus);
        // workflow.push(checkUpdateListExperiment);
        // workflow.push(updateClientSocketConnections);

        async.waterfall([
            (callback) => {
                this._getBPUs(callback);
            },
            (bpuList, callback) => {
                this.status = 'verifying BPUs...';
                utils.verifyBPUs(bpuList, this.db, this.config, this.logger, this.startDate, callback)
            },
            (bpuList, callback) => {
                this.status = 'verifying Experiments...';

            }
        ], (err, result) => {
            // app.runParams.runCounter++;
            if (err) {
                this.logger.error(err);
                return callback(err);
            }

            return callback(null);
        });
    }
}

export default Dispatcher;
