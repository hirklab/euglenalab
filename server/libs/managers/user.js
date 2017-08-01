"use strict";

var _ = require('underscore');

// constructor
function UserManager(config, logger, io, sessionMiddleware, db) {
    this.config = config;
    this.logger = logger;
    this.io = io;
    this.sessionMiddleware = sessionMiddleware;
    this.db = db;
    this.users = {};
}

// class methods
UserManager.prototype.connect = function (controller, cb) {
    var that = this;

    that.controller = controller;

    that.logger.debug('starting socket server...');

    that.io.sockets
        .use(function (socket, next) {
            that.sessionMiddleware(socket.request, {}, next);
        });

    that.io.sockets.on('connection', function (socket) {
        var found = false;

        // that.logger.debug(socket.request.session.passport.user);

        if (socket.request.session.passport.user !== undefined && socket.request.session.passport.user !== null) {
            if (socket.request.session.passport.user._id in that.users) {
                that.users[socket.request.session.passport.user._id].sockets = _.reject(that.users[socket.request.session.passport.user._id].sockets, function (d) {
                    return !d.connected;
                });

                found = _.find(that.users[socket.request.session.passport.user._id].sockets, function (available) {
                    return available.id === socket.id;
                });
            } else {
                that.users[socket.request.session.passport.user._id] = socket.request.session.passport.user;
                that.users[socket.request.session.passport.user._id].userID = socket.request.session.passport.user._id;
                that.users[socket.request.session.passport.user._id].sockets = [];
                that.users[socket.request.session.passport.user._id].sessionID = socket.request.sessionID;

            }

            if (!found) {
                that.logger.debug('client ' + socket.id + ' connected');
                that.users[socket.request.session.passport.user._id].sockets.push(socket);
                that.listConnectedUsers();
            }
        }

        socket.on('disconnect', function (reason) {
            that.logger.debug('client ' + socket.id + ' disconnected');

            //remove socket
            if (socket.request.session.passport.user !== undefined && socket.request.session.passport.user !== null) {
                if (socket.request.session.passport.user._id in that.users) {
                    that.users[socket.request.session.passport.user._id].sockets = _.reject(that.users[socket.request.session.passport.user._id].sockets, function (d) {
                        return d.id === socket.id;
                    });

                    //remove user with no socket connections
                    if (that.users[socket.request.session.passport.user._id].sockets.length === 0) {
                        delete that.users[socket.request.session.passport.user._id];
                    }

                    that.listConnectedUsers();
                }
            }
        });

        socket.on('error', function (error) {
            that.logger.error(error);
        });

        // submit experiment to controller
        socket.on(that.config.mainConfig.userSocketStrs.user_submitExperimentRequest, function (joinQueueDataArray, callbackToClient) {
            that.logger.debug("submitting experiment to controller...");
            that.controller.submitExperiment(joinQueueDataArray, callbackToClient);
        });

        // submit stimulus data to controller
        socket.on(that.config.mainConfig.userSocketStrs.user_ledsSet, function (data) {
            that.logger.debug("sending data to controller...");
            that.controller.setStimulus(data);
        });

        // socket.emit(that.config.mainConfig.userSocketStrs.user_setConnection, function (sessDocJson) {
        //     //Update and find session
        //     var updateObj = {
        //         lastUpdateTime: new Date().getTime(),
        //         isVerified:     true,
        //         sessionID:      sessDocJson.sessionID,
        //         socketHandle:   sessDocJson.socketHandle,
        //         socketID:       sessDocJson.socketID
        //     };
        //
        //     that.db.models.Session.findOneAndUpdate({'sessionID': sessDocJson.sessionID}, updateObj, {new: true}, function (err, sessDoc) {
        //         if (err) {
        //             socket.emit(that.config.mainConfig.userSocketStrs.user_serverError, 'Session:' + err);
        //         } else if (sessDoc === null || sessDoc === undefined) {
        //             socket.emit(that.config.mainConfig.userSocketStrs.user_serverError, 'Session:' + 'dne');
        //         } else {
        //             var hasLiveExp     = false;
        //             var checkLiveExpId = 'fake';
        //
        //             if (sessDoc.liveBpuExperiment && sessDoc.liveBpuExperiment.id) {
        //                 checkLiveExpId = sessDoc.liveBpuExperiment.id;
        //             }
        //
        //             that.db.models.BpuExperiment.findById(checkLiveExpId, {exp_status: 1}, function (err, expDoc) {
        //                 if (err || expDoc === null || expDoc === undefined) {
        //                 } else {
        //                     if (expDoc.exp_status === 'addingtobpu' || expDoc.exp_status === 'running') {
        //                         hasLiveExp = true;
        //                     }
        //                 }
        //
        //                 if (!hasLiveExp) {
        //                     sessDoc.liveBpuExperiment.id = null;
        //                     sessDoc.save();
        //                 }
        //
        //                 socket.sessionDoc = sessDoc;
        //
        //                 //Allow clients to send experiment requests to bpu controller
        //                 socket.on(that.config.mainConfig.userSocketStrs.user_submitExperimentRequest, function (joinQueueDataArray, callbackToClient) {
        //                     that.logger.debug("submitting experiment to controller...");
        //                     that.controller.submitExperiment(joinQueueDataArray, callbackToClient);
        //                 });
        //
        //                 socket.on(that.config.mainConfig.userSocketStrs.user_ledsSet, function (data) {
        //                     that.logger.debug("sending data to controller...");
        //                     that.controller.setStimulus(data);
        //                 });
        //             });
        //         }
        //     });
        // });

    });

    cb(null);
};

UserManager.prototype.listConnectedUsers = function () {
    var that = this;

    that.logger.info('========================================');

    _.map(that.users, function (user) {
        that.logger.info(user.username + '\t' + user.sockets.length + ' client(s)');// + '\t' + _.pluck(user.sockets, 'id'));
    });
};

// export the class
module.exports = UserManager;