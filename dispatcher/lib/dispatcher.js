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
import {EXPERIMENT_STATUS, PROFILERS, GROUPS, BPU_STATUS} from './constants';


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
        this._loop((err, callback) => {
            if (err) {
                this.logger.error(err);
            }

            setTimeout(() => {
                this._loop((err, callback) => {
                    if (err) {
                        this.logger.error(err);
                    }
                })
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

            return callback(null);
        });
    }

    _startWebServer(callback) {
        if (router == null) {
            return callback("router load error");
        }

        this.status = 'starting webserver...';
        this.server.use(router);

        return this.server.listen(this.config.port, (err) => {
            if (err) {
                this.logger.error(err);
                return callback(err);
            }

            this.logger.info("dispatcher is listening on " + this.config.port);
            return callback(null);
        });
    }

    _startSocketServer(callback) {
        let socketjs = require('./sockets', this, this.config, this.logger);

        if (socketjs == null) {
            return callback("sockets load error");
        }

        this.status = 'starting websocket server...';

        this.sockets = socketjs.sockets;
        this.socketServer = socketjs.socketServer;
        this.logger.info("websocket server is ready");

        return callback(null);
    }

    _getExperimentQueues(callback) {
        this.status = 'fetching experiments...';
        this.db.getExperimentQueues((err, queues) => {
            if (err) {
                this.logger.error(err);
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
                this.logger.error(err);
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

    _verifyBPUs(bpuList, status, callback) {
        let workflow = [];

        let keys = Object.keys(this.bpuList);

        keys.forEach((key) => {
            this.bpuList[key].connected = false;

            workflow.push((callback) => {
                utils.verify(this.bpuList[key], this.db, this.config, this.logger, this.startDate, status, callback)
            });
        });

        async.parallel(workflow, (err) => {
            if (err) {
                this.logger.error(err);
                return callback(err);
            }

            return callback(null);
        });
    }

    _verifyExperiments(status, callback) {
        this.status = 'verifying Experiments...';

        async.waterfall([
            (callback) => {
                console.log('new Experiments');
                this.db.getNewExperiments(callback);
            },
            (queues, callback) => {
                console.log('queues');
                console.log(queues);
                utils.processQueues(this.queues, this.bpuList, this.experiments, this.newExperiments, this.logger, this.startDate, status, callback);
            },
        ], (err) => {
            if (err) {
                this.logger.error(err);
                return callback(err);
            }

            return callback(null, this.experiments);
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
                    experimentQueue.push(utils.executeExperiment.bind(bpuQueues[key][0], this.bpuList[key], this.sockets, this.config, this.logger));
                } else {
                    this.experiments.push(bpuQueues[key][0]);
                }
            }
        });

        async.parallel(experimentQueue, (err) => {
            if (err) {
                this.logger.error(err);
                return callback(err);
            }

            return callback(null, this.experiments);
        });
    }

    _updateExperiments(callback) {
        //Add left over new experiments
        while (Object.keys(this.newExperiments).length > 0) {
            let expTag = this.newExperiments[Object.keys(this.newExperiments)[0]];
            queues.newExps.push(expTag);
            delete this.newExperiments[Object.keys(this.newExperiments)[0]];
        }

        //Add sorted pub docs to this listExpDoc
        while (this.experiments.length > 0) {
            let expDoc = this.experiments.shift();
            let newTag = expDoc.getExperimentTag();

            if (newTag.exp_lastResort.bpuName in queues) {
                queues[newTag.exp_lastResort.bpuName].push(newTag);
            }
            else {
                this.logger.error('BPU Name in experiment ID: ' + newTag._id + ' has BPU Name: ' + newTag.exp_lastResort.bpuName + ', but that BPU is not preset in app.listExperiment');
            }
        }

        //Save to database
        this.queues.save((err, updatedQueues) => {
            if(err){
                this.logger.error(err);
                return callback(err);
            }
            return callback(null);
        });
    }

    _updateClients(callback) {
        if (this.sockets.length > 0) {
            let bpuDocs = [];

            Object.keys(this.bpuList).forEach((key) => {
                bpuDocs.push(this.bpuList[key].doc.toJSON());
            });

            this.sockets.forEach((socket) => {
                if (socket.connected) {
                    socket.emit('update', bpuDocs, this.queues.toJSON(), this.config.queueTimePerBPU, callback);
                }
            });
        }

        return callback(null);
    }

    _loop(callback) {
        async.waterfall([
            (callback) => {
                this._getBPUs(callback);
            },
            (bpuList, callback) => {
                this.status = 'verifying BPUs...';
                this.logger.info(this.status);

                this._verifyBPUs(bpuList, this.status, callback);
            },
            (bpuList, callback) => {
                this.status = 'verifying Experiments...';
                this.logger.info(this.status);

                this._verifyExperiments(this.status, callback);
            },
            (experiments, callback) => {
                this.status = 'executing Experiments...';
                this.logger.info(this.status);

                this._executeExperiments(this.status, callback);
            },
            (callback) => {
                this.status = 'updating Experiments...';
                this.logger.info(this.status);

                this._updateExperiments(this.status, callback)
            },
            (callback) => {
                this.status = 'updating Clients...';
                this.logger.info(this.status);

                this._updateClients(this.status, callback)
            }
        ], (err, result) => {
            if (err) {
                this.logger.error(err);
                return callback(err);
            }

            return callback(null);
        });
    }
}

export default Dispatcher;
