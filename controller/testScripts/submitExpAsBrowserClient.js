var async = require('async');
var mongoose = require('mongoose');
var crypto = require('crypto');
var base64url = require('base64url');
var ioClient = require('socket.io-client');

var mainConfig = require('../../shared/mainConfig.js');
var deployment = require('../../deployment');

var mode = deployment.mode;
var mongoUri = 'mongodb://localhost:27017/' + deployment[mode].db;
var socketClientServerIP = 'localhost';
var socketClientServerPort = deployment[mode].controller.port;

var app = {
    mainConfig: mainConfig,
    db: null,
    socket: null,
    joinQueueDataObj: null
};

var setupMongoose = function (callback) {
    app.db = mongoose.createConnection(mongoUri);

    app.db.on('error', function (err) {
        callback(err);
    });

    app.db.once('open', function () {
        require('../mongoModels')(app, mongoose);
        callback(null);
    });
};

var setupSession = function (callback) {
    app.fakePageData = {
        url: '/account/joinlabwithdata/',
    };

    app.handle = '/account/joinlabwithdata';  //socketHandle is set per client socket js,, ideally matches the page url

    app.fakeUserInfo = {
        _id: app.db.models.User()._id,
        username: 'user' + randomStringAsBase64Url(4),
        groups: ['default'],
    };

    var sessInfo = {
        url: app.fakePageData.url,
        sessionID: randomStringAsBase64Url(24),
        user: {
            id: app.fakeUserInfo._id,
            name: app.fakeUserInfo.username,
            groups: app.fakeUserInfo.groups
        }
    };

    app.db.models.Session.makeNewSession(sessInfo, function (err, session) {
        if (err) {
            return callback(err);
        }

        app.fakeSessionInfo = session;
        callback(null, session);
    })
};

var setupClientSocket = function (callback) {
    app.socket = ioClient.connect('http://' + socketClientServerIP + ':' + socketClientServerPort);
    app.socket.on('connect', function () {
        console.log('socket connected: ' + app.socket.id);
    });
    callback(null);
};

var getSubmitData = function (callback) {
    app.joinQueueDataObj = {
        user:{
            id:null,
            name:null,
            groups:null,
        },
        session:{
            id:null,
            sessionID:null,
            socketID:null,
        },
        group_experimentType:null,
        exp_wantsBpuName:null,

        exp_eventsToRun:[],
        exp_metaData:{},

        liveUserLabTime: 30*1000,
        zeroLedEvent:{time:0, topValue:0, rightValue:0, bottomValue:0, leftValue:0}
    };
    callback(null);
};

var init = function (callback) {
    var initSeriesFuncs = [];

    initSeriesFuncs.push(setupMongoose);
    initSeriesFuncs.push(setupSession);
    initSeriesFuncs.push(setupClientSocket);
    initSeriesFuncs.push(getSubmitData);

    async.series(initSeriesFuncs, function (err) {
        if (err) {
            callback(err);
        } else {
            callback(null);
        }
    });
};

var submitExperiment = function (joinQueueDataArray, callback) {
    //Web server builds a new exp for each sumbit package in array
    //...saves them to the db
    //...saves a tag to listExperiment
    //...returns array of failed submissions

    var outcome = {
        failed: [],
    };

    var actionFunc = function (actionCallback) {
        var submitObj = this;
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
                    outcome.failed.push({joinQueueData: submitObj, err: err});
                    console.log(err);
                    actionCallback(null);
                } else {
                    var expTag = savedExp.getExperimentTag();

                    app.db.models.ListExperiment.addNewExpTagToList(expTag, function (err) {
                        if (err) {
                            console.log(err);
                            outcome.failed.push({joinQueueData: submitObj, err: err});
                            actionCallback(null);
                        } else {
                            actionCallback(null);
                        }
                    });
                }
            });
        } else {
            outcome.failed.push({joinQueueData: submitObj, err: validationObj.err});
            actionCallback(null);
        }
    };

    var actionFuncs = [];

    joinQueueDataArray.forEach(function (submitObj) {
        actionFuncs.push(actionFunc.bind(submitObj));
    });

    async.parallel(actionFuncs, function (err) {
        if (err) {
            console.log(err);
            callback(err, null);
        } else if (outcome.failed.length > 0) {
            console.log(outcome.failed);
            callback('some failed', outcome.failed);
        } else {
            callback(null, null);
        }
    });
};

var submitLiveExpOnBrowser = function (type, wantsBpuName) {
    var fakePageData = app.fakePageData;
    var _Handle = app.handle;

    //Fake User
    var fakeUserInfo = app.fakeUserInfo;
    var fakeSessionInfo = app.fakeSessionInfo;

    //User Clicks Submit Live Button on Join Lab Page
    var joinQueueData = JSON.parse(JSON.stringify(app.joinQueueDataObj));
    joinQueueData.group_experimentType = type;

    var joinQueueDataObjects = [joinQueueData];

    //Extra info is added to every joinqueue data object
    joinQueueDataObjects.forEach(function (obj) {
        obj.user.id = fakeUserInfo._id;
        obj.user.name = fakeUserInfo.username;
        obj.user.groups = fakeUserInfo.groups;

        obj.session.id = fakeSessionInfo._id;
        obj.session.sessionID = fakeSessionInfo.sessionID;
        obj.session.socketID = fakeSessionInfo.socketID;

        obj.exp_metaData.group_experimentType = obj.group_experimentType;
        obj.exp_wantsBpuName = wantsBpuName;

        obj.exp_metaData.clientCreationDate = new Date();
        obj.exp_metaData.userUrl = fakePageData.url;
        obj.exp_metaData.tag = 'no tag set';
        obj.exp_metaData.description = 'no description set';
    });

    //Array of submit packages are submitted through socket-client.js
    //Check Each Pack is again check...redundent
    joinQueueDataObjects.forEach(function (obj) {
        if (obj.group_experimentType === 'live') {
            var zeroEvt = JSON.parse(JSON.stringify(obj.zeroLedEvent));
            var lastEvt = JSON.parse(JSON.stringify(obj.zeroLedEvent));

            lastEvt.time = obj.liveUserLabTime;

            obj.exp_eventsToRun.push(zeroEvt);
            obj.exp_eventsToRun.push(lastEvt);
        }else{
            var zeroEvt = JSON.parse(JSON.stringify(obj.zeroLedEvent));
            var lastEvt = JSON.parse(JSON.stringify(obj.zeroLedEvent));

            lastEvt.time = obj.liveUserLabTime;

            obj.exp_eventsToRun.push(zeroEvt);
            obj.exp_eventsToRun.push({time:5000, topValue:100, rightValue:0, bottomValue:0, leftValue:0});
            obj.exp_eventsToRun.push({time:10000, topValue:0, rightValue:100, bottomValue:0, leftValue:0});
            obj.exp_eventsToRun.push({time:15000, topValue:0, rightValue:0, bottomValue:100, leftValue:0});
            obj.exp_eventsToRun.push({time:20000, topValue:0, rightValue:0, bottomValue:0, leftValue:100});
            obj.exp_eventsToRun.push(lastEvt);
        }

        //Session ID is updated with last from socket setconnection...we could update this on the client page..
        // obj.session.id=fakeSessionInfo._id;
        // obj.session.sessionID=fakeSessionInfo.sessionID;
        // obj.session.socketID=fakeSessionInfo.socketID;
        obj.session.socketHandle = _Handle;
    });

    //Emitted join array of exp submission to webserver
    submitExperiment(joinQueueDataObjects, function (err, failures) {
        if (err) {
            console.log('submitLiveExpOnBrowser.submitLiveExpOnWebServer err', err);

            failures.forEach(function (failure) {
                console.log(failure.joinQueueData.session.sessionID, failure.err);
            });

        } else {
            console.log('submitLiveExpOnBrowser.submitLiveExpOnWebServer');
        }
    });
};

function randomStringAsBase64Url(size) {
    return base64url(crypto.randomBytes(size));
}

init(function (err) {
    if (err) {
        console.log(err);
    } else {
        var type = 'text';
        var wantsBpuName = null;

        submitLiveExpOnBrowser(type, wantsBpuName);
    }
});
