'use strict';
var async = require('async');
var fs = require('fs');
var exec = require('child_process').exec;
var socketIoClient = require('socket.io-client');
var mongoose = require('mongoose');


var _maxPopulationDensity = 200;
var _maxResponse = {4: 1.5, 10: 2};
var _maxActivityDensity = 100;
var _maxTime = 5; //minutes

var _windowLambdaMs = 5 * 60 * 60 * 1000;

var _coeffPopulation = 5;
var _coeffActivity = 1;
var _coeffResponse = 5;
var _coeffTime = 10;

//Directories
var mserverBaseDir = __dirname.substr(0, __dirname.search('shared'));
var mainConfigFile = mserverBaseDir + 'shared/' + 'mainConfig';
var readyMongoFolder = '/myData/bpu/readyMongo';
var tarsFolder = '/myData/bpu/tars';
var mServerTarFolder = '/myData/mServer';
var mServerDataReadyMongoFolder = mserverBaseDir + 'datadump' + '/' + 'readyMongo';

var _SchemaName = 'Bpu';
var _app = null;

// var Note = mongoose.model('Note');

//Schema
exports = module.exports = function (app) {
    // var Note = mongoose.model('Note');

    _app = app;
    //Setup Logger
    // var logInfo={name:_SchemaName+'.js', loggerLevel:app.bpuLogLevel};
    //Schema Base
    var schema = new mongoose.Schema({
        //State
        isOn: {type: Boolean, default: false},
        bpuStatus: {
            type: String, enum: [
                'initializing', 'initializingFailed', 'initializingDone',
                'pendingRun', 'running', 'runningFailed',
                'finalizing', 'finalizingFailed', 'finalizingDone',
                'reseting', 'resetingFailed', 'resetingDone'], default: 'initializing'
        },

        //ID
        index: {type: Number, default: -1},
        name: {type: String, default: 'default'},

        //Constant Info
        magnification: {type: Number, default: 10},
        allowedGroups: {type: Array, default: ['all']},
        localAddr: {
            ip: {type: String, default: 'default'},
            serverPort: {type: String, default: 'default'},
            webcamPort: {type: String, default: 'default'},
        },
        publicAddr: {
            ip: {type: String, default: 'default'},
            serverPort: {type: String, default: 'default'},
            webcamPort: {type: String, default: 'default'},
            allowedPorts: {type: Array, default: []},
        },

        bpu_processingTime: {type: Number, default: 60000},

        //user data Set for active experiment
        session: {
            id: {type: mongoose.Schema.Types.ObjectId, ref: 'Session'},
            sessionID: {type: String, default: ''},
            socketID: {type: String, default: ''},
        },

        //Active Exp Data-set in bpucontroller on get status
        liveBpuExperiment: {
            id: {type: mongoose.Schema.Types.ObjectId, ref: 'BpuExperiment'},
            group_experimentType: {type: String, enum: ['live', 'text'], default: 'text'},
            bc_timeLeft: {type: Number, default: 0},
            sessionID: {type: String, default: null},
            username: {type: String, default: null},
        },

        //running notes
        notes: ['Note'],

        //Bpu Scripts
        performanceScores: {
            WindowLambdaMs: {type: Number, default: 5 * 60 * 60 * 1000},

            bc_lastSendDate: {type: Number, default: new Date(0).getTime()},
            pc_lastUpdateDate: {type: Number, default: new Date(0).getTime()},

            scripterPopulation: {type: Number, default: 0},
            scripterPopulationDate: {type: Number, default: new Date(0).getTime()},
            scripterActivity: {type: Number, default: 0},
            scripterActivityDate: {type: Number, default: new Date(0).getTime()},
            scripterResponse: {type: Number, default: 0},
            scripterResponseDate: {type: Number, default: new Date(0).getTime()}
        },
        pastPerformanceScores: {type: Array, default: []},

        //Flush Object
        flushData: {
            lastFlushDate: {type: Date, default: new Date(0)},
            flushDates: {type: Array, default: []},
        },

        populationPastScores: {type: Array, default: []},
        activityPastScores: {type: Array, default: []},
        responsePastScores: {type: Array, default: []},

        timeFrameInMinutesForScripts: {type: Number, default: 24 * 60},
        timeFrameInMinutesForPlots: {type: Number, default: 5 * 24 * 60},

        populationScore: {type: Number, default: 0},
        activityScore: {type: Number, default: 0},
        responseScore: {type: Number, default: 0},
        avgStatsData: {type: Array, default: []},
    });
    //Script Additions
    require('./_' + _SchemaName + '/' + 'bpu_mainConfig' + '.js')(app, schema, _SchemaName);
    //Default Additions
    schema.plugin(require('./plugins/pagedFind'));
    schema.index({name: 1});
    schema.set('autoIndex', app.config.isDevelopment);

    //Special Statics
    schema.statics.getDocument = function (docInfo, nextMethodName, mainCallback) {
        var funcName = 'getDocument';
        var thisSchema = this;
        thisSchema.find(docInfo, {}, function (err, documents) {
            if (err) {
                mainCallback(err, null);
            } else {
                //Set thisDocument
                var thisDocument = null;
                if (documents.length === 0) {
                    thisDocument = thisSchema();
                } else {
                    var cnt = 0;
                    thisDocument = documents[0];
                    if (documents.length > 1) {
                        documents.forEach(function (doc) {
                            Object.keys(doc).forEach(function (key) {
                                if (doc[key] === docInfo) {
                                    thisDocument = doc;
                                }
                            });
                        });
                    }
                }
                //Callback
                if (typeof nextMethodName === 'function' && (mainCallback === null || mainCallback === undefined)) nextMethodName(null, thisDocument);
                else if (thisDocument[nextMethodName]) thisDocument[nextMethodName](mainCallback);
                else mainCallback(null, thisDocument);
            }
        });
    };
    //Scoring/Scripters Bpu
    schema.statics.submitTextExpWithUser = function (docInfo, user, mainCallback) {
        this.getDocument(docInfo, function (err, theDocument) {
            if (err) {
                mainCallback(_SchemaName + ':' + 'submitTextExpWithUser' + ':' + err, null);
            } else {
                theDocument.submitTextExpWithUser(user, mainCallback);
            }
        });
    };
    schema.methods.submitTextExpWithUser = function (user, mainCallback) {
        var thisDocument = this;
        app.db.models.Session.findOne({'user.name': user.name}, {}, function (err, sessDoc) {
            if (err) {
                mainCallback('could not find session err:' + err);
            } else if (sessDoc === null || sessDoc === undefined) {
                var newSession = app.db.models.Session();
                newSession.save(function (err, savedSession) {
                    joinQueueData = _getJoinQueueDataObj(app, user, newSession, thisDocument.name);
                    _submitExperiment(app, joinQueueData, mainCallback);
                });
            } else {
                var joinQueueData = _getJoinQueueDataObj(app, user, sessDoc, thisDocument.name);
                _submitExperiment(app, joinQueueData, mainCallback);
            }
        });

    };
    schema.methods.scoreBpu = function (queueWaitTime) {
        var thisDocument = this;

        //DEBUG
        if (true) {
            _maxPopulationDensity = 50;
            _maxActivityDensity = 100;
            _maxResponse = {4: 1.5, 10: 1.5};
            _maxTime = 1; //minutes


            _coeffPopulation = 5;
            _coeffActivity = 1;
            _coeffResponse = 5;
            _coeffTime = 10;
            _windowLambdaMs = 5 * 60 * 60 * 1000;
        }
        var magnification = thisDocument.magnification;
        var activityFunction = function (max, score, zoom) {
            var magRatio = (10 / zoom) * (10 / zoom);
            var modScore = score * magRatio;
            var finalScore = Math.min((modScore / max), 1);
            return finalScore;
        };
        var populationFunction = function (max, score, zoom) {
            var magRatio = (zoom / 10) * (zoom / 10);
            var modScore = score * magRatio;
            var finalScore = Math.min((modScore / max), 1);
            return finalScore;
        };
        var responseFunction = function (maxs, score, zoom) {
            var max = 4;
            if (_maxResponse[zoom]) max = _maxResponse[zoom];
            var finalScore = Math.min((score / max), 1);
            return finalScore;
        };

        var timeFunction = function (max, score, zoom) {
            var finalScore = Math.pow(2, -1 * (score / max));
            return finalScore;
        };

        var alphaAct = activityFunction(_maxActivityDensity, thisDocument.performanceScores.scripterActivity, Number(magnification));
        var alphaPop = populationFunction(_maxPopulationDensity, thisDocument.performanceScores.scripterPopulation, Number(magnification));
        var alphaRes = responseFunction(_maxResponse, thisDocument.performanceScores.scripterResponse, magnification);
        var alphaTime = timeFunction(_maxTime, queueWaitTime / 60000, magnification);

        var alphaNumer = _coeffActivity * alphaAct + _coeffPopulation * alphaPop + _coeffResponse * alphaRes + _coeffTime * alphaTime;
        var alphaDenom = _coeffActivity + _coeffPopulation + _coeffResponse + _coeffTime;
        var finalScore = alphaNumer / alphaDenom;

        var returnObj = {
            finalScore: Math.round(finalScore * 10000) / 10000,
            queueWaitTime: queueWaitTime,
            magnification: magnification,
            scripterActivity: thisDocument.performanceScores.scripterActivity,
            scripterPopulation: thisDocument.performanceScores.scripterPopulation,
            scripterResponse: thisDocument.performanceScores.scripterResponse,

            alphaTime: alphaTime,
            alphaPopulation: alphaPop,
            alphaActivity: alphaAct,
            alphaResponse: alphaRes,
        };
        return returnObj;
    };

    schema.methods.bpuGroupsCrossCheckWithUser = function (user) {
        var thisDoc = this;
        for (var ind = 0; ind < thisDoc.allowedGroups.length; ind++) {
            for (var jnd = 0; jnd < user.groups.length; jnd++) {
                if (thisDoc.allowedGroups[ind] === user.groups[jnd]) return true;
            }
        }
        return false;
    };
    //Get ips
    schema.methods.getWebStreamUrl = function () {
        var thisDoc = this;
        return 'http://' + thisDoc.publicAddr.ip + ':' + thisDoc.publicAddr.webcamPort + '/?action=stream';
    };
    schema.methods.getWebSnapShotUrl = function () {
        var thisDoc = this;
        return 'http://' + thisDoc.publicAddr.ip + ':' + thisDoc.publicAddr.webcamPort + '/?action=snapshot';
    };
    schema.methods.getSideStreamUrl = function () {
        var thisDoc = this;
        return 'http://' + thisDoc.publicAddr.ip + ':' + '8082' + '/?action=stream';
    };

    //Browser Display
    schema.methods.getMainImageStream = function () {
        return 'http://' + this.publicAddr.ip + ':' + this.publicAddr.webcamPort + '/?action=stream';
    };
    schema.methods.getMainImageSnapshot = function () {
        return 'http://' + this.publicAddr.ip + ':' + this.publicAddr.webcamPort + '/?action=snapshot';
    };
    schema.methods.getSideImageStream = function () {
        return 'http://' + this.publicAddr.ip + ':' + '8081' + '/?action=stream';
    };
    schema.methods.getSideImageSnapshot = function () {
        return 'http://' + this.publicAddr.ip + ':' + '8081' + '/?action=snapshot';
    };
    return schema;
};

var _submitExperiment = function (app, submitObj, callback) {
    var newExp = app.db.models.BpuExperiment();

    newExp.user.id = submitObj.user.id;
    newExp.user.name = submitObj.user.name;
    newExp.user.groups = submitObj.user.groups;

    newExp.session.id = submitObj.session.id;
    newExp.session.sessionID = submitObj.session.sessionID;
    newExp.session.socketID = submitObj.session.socketID;

    newExp.group_experimentType = submitObj.group_experimentType;
    newExp.exp_wantsBpuName = submitObj.exp_wantsBpuName;

    newExp.exp_eventsToRun = submitObj.exp_eventsToRun;
    newExp.exp_eventsToRun.sort(function (objA, objB) {
        return objB.time - objA.time;
    });
    newExp.exp_eventsRunTime = newExp.exp_eventsToRun[0].time;

    newExp.exp_metaData = submitObj.exp_metaData;
    newExp.exp_submissionTime = new Date().getTime();
    var validationObj = app.db.models.BpuExperiment.validate(newExp);
    if (validationObj.isValid) {
        newExp.save(function (err, savedExp) {
            if (err) {
                callback('newExp.save err:' + err);
            } else {
                var expTag = savedExp.getExperimentTag();
                app.db.models.ListExperiment.addNewExpTagToList(expTag, function (err) {
                    if (err) {
                        callback('ListExperiment.addNewExpTagToList err:' + err, null);
                    } else {
                        callback(null, expTag);
                    }
                });
            }
        });
    } else {
        callback('validationObj:' + validationObj.err);
    }
};

var _getJoinQueueDataObj = function (app, user, session, wantsBpuName) {
    var joinQueueData = app.db.models.BpuExperiment.getDataObjToJoinQueue();
    joinQueueData.user = {
        id: user.id,
        name: user.name,
        groups: user.groups || ['default'],
    };
    joinQueueData.session = {
        id: session.id,
        sessionID: session.sessionID,
        socketID: session.socketID,
    };
    joinQueueData.group_experimentType = 'text';
    joinQueueData.exp_wantsBpuName = wantsBpuName;
    if (joinQueueData.user.name === 'scripterPopulation') {
        joinQueueData.exp_eventsToRun = [
            {"time": 0, "topValue": 0, "rightValue": 0, "bottomValue": 0, "leftValue": 0},
            {"time": 20000, "topValue": 0, "rightValue": 0, "bottomValue": 0, "leftValue": 0},
        ];
    } else if (joinQueueData.user.name === 'scripterActivity') {
        joinQueueData.exp_eventsToRun = [
            {"time": 0, "topValue": 0, "rightValue": 0, "bottomValue": 0, "leftValue": 0},
            {"time": 20000, "topValue": 0, "rightValue": 0, "bottomValue": 0, "leftValue": 0},
        ];
    } else if (joinQueueData.user.name === 'scripterResponse') {
        joinQueueData.exp_eventsToRun = [
            {"time": 0, "topValue": 100, "rightValue": 0, "bottomValue": 0, "leftValue": 0},
            {"time": 30000, "topValue": 0, "rightValue": 100, "bottomValue": 0, "leftValue": 0},
            {"time": 60000, "topValue": 0, "rightValue": 0, "bottomValue": 100, "leftValue": 0},
            {"time": 90000, "topValue": 0, "rightValue": 0, "bottomValue": 0, "leftValue": 100},
            {"time": 120000, "topValue": 0, "rightValue": 0, "bottomValue": 0, "leftValue": 0},
        ];
    } else {
        joinQueueData.exp_eventsToRun = [
            {"time": 0, "topValue": 0, "rightValue": 0, "bottomValue": 0, "leftValue": 0},
            {"time": 10000, "topValue": 100, "rightValue": 0, "bottomValue": 0, "leftValue": 0},
            {"time": 20000, "topValue": 0, "rightValue": 100, "bottomValue": 0, "leftValue": 0},
            {"time": 30000, "topValue": 0, "rightValue": 0, "bottomValue": 100, "leftValue": 0},
            {"time": 40000, "topValue": 0, "rightValue": 0, "bottomValue": 0, "leftValue": 100},
            {"time": 50000, "topValue": 0, "rightValue": 0, "bottomValue": 0, "leftValue": 0},
        ];
    }
    joinQueueData.exp_metaData = {
        description: new Date() + ':' + joinQueueData.user.name + ':' + 'bpu schema bpu auto built exp.',
        tag: joinQueueData.user.name + ':' + 'bpu schema auto built exp.',
    };
    return joinQueueData;
};
