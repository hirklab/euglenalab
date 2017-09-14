'use strict';

var router = require('express').Router();

var jwt      = require('jsonwebtoken');
var _        = require('lodash');
var mongoose = require('mongoose');

var workflow = require('../utils/workflow');


// a) MP -> API : POST /api/auth/register/ (Register user)
// {
//   username: '',
//   email:'',
//   password:''
// }
// Response -> user: {id, username, email, createdAt}
var register = function (req, res) {
	var workflow = workflow(req, res);

	workflow.on('validate', function () {
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

	workflow.on('duplicateUsernameCheck', function () {
		req.app.db.models.User.findOne({
			username: req.body.username
		}, function (err, user) {
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

	workflow.on('duplicateEmailCheck', function () {
		req.app.db.models.User.findOne({
			email: req.body.email.toLowerCase()
		}, function (err, user) {
			if (err) {
				return workflow.emit('exception', err);
			}

			if (user) {
				workflow.outcome.errfor.email = 'email already taken';
				return workflow.emit('response');
			}

			workflow.emit('createUser');
		});
	});

	workflow.on('createUser', function () {
		req.app.db.models.User.encryptPassword(req.body.password, function (err, hash) {
			if (err) {
				return workflow.emit('exception', err);
			}

			//add user to default group
			req.app.db.models.Group.findOne({
				name: 'default'
			}, function (err, dGroup) {
				if (dGroup === null) {
					dGroup = req.app.db.models.Group();
					dGroup.save();
				}

				//finish original
				var fieldsToSet = {
					isActive: true,
					username: req.body.username,
					email:    req.body.email.toLowerCase(),
					password: hash,
					role:     'student',
					groups:   [dGroup.name],
					search:   [
						req.body.username,
						req.body.email
					]
				};

				req.app.db.models.User.create(fieldsToSet, function (err, user) {
					if (err) {
						return workflow.emit('exception', err);
					}

					dGroup.users.push(user.username);

					req.app.db.models.Group.findOneAndUpdate({
						name: dGroup.name
					}, {
						users: dGroup.users
					}, function (err, dGroup) {
						if (err) {
							return workflow.emit('exception', err);
						}

						workflow.outcome.user = {
							id:        user._id,
							username:  user.username,
							email:     user.email,
							createdAt: user.createdAt
						};

						workflow.emit('response');
					});
				});
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
var login = function (req, res) {
	var workflow = workflow(req, res);

	workflow.on('validate', function () {
		if (!req.body.username) {
			workflow.outcome.errfor.username = 'required';
		}

		if (!req.body.password) {
			workflow.outcome.errfor.password = 'required';
		}

		if (workflow.hasErrors()) {
			return workflow.emit('exception');
		}

		workflow.emit('attemptLogin');
	});

	workflow.on('attemptLogin', function () {
		req._passport.instance.authenticate('local', {session: false}, function (err, user, info) {
			if (err) {
				console.log(err);
				return workflow.emit('exception', err);
			}

			req.login(user, function (err) {
				if (err || workflow.hasErrors()) {
					console.log(err);

					return workflow.emit('exception', err);
				}

				var payload = {
					id: user._id
				};

				var secretOrKey = req.app.jwtOptions.secretOrKey;
				var token       = jwt.sign(payload, secretOrKey, {
					expiresIn: 24 * 60 * 60 // 1 day
				});

				workflow.outcome.user = {
					id:        user._id,
					username:  user.username,
					email:     user.email,
					createdAt: user.createdAt,
					role:      user.role,
					isAdmin:   (user.role != null && user.role == 'admin')
				};

				workflow.outcome.token = "JWT " + token;

				workflow.emit('response');
			});

		})(req, res);
	});

	workflow.emit('validate');
};

var forgot = function (req, res, next) {
	var workflow = workflow(req, res);

	workflow.on('validate', function () {
		if (!req.body.email) {
			workflow.outcome.errfor.email = 'required';
			return workflow.emit('response');
		}

		workflow.emit('generateToken');
	});

	workflow.on('generateToken', function () {
		var crypto = require('crypto');

		crypto.randomBytes(21, function (err, buf) {
			if (err) {
				return next(err);
			}

			var token = buf.toString('hex');

			req.app.db.models.User.encryptPassword(token, function (err, hash) {
				if (err) {
					return next(err);
				}

				workflow.emit('patchUser', token, hash);
			});
		});
	});

	workflow.on('patchUser', function (token, hash) {
		var conditions = {email: req.body.email.toLowerCase()};

		var fieldsToSet = {
			resetToken:          hash,
			resetTokenExpiresAt: Date.now() + 10000000
		};

		req.app.db.models.User.findOneAndUpdate(conditions, fieldsToSet, function (err, user) {
			if (err || workflow.hasErrors()) {
				return workflow.emit('exception', err);
			}

			if (!user) {
				return workflow.emit('response');
			}

			workflow.emit('sendEmail', token, user);
		});
	});

	workflow.on('sendEmail', function (token, user) {
		sendmail(req, res, {
			from:     req.app.config.smtp.from.name + ' <' + req.app.config.smtp.from.address + '>',
			to:       user.email,
			subject:  'Reset your ' + req.app.config.projectName + ' password',
			textPath: 'login/forgot/email-text',
			htmlPath: 'login/forgot/email-html',
			locals:   {
				username:    user.username,
				resetLink:   req.protocol + '://' + req.headers.host + '/login/reset/' + user.email + '/' + token + '/',
				projectName: req.app.config.projectName
			},
			success:  function (message) {
				workflow.emit('response');
			},
			error:    function (err) {
				workflow.outcome.errors.push('Error sending mail: ' + err);
				workflow.emit('response');
			}
		});
	});

	workflow.emit('validate');
};

var reset = function (req, res) {
	var workflow = workflow(req, res);

	workflow.on('validate', function () {
		if (!req.body.password) {
			workflow.outcome.errfor.password = 'required';
		}

		if (!req.body.confirm) {
			workflow.outcome.errfor.confirm = 'required';
		}

		if (req.body.password !== req.body.confirm) {
			workflow.outcome.errors.push('Passwords do not match.');
		}

		if (workflow.hasErrors()) {
			return workflow.emit('response');
		}

		workflow.emit('findUser');
	});

	workflow.on('findUser', function () {
		var conditions = {
			email:               req.params.email,
			resetTokenExpiresAt: {$gt: Date.now()}
		};
		req.app.db.models.User.findOne(conditions, function (err, user) {
			if (err || workflow.hasErrors()) {
				return workflow.emit('exception', err);
			}

			if (!user) {
				workflow.outcome.errors.push('Invalid request');
				return workflow.emit('response');
			}

			req.app.db.models.User.validatePassword(req.params.token, user.resetToken, function (err, isValid) {
				if (err || workflow.hasErrors()) {
					return workflow.emit('exception', err);
				}

				if (!isValid) {
					workflow.outcome.errors.push('Invalid request');
					return workflow.emit('response');
				}

				workflow.emit('patchUser', user);
			});
		});
	});

	workflow.on('patchUser', function (user) {
		req.app.db.models.User.encryptPassword(req.body.password, function (err, hash) {
			if (err) {
				return workflow.emit('exception', err);
			}

			var fieldsToSet = {password: hash, resetToken: ''};
			req.app.db.models.User.findByIdAndUpdate(user._id, fieldsToSet, function (err, user) {
				if (err) {
					return workflow.emit('exception', err);
				}

				workflow.emit('response');
			});
		});
	});

	workflow.emit('validate');
};


router.post('/register/', register);
router.post('/login/', login);
router.post('/forgot-password/', forgot);
router.post('/reset-password/', reset);

module.exports = router;