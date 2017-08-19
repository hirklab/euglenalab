'use strict';

module.exports.id = "update_users_rename_fields";

module.exports.up = function (done) {
	// use this.db for MongoDB communication, and this.log() for logging
	this.db.collection('users').update({}, { $rename: {
		"timeCreated": "createdAt",
		"resetPasswordExpires": "resetTokenExpiresAt",
		"resetPasswordToken": "resetToken"
	}}, {upsert:false, multi:true}, done);
};

module.exports.down = function (done) {
	// use this.db for MongoDB communication, and this.log() for logging
	done();
};