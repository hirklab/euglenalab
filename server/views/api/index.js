'use strict';

var jwt = require('jsonwebtoken');
var _ = require('lodash');
var mongoose = require('mongoose');

// a) MP -> API : POST /api/auth/register/ (Register user)
// {
//   username: '',
//   email:'',
//   password:''
// }
// Response -> user: {id, username, email, createdAt}
exports.register = function(req, res) {
    var workflow = req.app.utility.workflow(req, res);

    workflow.on('validate', function() {
        if (!req.body.username) {
            workflow.outcome.errfor.username = 'required';
        } else if (!/^[a-zA-Z0-9\-\_]+$/.test(req.body.username)) {
            workflow.outcome.errfor.username = 'only use letters, numbers, \'-\', \'_\'';
        }

        if (!req.body.email) {
            workflow.outcome.errfor.email = 'required';
        } else if (!/^[a-zA-Z0-9\-\_\.\+]+@[a-zA-Z0-9\-\_\.]+\.[a-zA-Z0-9\-\_]+$/.test(req.body.email)) {
            workflow.outcome.errfor.email = 'invalid email format';
        }

        if (!req.body.password) {
            workflow.outcome.errfor.password = 'required';
        }

        if (workflow.hasErrors()) {
            return workflow.emit('response');
        }

        workflow.emit('duplicateUsernameCheck');
    });

    workflow.on('duplicateUsernameCheck', function() {
        req.app.db.models.User.findOne({
            username: req.body.username
        }, function(err, user) {
            if (err) {
                return workflow.emit('exception', err);
            }

            if (user) {
                workflow.outcome.errfor.username = 'username already taken';
                return workflow.emit('response');
            }

            workflow.emit('duplicateEmailCheck');
        });
    });

    workflow.on('duplicateEmailCheck', function() {
        req.app.db.models.User.findOne({
            email: req.body.email.toLowerCase()
        }, function(err, user) {
            if (err) {
                return workflow.emit('exception', err);
            }

            if (user) {
                workflow.outcome.errfor.email = 'email already registered';
                return workflow.emit('response');
            }

            workflow.emit('createUser');
        });
    });

    workflow.on('createUser', function() {
        req.app.db.models.User.encryptPassword(req.body.password, function(err, hash) {
            if (err) {
                return workflow.emit('exception', err);
            }

            //add user to default group
            req.app.db.models.Group.findOne({
                name: 'default'
            }, function(err, dGroup) {
                if (dGroup === null) {
                    dGroup = req.app.db.models.Group();
                    dGroup.save();
                }

                //finish original
                var fieldsToSet = {
                    isActive: 'yes',
                    username: req.body.username,
                    email: req.body.email.toLowerCase(),
                    password: hash,
                    groups: [dGroup.name],
                    search: [
                        req.body.username,
                        req.body.email
                    ]
                };
                req.app.db.models.User.create(fieldsToSet, function(err, user) {
                    if (err) {
                        return workflow.emit('exception', err);
                    }
                    dGroup.users.push(user.username);
                    req.app.db.models.Group.findOneAndUpdate({
                        name: dGroup.name
                    }, {
                        users: dGroup.users
                    }, function(err, dGroup) {
                        if (err) {
                            return workflow.emit('exception', err);
                        }
                        workflow.user = user;
                        workflow.emit('createAccount');
                    });
                });
            });
        });
    });

    workflow.on('createAccount', function() {
        var fieldsToSet = {
            isVerified: 'yes',
            'name.full': workflow.user.username,
            user: {
                id: workflow.user._id,
                name: workflow.user.username
            },
            search: [
                workflow.user.username
            ]
        };

        req.app.db.models.Account.create(fieldsToSet, function(err, account) {
            if (err) {
                return workflow.emit('exception', err);
            }

            //update user with account
            workflow.user.roles.account = account._id;
            workflow.user.save(function(err, user) {
                if (err) {
                    return workflow.emit('exception', err);
                }

                workflow.outcome.user = {
                    id: workflow.user._id,
                    username: workflow.user.username,
                    email: workflow.user.email,
                    createdAt: workflow.user.timeCreated
                };

                workflow.emit('response');
            });
        });
    });

    workflow.emit('validate');
};

// b) MP -> API : POST /api/auth/login/ (Authenticate user)
// {
//   username: '',
//   password:''
// }
// 	Response: token - use this token in header of each request
// {
//   user: {}
//   token: "JWT 35252632632236"
// }
exports.login = function(req, res) {
    var workflow = req.app.utility.workflow(req, res);

    workflow.on('validate', function() {
        if (!req.body.username) {
            workflow.outcome.errfor.username = 'required';
        }

        if (!req.body.password) {
            workflow.outcome.errfor.password = 'required';
        }

        if (workflow.hasErrors()) {
            return workflow.emit('response');
        }

        workflow.emit('attemptLogin');
    });

    workflow.on('attemptLogin', function() {
        req._passport.instance.authenticate('local', function(err, user, info) {
            if (err) {
                return workflow.emit('exception', err);
            }

            req.login(user, function(err) {
                if (err) {
                    return workflow.emit('exception', err);
                }

                var payload = {
                    id: user.id
                };

                var secretOrKey = req.app.jwtOptions.secretOrKey;
                var token = jwt.sign(payload, secretOrKey, {
                    expiresIn: 24 * 60 * 60 // 1 day
                });

                workflow.outcome.user = {
                    id: user._id,
                    username: user.username,
                    email: user.email,
                    createdAt: user.timeCreated,
                    roles: user.roles,
                    isAdmin: (user.roles != null && user.roles.admin !== null)
                };

                workflow.outcome.token = "JWT " + token;
                workflow.outcome.sessionID = req.sessionID;
                workflow.outcome.queue = req.app.db.models.BpuExperiment.getDataObjToJoinQueue();

                if (workflow.hasErrors()) {
                    return workflow.emit('response');
                }

                workflow.emit('getSession');
            });

        })(req, res);
    });

    workflow.on('getSession', function() {

        var sessUpdate = {
            url: '/account',
            sessionID: req.sessionID,
            user: {
                id: workflow.outcome.user.id,
                name: workflow.outcome.user.username,
                groups: ["default"]
            },
            isVerified: false
        };

        req.app.db.models.Session.findOneAndUpdate({
            sessionID: req.sessionID
        }, sessUpdate, {
            new: true
        }, function(err, doc) {
            if (err) {
                workflow.outcome.errfor.session = err;
            } else if (doc === null || doc === undefined) {
                workflow.emit('newSession');
            } else {
                workflow.outcome.session = doc;
                workflow.emit('response');
            }

            if (workflow.hasErrors()) {
                return workflow.emit('response');
            }
        });
    });

    workflow.on('newSession', function() {
        var sessInfo = {
            url: '/account',
            sessionID: req.sessionID,
            user: {
                id: workflow.outcome.user.id,
                name: workflow.outcome.user.username,
                groups: ["default"]
            }
        };

        req.app.db.models.Session.makeNewSession(sessInfo, function(err, newDoc) {
            if (err) {
                workflow.outcome.errfor.session = err;
            } else {
                workflow.outcome.session = newDoc;
                workflow.emit('response');
            }

            if (workflow.hasErrors()) {
                return workflow.emit('response');
            }
        });
    });


    workflow.emit('validate');
};

exports.listUsers = function(req, res) {
    var workflow = req.app.utility.workflow(req, res);

    workflow.on('find', function() {
        req.query.search = req.query.search ? req.query.search : '';
        req.query.status = req.query.status ? req.query.status : '';
        req.query.limit = req.query.limit ? parseInt(req.query.limit, null) : 20;
        req.query.page = req.query.page ? parseInt(req.query.page, null) : 1;
        req.query.sort = req.query.sort ? req.query.sort : '_id';

        var filters = {};
        if (req.query.search) {
            filters.search = new RegExp('^.*?' + req.query.search + '.*$', 'i');
        }

        // if (req.query.status) {
        //     filters['status.id'] = req.query.status;
        // }

        req.app.db.models.User.pagedFind({
            filters: filters,
            keys: 'username email isActive timeCreated roles groups',
            limit: req.query.limit,
            page: req.query.page,
            sort: req.query.sort
        }, function(err, results) {
            if (err) {
                return workflow.emit('exception', err);
            }

            // var data = _.map(results.data, function (result) {
            //     console.log(result.roles.hasOwnProperty('admin'));
            //
            //     result.role = "account";
            //     if(result.roles.hasOwnProperty('admin')){
            //         result.role = "admin";
            //     }
            //     return result;
            // });

            workflow.outcome.results = results.data;
            workflow.outcome.pages = results.pages;
            workflow.outcome.items = results.items;
            workflow.emit('response');
        });
    });

    workflow.emit('find');

};

exports.detailUsers = function(req, res) {
    var workflow = req.app.utility.workflow(req, res);

    workflow.on('find', function() {
        // req.query.search = req.query.search ? req.query.search : '';
        // req.query.status = req.query.status ? req.query.status : '';
        // req.query.limit = req.query.limit ? parseInt(req.query.limit, null) : 20;
        // req.query.page = req.query.page ? parseInt(req.query.page, null) : 1;
        // req.query.sort = req.query.sort ? req.query.sort : '_id';
        //
        // var filters = {};
        // if (req.query.search) {
        //     filters.search = new RegExp('^.*?' + req.query.search + '.*$', 'i');
        // }

        // if (req.query.status) {
        //     filters['status.id'] = req.query.status;
        // }

        req.app.db.models.User.findById(req.params.id, 'username email isActive timeCreated roles groups lastExperimentRunDate').exec(function(err, result) {
            if (err) {
                return workflow.emit('exception', err);
            }

            // var data = _.map(results.data, function (result) {
            //     console.log(result.roles.hasOwnProperty('admin'));
            //
            //     result.role = "account";
            //     if(result.roles.hasOwnProperty('admin')){
            //         result.role = "admin";
            //     }
            //     return result;
            // });

            workflow.outcome.results = result;
            // workflow.outcome.pages = results.pages;
            // workflow.outcome.items = results.items;
            workflow.emit('response');
        });
    });

    workflow.emit('find');

};

exports.listGroups = function(req, res) {
    var workflow = req.app.utility.workflow(req, res);

    workflow.on('find', function() {
        req.query.search = req.query.search ? req.query.search : '';
        req.query.status = req.query.status ? req.query.status : '';
        req.query.limit = req.query.limit ? parseInt(req.query.limit, null) : 20;
        req.query.page = req.query.page ? parseInt(req.query.page, null) : 1;
        req.query.sort = req.query.sort ? req.query.sort : '_id';

        var filters = {};
        if (req.query.search) {
            filters.search = new RegExp('^.*?' + req.query.search + '.*$', 'i');
        }

        // if (req.query.status) {
        //     filters['status.id'] = req.query.status;
        // }

        req.app.db.models.Group.pagedFind({
            filters: filters,
            keys: 'name description users settings',
            limit: req.query.limit,
            page: req.query.page,
            sort: req.query.sort
        }, function(err, results) {
            if (err) {
                return workflow.emit('exception', err);
            }

            // var data = _.map(results.data, function (result) {
            //     console.log(result.roles.hasOwnProperty('admin'));
            //
            //     result.role = "account";
            //     if(result.roles.hasOwnProperty('admin')){
            //         result.role = "admin";
            //     }
            //     return result;
            // });

            workflow.outcome.results = results.data;
            workflow.outcome.pages = results.pages;
            workflow.outcome.items = results.items;
            workflow.emit('response');
        });
    });

    workflow.emit('find');

};

exports.detailGroups = function(req, res) {
    var workflow = req.app.utility.workflow(req, res);

    workflow.on('find', function() {
        // req.query.search = req.query.search ? req.query.search : '';
        // req.query.status = req.query.status ? req.query.status : '';
        // req.query.limit = req.query.limit ? parseInt(req.query.limit, null) : 20;
        // req.query.page = req.query.page ? parseInt(req.query.page, null) : 1;
        // req.query.sort = req.query.sort ? req.query.sort : '_id';
        //
        // var filters = {};
        // if (req.query.search) {
        //     filters.search = new RegExp('^.*?' + req.query.search + '.*$', 'i');
        // }

        // if (req.query.status) {
        //     filters['status.id'] = req.query.status;
        // }

        req.app.db.models.Group.findById(req.params.id, 'name description users settings').exec(function(err, result) {
            if (err) {
                return workflow.emit('exception', err);
            }

            // var data = _.map(results.data, function (result) {
            //     console.log(result.roles.hasOwnProperty('admin'));
            //
            //     result.role = "account";
            //     if(result.roles.hasOwnProperty('admin')){
            //         result.role = "admin";
            //     }
            //     return result;
            // });

            workflow.outcome.results = result;
            // workflow.outcome.pages = results.pages;
            // workflow.outcome.items = results.items;
            workflow.emit('response');
        });
    });

    workflow.emit('find');

};

// c) MP -> API : GET /api/bio-units/ (List of bio processing units)
// 	Response: list of units
exports.get_bio_units = function(req, res) {
    var workflow = req.app.utility.workflow(req, res);

    workflow.on('find', function() {
        req.query.search = req.query.search ? req.query.search : '';
        req.query.status = req.query.status ? req.query.status : '';
        req.query.limit = req.query.limit ? parseInt(req.query.limit, null) : 20;
        req.query.page = req.query.page ? parseInt(req.query.page, null) : 1;
        req.query.sort = req.query.sort ? req.query.sort : 'name';

        var filters = {};
        if (req.query.search) {
            filters.search = new RegExp('^.*?' + req.query.search + '.*$', 'i');
        }

        if (req.query.status) {
            filters['status.id'] = req.query.status;
        }

        req.app.db.models.Bpu.pagedFind({
            filters: filters,
            keys: 'name index isOn currentStatus magnification allowedGroups localAddr publicAddr avgStatsData',
            limit: req.query.limit,
            page: req.query.page,
            sort: req.query.sort
        }, function(err, results) {
            if (err) {
                return workflow.emit('exception', err);
            }

            var data = _.map(results.data, function(result) {
                var newResult = {};

                if (result.currentStatus === null || result.currentStatus === undefined) {

                    newResult.id = result._id;
                    newResult.name = result.name;
                    newResult.index = result.index;
                    newResult.magnification = result.magnification;
                    newResult.isOn = result.isOn;
                    newResult.processingTimePerExperiment = 'unknown';
                    newResult.bpuStatus = 'unknown';
                    newResult.expId = 'unknown';
                    newResult.username = 'unknown';
                    newResult.allowedGroups = 'unknown';
                    newResult.isReady = false;
                    newResult.isOver = false;
                    newResult.isCanceled = false;
                    newResult.err = null;
                    newResult.setTime = 'unknown';
                    newResult.runTime = 'unknown';
                    newResult.timeLeft = 0;
                    newResult.stats = result.avgStatsData;
                    newResult.localAddr = result.localAddr;
                    newResult.publicAddr = result.publicAddr;

                    return newResult;
                } else {
                    newResult.id = result._id;
                    newResult.name = result.name;
                    newResult.index = result.index;
                    newResult.magnification = result.magnification;
                    newResult.isOn = result.isOn;
                    //newResult.processingTimePerExperiment = result.currentStatus.processingTimePerExperiment;
                    newResult.bpuStatus = result.currentStatus.bpuStatus;
                    newResult.expId = result.currentStatus.expId;
                    newResult.username = result.currentStatus.username;
                    newResult.allowedGroups = result.currentStatus.allowedGroups;
                    newResult.isReady = result.currentStatus.isReady;
                    newResult.isOver = result.currentStatus.isOver;
                    newResult.isCanceled = result.currentStatus.isCanceled;
                    newResult.stats = result.avgStatsData;
                    newResult.localAddr = result.localAddr;
                    newResult.publicAddr = result.publicAddr;
                    newResult.err = result.currentStatus.err;

                    if (typeof result.currentStatus.setTime.getTime === 'function') {
                        newResult.setTime = Math.round((new Date() - result.currentStatus.setTime) / 60000);
                    }
                    if (typeof result.currentStatus.setTime.timeLeft === 'number') {
                        newResult.timeLeft = Math.round(result.currentStatus.timeLeft / 1000);
                    }
                    if (typeof result.currentStatus.setTime.runTime === 'number') {
                        newResult.runTime = Math.round(result.currentStatus.runTime / 1000);
                    }

                    return newResult;
                }
            });

            workflow.outcome.results = data;
            workflow.outcome.pages = results.pages;
            workflow.outcome.items = results.items;
            workflow.emit('response');
        });
    });

    workflow.emit('find');
};

// c) MP -> API : GET /api/bio-units/:id/ (detail of bio processing units)
// 	Response: unit
exports.bio_unit_detail = function(req, res) {
    var workflow = req.app.utility.workflow(req, res);

    workflow.on('find', function() {
        // req.query.search = req.query.search ? req.query.search : '';
        // req.query.status = req.query.status ? req.query.status : '';
        // req.query.limit = req.query.limit ? parseInt(req.query.limit, null) : 20;
        // req.query.page = req.query.page ? parseInt(req.query.page, null) : 1;
        // req.query.sort = req.query.sort ? req.query.sort : '_id';

        // var filters = {};
        // if (req.query.search) {
        //     filters.search = new RegExp('^.*?' + req.query.search + '.*$', 'i');
        // }
        //
        // if (req.query.status) {
        //     filters['status.id'] = req.query.status;
        // }

        req.app.db.models.Bpu.findById(req.params.id,
            'name index isOn currentStatus magnification allowedGroups localAddr publicAddr avgStatsData notes').exec(
            function(err, result) {
                if (err) {
                    return workflow.emit('exception', err);
                }

                // console.log(response);
                // var result = response;


                var newResult = {};

                if (result.currentStatus == null) {

                    newResult.id = result._id;
                    newResult.name = result.name;
                    newResult.index = result.index;
                    newResult.magnification = result.magnification;
                    newResult.isOn = result.isOn;
                    newResult.processingTimePerExperiment = 'unknown';
                    newResult.bpuStatus = 'unknown';
                    newResult.expId = 'unknown';
                    newResult.username = 'unknown';
                    newResult.allowedGroups = 'unknown';
                    newResult.isReady = false;
                    newResult.isOver = false;
                    newResult.isCanceled = false;
                    newResult.err = null;
                    newResult.setTime = 'unknown';
                    newResult.runTime = 'unknown';
                    newResult.timeLeft = 0;
                    newResult.stats = result.avgStatsData;
                    newResult.localAddr = result.localAddr;
                    newResult.publicAddr = result.publicAddr;
                    newResult.notes = result.notes;

                } else {
                    newResult.id = result._id;
                    newResult.name = result.name;
                    newResult.index = result.index;
                    newResult.magnification = result.magnification;
                    newResult.isOn = result.isOn;
                    // newResult.processingTimePerExperiment = result.currentStatus.processingTimePerExperiment;
                    newResult.bpuStatus = result.currentStatus.bpuStatus;
                    newResult.expId = result.currentStatus.expId;
                    newResult.username = result.currentStatus.username;
                    newResult.allowedGroups = result.currentStatus.allowedGroups;
                    newResult.isReady = result.currentStatus.isReady;
                    newResult.isOver = result.currentStatus.isOver;
                    newResult.isCanceled = result.currentStatus.isCanceled;
                    newResult.stats = result.avgStatsData;
                    newResult.localAddr = result.localAddr;
                    newResult.publicAddr = result.publicAddr;
                    newResult.err = result.currentStatus.err;
                    newResult.notes = result.notes;

                    if (typeof result.currentStatus.setTime.getTime === 'function') {
                        newResult.setTime = Math.round((new Date() - result.currentStatus.setTime) / 60000);
                    }
                    if (typeof result.currentStatus.setTime.timeLeft === 'number') {
                        newResult.timeLeft = Math.round(result.currentStatus.timeLeft / 1000);
                    }
                    if (typeof result.currentStatus.setTime.runTime === 'number') {
                        newResult.runTime = Math.round(result.currentStatus.runTime / 1000);
                    }
                }


                workflow.outcome.results = newResult;
                // workflow.outcome.pages = results.pages;
                // workflow.outcome.items = results.items;
                workflow.emit('response');
            }
        );
    });

    workflow.emit('find');
};

exports.bio_unit_health = function(req, res) {
    var workflow = req.app.utility.workflow(req, res);

    function getPerformance(username, param, bpu_id, startDate, endDate, scale, cb) {
        var endDate = parseInt(endDate);
        var startDate = parseInt(startDate);

        var filters = {};
        filters['user.name'] = username;
        filters['stats.' + username] = {
            $ne: -1
        };
        filters['liveBpu.id'] = mongoose.Types.ObjectId(bpu_id);
        filters['exp_processingEndTime'] = {
            // $lt: endDate, //new Date(endDate.getYear(), endDate.getMonth(), endDate.getDate())
            $gte: startDate //new Date(startDate.getYear(), startDate.getMonth(), startDate.getDate()),
        };

        var projections = {};
        projections[param] = '$stats.' + username;
        projections['bpu_id'] = '$liveBpu.id';
        projections['exp_processingEndTime'] = 1;
        projections['rating'] = '$survey.rating';
        projections['notes'] = '$survey.notes';

        req.app.db.models.BpuExperiment.aggregate([{
            $match: filters,
        }, {
            $lookup: {
                localField: "_id",
                from: "surveys",
                foreignField: "experiment",
                as: "survey"
            }
        }, {
            $project: projections
        }]).exec(function(err, results) {
            if (err) {

                cb(err, null);
            } else {
                var newResult = [];

                results.forEach(function(result) {
                    var endResult = {};
                    endResult['datetime'] = new Date(result.exp_processingEndTime);
                    if (result[param] > 0) {
                        endResult[param] = result[param] * scale;
                        newResult.push(endResult);
                    }

                    // var endResult = {};
                    // endResult['datetime'] = new Date(result.exp_processingEndTime);

                    // if (result['rating'].length > 0 && result['rating'][0] > 0) {
                    //     endResult['rating'] = result['rating'].length > 0 ? Math.round(result['rating'][0]) : 0;
                    //     endResult['notes'] = result['notes'].length > 0 ? result['notes'][0] : "";
                    //     newResult.push(endResult);
                    // }

                });

                cb(null, newResult);
            }
        })
    }

    function getRatings(username, param, bpu_id, startDate, endDate, scale, cb) {
        var endDate = parseInt(endDate);
        var startDate = parseInt(startDate);

        var filters = {};
        // filters['user.name'] = username;
        // filters['stats.' + username] = {
        //     $eq: -1
        // };
        filters['liveBpu.id'] = mongoose.Types.ObjectId(bpu_id);
        filters['exp_processingEndTime'] = {
            // $lt: endDate, //new Date(endDate.getYear(), endDate.getMonth(), endDate.getDate())
            $gte: startDate //new Date(startDate.getYear(), startDate.getMonth(), startDate.getDate()),
        };

        var projections = {};
        // projections[param] = '$stats.' + username;
        projections['bpu_id'] = '$liveBpu.id';
        projections['exp_processingEndTime'] = 1;
        projections['rating'] = '$survey.rating';
        projections['notes'] = '$survey.notes';

        req.app.db.models.BpuExperiment.aggregate([{
            $match: filters,
        }, {
            $lookup: {
                localField: "_id",
                from: "surveys",
                foreignField: "experiment",
                as: "survey"
            }
        }, {
            $project: projections
        }]).exec(function(err, results) {
            if (err) {

                cb(err, null);
            } else {
                var newResult = [];

                results.forEach(function(result) {
                    // var endResult = {};
                    // endResult['datetime'] = new Date(result.exp_processingEndTime);
                    // if (result[param] > 0) {
                    //     endResult[param] = result[param] * scale;
                    //     newResult.push(endResult);
                    // }

                    var endResult = {};
                    endResult['datetime'] = new Date(result.exp_processingEndTime);

                    if (result[param].length > 0 && result[param][0] > 0) {
                        endResult[param] = result[param].length > 0 ? Math.round(result[param][0]) : 0;
                        endResult['notes'] = result['notes'].length > 0 ? result['notes'][0] : "";
                        newResult.push(endResult);
                    }

                });

                cb(null, newResult);
            }
        })
    }

    workflow.on('scripterActivity', function() {
        getPerformance('scripterActivity', 'activity', req.params.id, req.query.start, req.query.end, 1 * 5 / 300, function(err, results) {
            if (err) {
                workflow.emit('exception', err);
            } else {

                workflow.outcome.results = workflow.outcome.results || [];
                workflow.outcome.results.push.apply(workflow.outcome.results, results);
                workflow.emit('scripterPopulation');
            }
        })
    });

    workflow.on('scripterPopulation', function() {
        getPerformance('scripterPopulation', 'population', req.params.id, req.query.start, req.query.end, 1 * 5 / 100, function(err, results) {
            if (err) {
                workflow.emit('exception', err);
            } else {
                workflow.outcome.results = workflow.outcome.results || [];
                workflow.outcome.results.push.apply(workflow.outcome.results, results);
                workflow.emit('scripterResponse');
            }
        })
    });

    workflow.on('scripterResponse', function() {
        getPerformance('scripterResponse', 'response', req.params.id, req.query.start, req.query.end, 1 * 4, function(err, results) {
            if (err) {
                workflow.emit('exception', err);
            } else {
                workflow.outcome.results = workflow.outcome.results || [];
                workflow.outcome.results.push.apply(workflow.outcome.results, results);
                workflow.emit('scripterRatings');
            }
        })
    });

    workflow.on('scripterRatings', function() {
        getRatings('', 'rating', req.params.id, req.query.start, req.query.end, 1, function(err, results) {
            if (err) {
                workflow.emit('exception', err);
            } else {
                workflow.outcome.results = workflow.outcome.results || [];
                workflow.outcome.results.push.apply(workflow.outcome.results, results);
                workflow.emit('response');
            }
        })
    });

    workflow.emit('scripterActivity');
};

exports.bio_unit_queue = function(req, res) {
    var workflow = req.app.utility.workflow(req, res);

    workflow.on('queue', function() {

        req.app.db.models.ListExperiment.getInstanceDocument(function(err, experiments) {
            if (err) {
                return workflow.emit('exception', err);
            }

            // var experiments = {
            //     "_lostList": [],
            //     "eug3": [{
            //         "user": {"id": {"$oid": "563abd7932804ebd6f70152e"}, "name": "casey", "groups": ["default"]},
            //         "session": {
            //             "id": {"$oid": "589256a7f6a172724853e9f2"},
            //             "sessionID": "Qgg229-BuB6JpnBBNjJj1Bv1Y3J4RZLf",
            //             "socketID": "yM1m4zF0uVn6-c7ZAAD_"
            //         },
            //         "bc_isLiveSendingToLab": false,
            //         "bc_startSendTime": null,
            //         "group_experimentType": "live",
            //         "exp_wantsBpuName": "eug3",
            //         "exp_metaData": {},
            //         "id": {"$oid": "58925c895953ebf648617610"},
            //         "exp_sessionID": null,
            //         "exp_status": "created",
            //         "exp_submissionTime": 1485889616950,
            //         "exp_eventsRunTime": 0,
            //         "exp_lastResort": {
            //             "canidateBpus": [{
            //                 "finalScore": 0.8255,
            //                 "queueWaitTime": 14085,
            //                 "magnification": 4,
            //                 "scripterActivity": 234.95513890539127,
            //                 "scripterPopulation": 177.31614252870125,
            //                 "scripterResponse": 1.5251098415459459,
            //                 "alphaTime": 0.8498322510870702,
            //                 "alphaPopulation": 0.5674116560918442,
            //                 "alphaActivity": 1,
            //                 "alphaResponse": 1,
            //                 "bpuName": "eug3",
            //                 "totalWaitTime": 14085
            //             }],
            //             "rejectionCounter": 0,
            //             "rejectionReason": null,
            //             "bpuName": "eug3",
            //             "runTime": null,
            //             "bpuProcessingTime": null,
            //             "totalWaitTime": 14085
            //         }
            //     }],
            //     "newExps": [{
            //         "user": {
            //             "id": {"$oid": "5887aaac6e940b815f8dd9f9"},
            //             "name": "QuinnMonahan",
            //             "groups": ["default"]
            //         },
            //         "session": {
            //             "id": {"$oid": "5887aaad6e940b815f8dd9fb"},
            //             "sessionID": "-Yrsiql84ts19sEu4WDK7RKr1x-D0biR",
            //             "socketID": "QJkffJyx-KubC_qkAABZ"
            //         },
            //         "bc_isLiveSendingToLab": false,
            //         "bc_startSendTime": null,
            //         "group_experimentType": "batch",
            //         "exp_wantsBpuName": "eug3",
            //         "exp_metaData": {},
            //         "id": {"$oid": "5890e0500096719c68e2534e"},
            //         "exp_sessionID": null,
            //         "exp_status": "created",
            //         "exp_submissionTime": 1485889616832,
            //         "exp_eventsRunTime": 0,
            //         "exp_lastResort": {
            //             "canidateBpus": [{
            //                 "finalScore": 0.7449,
            //                 "queueWaitTime": 0,
            //                 "magnification": 10,
            //                 "scripterActivity": 141.12632858114182,
            //                 "scripterPopulation": 14.929327728354595,
            //                 "scripterResponse": 0.9451034179001743,
            //                 "alphaTime": 1,
            //                 "alphaPopulation": 0.2985865545670919,
            //                 "alphaActivity": 1,
            //                 "alphaResponse": 0.6300689452667828,
            //                 "bpuName": "eug1",
            //                 "totalWaitTime": 0
            //             }],
            //             "rejectionCounter": 10,
            //             "rejectionReason": "2:checkExpAndResort BpuExperiment.findById error:Incorrect status, should alreay be out of queue",
            //             "bpuName": "eug1",
            //             "runTime": null,
            //             "bpuProcessingTime": null,
            //             "totalWaitTime": 0
            //         }
            //     }]
            // };

            // console.log(experiments.newExps);
            // console.log(experiments[req.params.name] || []);

            workflow.outcome.running = experiments['newExps']
                .filter(function(experiment) {
                    return experiment.exp_wantsBpuName == req.params.name;
                })
                .map(function(experiment) {
                    return {
                        'id': experiment._id,
                        'user': experiment.user.name,
                        'type': experiment.group_experimentType,
                        'submittedAt': experiment.exp_submissionTime,
                        'runTime': experiment.exp_eventsRunTime,
                        'status': 'in progress'
                    }
                });

            workflow.outcome.pending = (experiments[req.params.name] || [])
                .filter(function(experiment) {
                    return experiment.exp_wantsBpuName == req.params.name;
                })
                .map(function(experiment) {
                    return {
                        'id': experiment._id,
                        'bpu': req.params.name,
                        'user': experiment.user.name,
                        'type': experiment.group_experimentType,
                        'submittedAt': experiment.exp_submissionTime,
                        'runTime': experiment.exp_eventsRunTime,
                        'status': 'pending'
                    }
                });

            return workflow.emit('response');
        });
    });

    workflow.emit('queue');
};

exports.add_note = function(req, res) {
    var workflow = req.app.utility.workflow(req, res);

    console.log(req.user);

    workflow.on('validate', function() {
        if (!req.body.message) {
            workflow.outcome.errors.push('Message is required.');
            return workflow.emit('response');
        }

        workflow.emit('addNote');
    });

    workflow.on('addNote', function() {

        var noteToAdd = {
            data: req.body.message,
            userCreated: {
                id: req.user.id,
                name: req.user.username,
                time: new Date().toISOString()
            }
        };

        req.app.db.models.Bpu.findByIdAndUpdate(req.params.id, {
            $push: {
                notes: noteToAdd
            }
        }, {
            new: true
        }, function(err, bpu) {
            if (err) {
                return workflow.emit('exception', err);
            }

            workflow.outcome.notes = bpu.notes;
            return workflow.emit('response');
        });
    });

    workflow.emit('validate');
};

exports.remove_note = function(req, res) {
    var workflow = req.app.utility.workflow(req, res);

    workflow.on('removeNote', function() {

        req.app.db.models.Bpu.findByIdAndUpdate(req.params.id, {
            $pull: {
                notes: {
                    _id: req.params.noteId
                }
            }
        }, {
            safe: true,
            new: true
        }, function(err, bpu) {
            if (err) {
                return workflow.emit('exception', err);
            }

            workflow.outcome.notes = bpu.notes;
            return workflow.emit('response');
        });
    });

    workflow.emit('removeNote');
};


// d) MP -> API : POST /api/experiment/ (Choose BPU to experiment with)
// 	Response: experimentID, queueID and waitTime


// e) MP -> API : GET /api/experiment/{id}/status/ (Get status of experiment)
// 	Response: status and waitTime
exports.get_experiment_status = function(req, res) {
    /*
     
     */
};

// f) MP -> API : GET /api/experiment/{id}/filter={type of data} (Get data from experiment)
// 	Response: zip file with all filtered data
exports.get_experiment_detail = function(req, res) {
    // /account/joinlabwithdata/download/58014fd349a92e241293f04c/
};

exports.find = function(req, res) {
    var outcome = {
        joinQueueDataObj: req.app.db.models.BpuExperiment.getDataObjToJoinQueue()
    };

    outcome.session = null;
    var getSession = function(callback) {
        var sessUpdate = {
            url: req.url,
            sessionID: req.sessionID,
            user: {
                id: req.user.id,
                name: req.user.username,
                groups: req.user.groups,
            },
            isVerified: false,
        };
        req.app.db.models.Session.findOneAndUpdate({
            sessionID: req.sessionID
        }, sessUpdate, {
            new: true
        }, function(err, doc) {
            if (err) {
                return callback('getSession:' + err);
            } else if (doc === null || doc === undefined) {
                var sessInfo = {
                    url: req.url,
                    sessionID: req.sessionID,
                    user: {
                        id: req.user.id,
                        name: req.user.username,
                        groups: req.user.groups,
                    },
                };
                req.app.db.models.Session.makeNewSession(sessInfo, function(err, newDoc) {
                    if (err) {
                        return callback('getSession:' + err);
                    } else {
                        outcome.session = newDoc;
                        return callback(null);
                    }
                });
            } else {
                outcome.session = doc;
                return callback(null);
            }
        });
    };

    outcome.user = null;
    var getUser = function(callback) {
        req.app.db.models.User.findById(outcome.session.user.id, 'username  groups').exec(function(err, doc) {
            if (err) {
                return callback('getUser:' + err);
            } else if (doc === null || doc === undefined) {
                return callback('getUser:' + 'dne');
            } else {
                outcome.user = doc;
                return callback(null);
            }
        });
    };

    outcome.bpus = null;
    outcome.bpuJadeObjects = [];
    var getBpus = function(callback) {
        var query = req.app.db.models.Bpu.find({
            isOn: true,
            allowedGroups: {
                $in: outcome.user.groups
            },
        });
        query.select('isOn bpuStatus index name magnification allowedGroups localAddr publicAddr bpu_processingTime session liveBpuExperiment performanceScores');
        query.exec(function(err, docs) {
            if (err) {
                return callback('getBpus:' + err);
            } else if (docs === null || docs === undefined) {
                return callback('getBpus:' + 'dne');
            } else {
                outcome.bpus = docs;

                //Make Jade Object for each bpu
                outcome.bpus.forEach(function(bpu) {
                    var bpuJadeObj = {};
                    bpuJadeObj.name = bpu.name;
                    bpuJadeObj.index = bpu.index;

                    bpuJadeObj.titleLabelJadeName = 'BpuTitleLabel' + bpu.index;
                    bpuJadeObj.titleLabel = bpu.name + ', User:None';

                    bpuJadeObj.userLabelJadeName = 'BpuUserLabel' + bpu.index;
                    bpuJadeObj.userLabel = 'Time Left:0 seconds';

                    bpuJadeObj.statusLabelJadeName = 'BpuStatusLabel' + bpu.index;
                    bpuJadeObj.statusLabel = 'Status:' + 'Unknown';

                    bpuJadeObj.timeLabelJadeName = 'BpuTimeLabel' + bpu.index;
                    bpuJadeObj.timeLabel = 'Time:? sec';

                    bpuJadeObj.joinLiveJadeName = 'bpuJoinLiveButton' + bpu.index; //do not change used in client

                    bpuJadeObj.submitTextJadeName = 'bpuSubmitTextButton' + bpu.index; //do not change used in client

                    bpuJadeObj.imageSrc = bpu.getWebSnapShotUrl();

                    outcome.bpuJadeObjects.push(bpuJadeObj);
                });
                return callback(null);
            }
        });
    };

    outcome.bpuWithExp = null;
    outcome.liveBpuExperiment = null;
    var checkBpusAgainstLiveSessionExperiment = function(callback) {
        for (var ind = 0; ind < outcome.bpus.length; ind++) {
            var bpu = outcome.bpus[ind];
            if (outcome.session.liveBpuExperiment && outcome.session.liveBpuExperiment.id && bpu.liveBpuExperiment && bpu.liveBpuExperiment.id) {
                if (outcome.session.liveBpuExperiment.id === bpu.liveBpuExperiment.id) {
                    outcome.bpuWithExp = bpu;
                    break;
                }
            }
        }
        if (outcome.bpuWithExp) {
            return callback('send to lab');
        } else {
            return callback(null);
        }
    };

    var getExperimentData = function(callback) {
        req.query.wasDataProcessed = req.query.wasDataProcessed ? req.query.wasDataProcessed : true;
        req.query.isRunOver = req.query.isRunOver ? req.query.isRunOver : true;
        req.query.limit = req.query.limit ? parseInt(req.query.limit, null) : 20;
        req.query.page = req.query.page ? parseInt(req.query.page, null) : 1;
        req.query.sort = req.query.sort ? req.query.sort : '-_id';

        var filters = {}; //filters is the first object givne to the db.model.collection.find(filters, ..);
        filters['user.name'] = req.user.username;
        filters['exp_status'] = 'finished';
        req.app.db.models.BpuExperiment.pagedFind({
            filters: filters,
            keys: '',
            limit: req.query.limit,
            page: req.query.page,
            sort: req.query.sort
        }, function(err, results) {
            if (err) {
                return next(err);
            }
            outcome.results = results;
            if (req.xhr) {
                res.header("Cache-Control", "no-cache, no-store, must-revalidate");
                results.filters = req.query;
                res.send(results);
            }
            outcome.results.filters = req.query;
            return callback(null);
        });
    };

    outcome.data = null;
    var buildClientSideData = function(callback) {
        outcome.data = {
            results: JSON.stringify(outcome.results),
            user: JSON.stringify(outcome.user),
            bpus: escape(JSON.stringify(outcome.bpus)),
            session: escape(JSON.stringify(outcome.session)),
            joinQueueDataObj: escape(JSON.stringify(outcome.joinQueueDataObj)),
            eugs: outcome.bpuJadeObjects,
        };
        return callback(null);
    };
    //Build Init Series
    var initSeriesFuncs = [];
    initSeriesFuncs.push(getSession);
    initSeriesFuncs.push(getUser);
    initSeriesFuncs.push(getBpus);
    initSeriesFuncs.push(checkBpusAgainstLiveSessionExperiment);
    initSeriesFuncs.push(getExperimentData);
    initSeriesFuncs.push(buildClientSideData);
    //Run Init Series
    async.series(initSeriesFuncs, function(err) {
        if (err) {
            return next(err);
        } else {
            //console.log(outcome.data);
            res.render('account/joinlabwithdata/index', {
                data: outcome.data
            });
        }
    });
};

exports.listExperiments = function(req, res) {
    var workflow = req.app.utility.workflow(req, res);

    workflow.on('find', function() {
        req.query.search = req.query.search ? req.query.search : '';
        req.query.status = req.query.status ? req.query.status : '';
        req.query.limit = req.query.limit ? parseInt(req.query.limit, null) : 20;
        req.query.page = req.query.page ? parseInt(req.query.page, null) : 1;
        req.query.sort = req.query.sort ? req.query.sort : '_id';

        var filters = {};
        if (req.query.search) {
            filters.search = new RegExp('^.*?' + req.query.search + '.*$', 'i');
        }

        if (req.query.status) {
            filters['exp_status'] = req.query.status;
        }

        req.app.db.models.BpuExperiment.pagedFind({
            filters: filters,
            keys: 'name user group_experimentType exp_submissionTime exp_wantsBpuName exp_eventsToRun exp_status' +
                ' exp_metaData tag',
            limit: req.query.limit,
            page: req.query.page,
            sort: req.query.sort
        }, function(err, results) {
            if (err) {
                return workflow.emit('exception', err);
            }

            var data = _.map(results.data, function(result) {
                var newResult = {};

                newResult.id = result._id;
                newResult.name = result.name;
                newResult.username = result.user.name;
                newResult.type = result.group_experimentType;
                newResult.submittedAt = result.exp_submissionTime;
                newResult.bpu = result.exp_wantsBpuName;
                newResult.events = result.exp_eventsToRun;
                newResult.status = result.exp_status;
                newResult.metadata = result.exp_metaData;
                newResult.tag = result.tag;

                return newResult;
            });

            workflow.outcome.results = data;
            workflow.outcome.pages = results.pages;
            workflow.outcome.items = results.items;
            workflow.emit('response');
        });
    });

    workflow.emit('find');

};