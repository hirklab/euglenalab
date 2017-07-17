"use strict";
var async          = require('async');
var socketIo       = require('socket.io');
var socketIoClient = require('socket.io-client');

var config = require('../config');

module.exports = function (app) {


    return {
        getMicroscopes: function (callback) {
            app.logger.debug('fetching BPUs...');

            app.db.getBPUs(function (err, microscopes) {
                if (err) {
                    app.logger.error(err);
                    return callback(err);
                } else {
                    microscopes.forEach(function (microscope) {
                        if (app.microscopesIndex[microscope.name]) {
                            app.microscopesIndex[microscope.name].doc = microscope;
                        } else {
                            app.microscopesIndex[microscope.name] = {
                                doc:           microscope,
                                socket:        null,
                                inactiveCount: 0,
                                queueTime:     0,
                                messages:      [],
                                isConnected:   false
                            };
                        }

                    });
                    return callback(null);
                }
            });
        },

        checkIfConnected: function (callback) {
            app.logger.debug('checking BPUs...');

            var fn_connectBpu = function (bpuObj, cb_connectBpu) {
                // new connection to BPU
                if (bpuObj.socket === null) {

                    bpuObj.socket = socketIoClient('http://' + bpuObj.doc.localAddr.ip + ':' + bpuObj.doc.localAddr.serverPort, {
                        multiplex:    false,
                        reconnection: true
                    });

                    bpuObj.socket.on('connect', function () {
                    });

                    bpuObj.socket.on('disconnect', function (msg) {
                        bpuObj.socket.disconnect();
                        bpuObj.socket.close();
                        delete bpuObj.socket;
                        bpuObj.inactiveCount = 0;
                        bpuObj.socket        = null;
                    });

                    app.microscopesIndex[bpuObj.doc.name].setStimulus = function (setStimulus) {
                        bpuObj.socket.emit(app.mainConfig.socketStrs.bpu_runExpLedsSet, setStimulus);
                    };

                    setTimeout(function () {
                        cb_connectBpu(null);
                    }, 500);
                } else {
                    // connection to BPU timed out
                    if (bpuObj.inactiveCount > config.MICROSCOPE_INACTIVE_COUNT) {
                        bpuObj.socket.disconnect();
                        delete bpuObj.socket;
                        bpuObj.inactiveCount = 0;
                        bpuObj.socket        = null;
                        cb_connectBpu('reset socket');
                    } else {
                        // connection looks fine
                        cb_connectBpu(null);
                    }
                }
            };

            var fn_clearBpuExp = function (bpuObj, cb_clearBpuExp) {
                if (bpuObj.getStatusResObj.expOverId !== null && bpuObj.getStatusResObj.expOverId !== undefined) {
                    if (bpuObj.doc.bpuStatus === app.mainConfig.bpuStatusTypes.finalizingDone) {
                        var updateObj = {
                            exp_serverClearTime: new Date().getTime(),
                            exp_status:          'servercleared',
                        };
                        app.db.models.BpuExperiment.findByIdAndUpdate(bpuObj.getStatusResObj.expOverId, updateObj, function (err, savedExpDoc) {
                            if (err) {
                                app.errors.experiment.push({
                                    time: new Date(),
                                    err:  bpuObj.doc.name + ' fn_clearBpuExp BpuExperiment.findByIdAndUpdate ' + err
                                });
                                cb_clearBpuExp(bpuObj.doc.name + ' fn_clearBpuExp BpuExperiment.findByIdAndUpdate ' + err);
                            } else {
                                cb_clearBpuExp(null);
                            }
                        });
                    } else {
                        app.errors.experiment.push({
                            time: new Date(),
                            err:  bpuObj.doc.name + ' fn_clearBpuExp ' + 'has expOverId:' + bpuObj.getStatusResObj.expOverId + ' but status is ' + bpuObj.doc.bpuStatus + '!=' + app.mainConfig.bpuStatusTypes.finalizingDone
                        });
                        cb_clearBpuExp(bpuObj.doc.name + ' fn_clearBpuExp ' + 'has expOverId:' + bpuObj.getStatusResObj.expOverId + ' but status is ' + bpuObj.doc.bpuStatus + '!=' + app.mainConfig.bpuStatusTypes.finalizingDone);
                    }
                } else {
                    cb_clearBpuExp(null);
                }
            };

            var checkBpu = function (checkBpuCallback) {
                var bpuObj      = this;
                //Timeout
                var didCallback = false;
                setTimeout(function () {
                    if (!didCallback) {
                        didCallback = true;
                        bpuObj.inactiveCount++;
                        app.logger.error('timed out ' + bpuObj.inactiveCount);
                        app.errors.experiment.push({
                            time: new Date(),
                            err:  bpuObj.doc.name + ' fn_connectBpu ' + 'timed out ' + bpuObj.inactiveCount
                        });
                        return checkBpuCallback(null);
                    }
                }, 1000);

                bpuObj.messages = [];
                //Check Socket Connnection
                bpuObj.messages.push({
                    isErr: false,
                    time:  new Date().getTime(),
                    msg:   'Connected:\t' + (bpuObj.socket !== null)
                });
                bpuObj.messages.push({
                    isErr: false,
                    time:  new Date().getTime(),
                    msg:   'Timeout:\t' + bpuObj.inactiveCount
                });

                fn_connectBpu(bpuObj, function (err) {
                    if (!didCallback) {
                        if (err) {
                            didCallback = true;
                            bpuObj.inactiveCount++;
                            bpuObj.messages.push({
                                isErr: true,
                                time:  new Date().getTime(),
                                msg:   'fn_connectBpu ' + err
                            });
                            bpuObj.doc.bpuStatus = app.mainConfig.bpuStatusTypes.offline;
                            app.errors.experiment.push({
                                time: new Date(),
                                err:  bpuObj.doc.name + ' fn_connectBpu ' + err
                            });
                            return checkBpuCallback(null);

                        } else if (!bpuObj.socket.connected) {
                            didCallback = true;
                            bpuObj.inactiveCount++;
                            bpuObj.doc.bpuStatus = app.mainConfig.bpuStatusTypes.offline;
                            bpuObj.messages.push({
                                isErr: true,
                                time:  new Date().getTime(),
                                msg:   'Connection:\toffline'
                            });
                            app.errors.experiment.push({
                                time: new Date(),
                                err:  bpuObj.doc.name + 'Connection:\toffline'
                            });
                            return checkBpuCallback(null);
                        } else {

                            //Get Status
                            bpuObj.socket.emit(app.mainConfig.socketStrs.bpu_getStatus, function (resObj) {
                                if (!didCallback) {
                                    didCallback        = true;
                                    bpuObj.isConnected = true;
                                    bpuObj.messages.push({
                                        isErr: false,
                                        time:  new Date().getTime(),
                                        msg:   'Status:\t\t' + app.mainConfig.betterStatus[bpuObj.doc.bpuStatus]
                                    });

                                    bpuObj.inactiveCount = 0;
                                    bpuObj.queueTime     = 0;

                                    //Save Res Obj on temp obj
                                    bpuObj.getStatusResObj = resObj;

                                    //bpuStatus
                                    bpuObj.doc.bpuStatus = resObj.bpuStatus;

                                    //Check for active Exp
                                    if (resObj.exp !== null && resObj.exp !== undefined) {
                                        var expOverIdNull = (bpuObj.getStatusResObj.expOverId !== null && bpuObj.getStatusResObj.expOverId !== undefined);
                                        bpuObj.messages.push({
                                            isErr: false,
                                            time:  new Date().getTime(),
                                            msg:   'id:' + resObj.exp._id + ', Exp=(user:' + resObj.exp.user.name + ', timeLeft:' + resObj.expTimeLeft + ', expOverIdNull?' + expOverIdNull + ')'
                                        });
                                        bpuObj.doc.liveBpuExperiment.id                   = resObj.exp._id;
                                        bpuObj.doc.liveBpuExperiment.group_experimentType = resObj.exp.group_experimentType;
                                        bpuObj.doc.liveBpuExperiment.bc_timeLeft          = resObj.expTimeLeft;
                                        bpuObj.doc.liveBpuExperiment.username             = resObj.exp.user.name;
                                        bpuObj.doc.liveBpuExperiment.sessionID            = resObj.exp.session.sessionID;

                                        //Include current experiment in queue time
                                        bpuObj.queueTime = bpuObj.doc.liveBpuExperiment.bc_timeLeft;

                                        //Clear set leds function
                                        if (app.bpuLedsSetMatch[bpuObj.doc.liveBpuExperiment.sessionID] &&
                                            bpuObj.doc.bpuStatus !== app.mainConfig.bpuStatusTypes.running && bpuObj.doc.bpuStatus !== app.mainConfig.bpuStatusTypes.pendingRun) {
                                            delete app.bpuLedsSetMatch[bpuObj.doc.liveBpuExperiment.sessionID];
                                        }

                                        //No Active exp
                                    } else {
                                        bpuObj.doc.liveBpuExperiment.id                   = null;
                                        bpuObj.doc.liveBpuExperiment.group_experimentType = 'text';
                                        bpuObj.doc.liveBpuExperiment.bc_timeLeft          = 0;
                                        bpuObj.doc.liveBpuExperiment.sessionID            = null;
                                        bpuObj.doc.liveBpuExperiment.username             = null;
                                    }

                                    //Check for exp over
                                    fn_clearBpuExp(bpuObj, function (err) {
                                        if (err) {
                                            bpuObj.messages.push({
                                                isErr: true,
                                                time:  new Date().getTime(),
                                                msg:   'fn_clearBpuExp ' + err
                                            });
                                        }

                                        //Check if scripter needs to run
                                        var statMsg = [];

                                        statMsg.push({
                                            name: 'scripterPopulation',
                                            age:  app.startDate.getTime() - bpuObj.doc.performanceScores.scripterPopulationDate,
                                            msg:  'Population:\t' + Math.round(bpuObj.doc.performanceScores.scripterPopulation, 2) + ' '
                                        });

                                        statMsg.push({
                                            name: 'scripterActivity',
                                            age:  app.startDate.getTime() - bpuObj.doc.performanceScores.scripterActivityDate,
                                            msg:  'Activity:\t' + Math.round(bpuObj.doc.performanceScores.scripterActivity, 2) + ' '
                                        });

                                        statMsg.push({
                                            name: 'scripterResponse',
                                            age:  app.startDate.getTime() - bpuObj.doc.performanceScores.scripterResponseDate,
                                            msg:  'Response:\t' + Math.round(bpuObj.doc.performanceScores.scripterResponse, 2) + ' '
                                        });

                                        statMsg.sort(function (objA, objB) {
                                            return objA.age - objB.age;
                                        });

                                        var cnt = 0;

                                        statMsg.forEach(function (stat) {
                                            bpuObj.messages.push({
                                                isErr: false,
                                                time:  new Date().getTime() + cnt * 100,
                                                msg:   stat.msg + '\t(' + Math.round(stat.age / 60000) + ' mins ago)'
                                            });
                                        });


                                        var lastSend = app.startDate.getTime() - bpuObj.doc.performanceScores.bc_lastSendDate;

                                        var nextSendMS = config.PROFILING_INTERVAL - statMsg[statMsg.length - 1].age;

                                        if (nextSendMS < 0 && lastSend > config.PROFILING_INTERVAL) {

                                            if (config.PROFILING) {
                                                app.db.models.Bpu.submitTextExpWithUser({
                                                    name: bpuObj.doc.name
                                                }, {
                                                    name:   statMsg[statMsg.length - 1].name,
                                                    groups: ['scripter']
                                                }, function (err, expTag) {
                                                    if (err) {
                                                        bpuObj.messages.push({
                                                            isErr: true,
                                                            time:  new Date().getTime(),
                                                            msg:   'submitTextExpWithUser err:' + err
                                                        });
                                                    }
                                                    bpuObj.doc.performanceScores.bc_lastSendDate = app.startDate.getTime();
                                                    bpuObj.doc.save(function (err, newDoc) {
                                                        if (err) {
                                                            bpuObj.messages.push({
                                                                isErr: true,
                                                                time:  new Date().getTime(),
                                                                msg:   'save err:' + err
                                                            });
                                                        }
                                                        return checkBpuCallback(null);
                                                    });
                                                });
                                            } else {
                                                return checkBpuCallback(null);
                                            }
                                        } else {
                                            return checkBpuCallback(null);
                                        }
                                    });
                                } else {
                                    app.errors.experiment.push({
                                        time: new Date(),
                                        err:  bpuObj.doc.name + ' fn_connectBpu ' + 'getstatus called back but already timed out'
                                    });
                                } //end of !didCallback
                            }); //socket get status
                        }
                    } //end of !didCallback
                }); //connect bpu
            }; //end of main func

            //Build Parallel
            var runParallelFuncs = [];
            var keys             = Object.keys(app.microscopesIndex);
            keys.sort(function (objA, objB) {
                return app.microscopesIndex[objA].doc.index - app.microscopesIndex[objB].doc.index;
            });
            keys.forEach(function (key) {
                app.microscopesIndex[key].isConnected = false;
                runParallelFuncs.push(checkBpu.bind(app.microscopesIndex[key]));
            });

            async.parallel(runParallelFuncs, function (err) {

                var keys = Object.keys(app.microscopesIndex);

                keys.sort(function (objA, objB) {
                    return app.microscopesIndex[objA].doc.index - app.microscopesIndex[objB].doc.index;
                });

                keys.forEach(function (key) {
                    app.logger.info(app.microscopesIndex[key].doc.name);

                    app.microscopesIndex[key].messages.sort(function (objA, objB) {
                        return objA.time - objB.time;
                    });

                    app.microscopesIndex[key].messages.forEach(function (msgObj) {
                        if (msgObj.isErr) {
                            app.logger.error('\t' + msgObj.msg);
                        } else {
                            app.logger.info('\t' + msgObj.msg);
                        }
                    });
                });
                if (err) {
                    app.logger.error(err);
                } else {
                    app.logger.debug('Checking ' + runParallelFuncs.length + ' BPU(s)');
                }

                return callback(null);
            });
        },


    }
};