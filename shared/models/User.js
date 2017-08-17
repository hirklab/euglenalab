"use strict";
var bcrypt = require('bcrypt');

exports = module.exports = function (app, mongoose) {
	var schema = new mongoose.Schema({
		username:            {type: String, unique: true},
		password:            String,
		name:                {type: String, unique: true},
		email:               {type: String, unique: true},
		role:                {
			type:    String,
			enum:    ['student', 'teacher', 'admin', 'machine'],
			default: 'student'
		},
		groups:              {type: Array, default: []},
		isActive:            {
			type:    Boolean,
			default: true
		},
		resetToken:          String,
		resetTokenExpiresAt: Date,
		search:              [String]
	});

	schema.methods.canPlayRoleOf = function (role) {
		return role == this.role;
	};

	schema.statics.encryptPassword = function (password, done) {
		bcrypt.genSalt(10, function (err, salt) {
			if (err) {
				return done(err);
			}

			bcrypt.hash(password, salt, function (err, hash) {
				done(err, hash);
			});
		});
	};

	schema.statics.validatePassword = function (password, hash, done) {
		bcrypt.compare(password, hash, function (err, res) {
			done(err, res);
		});
	};

	schema.plugin(require('./plugins/pagedFind'));
	schema.plugin(require('./plugins/timestamps'));

	schema.index({username: 1}, {unique: true});
	schema.index({email: 1}, {unique: true});
	schema.index({createdAt: 1});
	schema.index({search: 1});

	schema.set('autoIndex', app.config.isDevelopment);

	app.db.model('User', schema);
};
