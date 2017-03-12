/**
 * Created by shirish.goyal on 2/26/17.
 */

var sendExpsToBpus = function (callback) {
    var cnt = 0;
    var sendExpToBpu = function (sendExpToBpuCallback) {
        cnt++;
        var exp = this.exp;
        var bpuObj = this.bpuObj;
        app.logger.trace(cnt + ':sendExpToBpu ' + bpuObj.doc.name + ':' + exp.group_experimentType + ':' + exp.id + ' on Socket?null:' + (bpuObj.socket === null));
        _addExpToBpu(app, exp, bpuObj.doc, bpuObj.socket, function (err, session) {
            if (err) {
                err = cnt + ':sendExpsToBpus _addExpToBpu error:' + err;
                app.runData.addExpToBpuErrors.push({time: new Date(), err: err});
                app.logger.error(err);
            } else {
                bpuObj.doc.session.id = session.id;
                bpuObj.doc.session.sessionID = session.sessionID;
                bpuObj.doc.session.socketID = session.socketID;
            }
        });
        sendExpToBpuCallback(null);
    };

    //Find next Experiment per bpu
    app.keeperExpDocs.sort(function (objA, objB) {
        return objA.exp_submissionTime - objB.exp_submissionTime;
    });
    var expPerBpu = {};
    for (var ind = 0; ind < app.keeperExpDocs.length; ind++) {
        if (expPerBpu[app.keeperExpDocs[ind].exp_lastResort.bpuName] === null || expPerBpu[app.keeperExpDocs[ind].exp_lastResort.bpuName] === undefined) {
            var bpuExp = app.keeperExpDocs.splice(ind, 1)[0];
            ind--;
            expPerBpu[bpuExp.exp_lastResort.bpuName] = bpuExp;
            if (Object.keys(expPerBpu).length >= Object.keys(app.bpuObjects).length) break;
        }
    }
    //Build Parallel - Match Available Bpus with Queue Experiments
    var runParallelFuncs = [];
    Object.keys(app.bpuObjects).forEach(function (key) {
        //bpu has exp in queue?
        if (expPerBpu[key]) {
            //can send to bpu
            if (app.bpuObjects[key].doc.bpuStatus === app.mainConfig.bpuStatusTypes.resetingDone) {
                runParallelFuncs.push(sendExpToBpu.bind({bpuObj: app.bpuObjects[key], exp: expPerBpu[key]}));

                //put back in keeper docs to return to queue
            } else {
                app.keeperExpDocs.push(expPerBpu[key]);
            }
        }
    });
    expPerBpu = null;

    //Run Parallel
    app.logger.info('runParallel start sendExpsToBpus on ' + runParallelFuncs.length);
    async.parallel(runParallelFuncs, function (err) {
        if (err) {
            app.logger.error('runParallel end sendExpsToBpus on ' + runParallelFuncs.length + ' in ' + (new Date() - startDate) + ' err:' + err + '\n');
        } else {
            app.logger.info('runParallel end sendExpsToBpus on ' + runParallelFuncs.length + ' in ' + (new Date() - startDate) + '\n');
        }
        return callback(null);
    });
};

var checkUpdateListExperiment = function (callback) {
    //Add left over newExpTags into this listExpDoc
    while (Object.keys(app.newExpTagObj).length > 0) {
        var expTag = app.newExpTagObj[Object.keys(app.newExpTagObj)[0]];
        app.listExperimentDoc.newExps.push(expTag);
        delete app.newExpTagObj[Object.keys(app.newExpTagObj)[0]];
    }

    //Add sorted pub docs to this listExpDoc
    while (app.keeperExpDocs.length > 0) {
        var expDoc = app.keeperExpDocs.shift();
        var newTag = expDoc.getExperimentTag();
        if (newTag.exp_lastResort.bpuName in app.listExperimentDoc) {
            app.listExperimentDoc[newTag.exp_lastResort.bpuName].push(newTag);
        }
        else {
            app.logger.error('BPU Name in experiment: ID: ' + newTag._id + ' has BPU Name: ' + newTag.exp_lastResort.bpuName + ', but that BPU is not preset in app.listExperiment');
        }
    }

    //Save to database
    app.listExperimentDoc.save(function (err, savedDoc) {
        return callback(null);
    });
};

var updateClientSocketConnections = function (callback) {
    var timeNow = new Date().getTime();
    app.logger.debug('updateClientSock:' + app.socketConnections.length);
    if (app.socketConnections.length > 0) {
        var bpuDocs = [];
        Object.keys(app.bpuObjects).forEach(function (key) {
            bpuDocs.push(app.bpuObjects[key].doc.toJSON());
        });
        app.socketConnections.forEach(function (socket) {
            if (socket.connected) {
                socket.emit('update', bpuDocs, app.listExperimentDoc.toJSON(), app.runData.runningQueueTimesPerBpuName);
            }
        });
        previousUpdateEmit = timeNow;
    }
    return callback(null);
};


var _addExpToBpu = function (app, exp, bpuDoc, bpuSocket, mainCallback) {
    var confirmTimeout = 15000;
    var outcome = {};
    outcome.sess = null;

    var getSession = function (cb_fn) {

        app.db.models.Session.findById(exp.session.id, function (err, sessDoc) {
            if (err) {
                cb_fn('getSession err:' + err);
            } else if (sessDoc === null) {
                cb_fn('getSession err:' + 'sessDoc is null');
            } else {
                outcome.sess = sessDoc;
                cb_fn(null);
            }
        });
    };
    var sendExperimentToBpu = function (cb_fn) {
        var didCallback = false;
        setTimeout(function () {
            if (!didCallback) {
                didCallback = true;
                cb_fn('sendExperimentToBpu timed out');
            }
        }, 1500);
        if (bpuSocket === null || bpuSocket === undefined) {
            if (!didCallback) {
                didCallback = true;
                cb_fn('bpu socket is null');
            }
        } else {
            exp.exp_metaData.magnification = bpuDoc.magnification;
            console.log('events to run', exp.exp_eventsToRun);
            bpuSocket.emit(app.mainConfig.socketStrs.bpu_setExp, exp, confirmTimeout + 1000, function (err) {
                if (!didCallback) {
                    didCallback = true;
                    if (err) {
                        cb_fn('sendExperimentToBpu err:' + err);
                    } else {
                        //Save Exp
                        var expUpdateObj = {
                            liveBpu: {
                                id: bpuDoc._id,
                                name: bpuDoc.name,
                                index: bpuDoc.index,
                                socketId: bpuDoc.soc,
                            },
                            exp_lastResort: exp.exp_lastResort,
                            bc_startSendTime: exp.bc_startSendTime,
                            bc_isLiveSendingToLab: true,
                            exp_status: 'addingtobpu',
                            exp_metaData: exp.exp_metaData,
                        };
                        app.db.models.BpuExperiment.findByIdAndUpdate(exp.id, expUpdateObj, {new: true}, function (err, savedExp) {
                            if (err) {
                                app.logger.error('sendExperimentToBpu BpuExperiment.findByIdAndUpdate err:' + err);
                                cb_fn(null);
                            } else if (savedExp === null) {
                                app.logger.error('sendExperimentToBpu BpuExperiment.findByIdAndUpdate err:' + 'savedExp is null');
                                cb_fn(null);
                            } else {
                                expDoc = savedExp;
                                var sessUpdateObj = {
                                    liveBpuExperiment: {
                                        id: expDoc.id,
                                        tag: expDoc.getExperimentTag(),
                                    },
                                    bc_startSendTime: expDoc.bc_startSendTime,
                                    bc_isLiveSendingToLab: true,
                                };
                                app.db.models.Session.findByIdAndUpdate(exp.session.id, sessUpdateObj, {new: true}, function (err, sessDoc) {
                                    if (err) {
                                        app.logger.error('sendExperimentToBpu Session.findByIdAndUpdate err:' + err);
                                        cb_fn(null);
                                    } else if (expDoc === null) {
                                        app.logger.error('sendExperimentToBpu Session.findByIdAndUpdate err:' + 'sessDoc is null');
                                        cb_fn(null);
                                    } else {
                                        outcome.sess = sessDoc;
                                        cb_fn(null);
                                    }
                                });
                            }
                        });
                    }
                }
            });
        }//end of socket null check
    };
    var activateLiveUser = function (cb_fn) {

        async.some(app.socketConnections, function (clientSocket, callback) {

            if (clientSocket.connected) {
                console.log('Activating live user to: ' + clientSocket.id);
                clientSocket.emit('activateLiveUser', outcome.sess, app.runParams.liveUserConfirmTimeout, function (userActivateResData) {
                    if (userActivateResData.err || !userActivateResData.didConfirm) {
                        return callback(false)
                    } else {
                        app.bpuLedsSetMatch[outcome.sess.sessionID] = app.bpuLedsSetFuncs[bpuDoc.name];
                        bpuSocket.emit(app.mainConfig.socketStrs.bpu_runExp, function (bpuRunResObj) {
                            if (bpuRunResObj.err) {
                                app.runData.activateLiveUserErrors.push({
                                    time: new Date(),
                                    err: 'app.mainConfig.socketStrs.bpu_runExp callback err:' + bpuRunResObj.err
                                });
                                return callback(false);
                            } else {
                                clientSocket.emit('sendUserToLiveLab', outcome.sess, function (userSendResObj) {
                                    if (userSendResObj.err) {
                                        app.runData.activateLiveUserErrors.push({
                                            time: new Date(),
                                            err: 'app.mainConfig.socketStrs.bpu_runExp sendUserToLiveLab callback err:' + userSendResObj.err
                                        });
                                        return callback(false);
                                    } else {
                                        console.log('Someone confirmed and user sent to live lab')
                                        return callback(true);
                                    }
                                });
                            }
                        });
                    }
                });
            }
            else {
                return callback(false);
            }

        }, function (someoneConfirmed) {

            if (someoneConfirmed === false) {
                console.log('********* Nobody Confirmed **********');
                // app.runData.activateLiveUserErrors.push({time:new Date(), err:'activateLiveUser sess:'+outcome.sess.sessionID+
                //   ', user:'+outcome.sess.user.name
                //   });

                var isUserCancel = true;
                bpuSocket.emit(app.mainConfig.socketStrs.bpu_resetBpu, isUserCancel, outcome.sess.sessionID, function (err) {
                    app.runData.activateLiveUserErrors.push({
                        time: new Date(),
                        err: 'activateLiveUser bpu callback on reset'
                    });
                });
            }
            cb_fn(null);
        });


    };
    var runExpForNonLiveUser = function (cb_fn) {
        bpuSocket.emit(app.mainConfig.socketStrs.bpu_runExp, function (bpuResObj) {
            if (bpuResObj.err) {
            }
        });
        cb_fn(null);
    };

    //Build funcs
    var seriesFuncs = [];
    seriesFuncs.push(getSession);
    seriesFuncs.push(sendExperimentToBpu);
    if (exp.group_experimentType === 'live') seriesFuncs.push(activateLiveUser);
    else seriesFuncs.push(runExpForNonLiveUser);

    // Start Series
    async.series(seriesFuncs, function (err) {
        if (err) {
            mainCallback('_addExpToBpu ' + err, null);
        } else {
            mainCallback(null, outcome.sess);
        }
    });
};
