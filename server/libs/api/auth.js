'use strict';

var router = require('express').Router();

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
var register = function(req, res) {
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
var login = function(req, res) {
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

            // console.log(user.username);

            req.login(user, function(err) {
                if (err) {
                    return workflow.emit('exception', err);
                }

                var payload = {
                    id: user._id
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

router.post('/register/', register);
router.post('/login/', login);

module.exports = router;