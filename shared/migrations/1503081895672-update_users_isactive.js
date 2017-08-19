'use strict';

module.exports.id = "update_users_isActive";

module.exports.up = function (done) {
	// use this.db for MongoDB communication, and this.log() for logging
	this.db.collection('users').updateMany({
		isActive: 'yes'
	}, {
		$set: {isActive: true}
	});

	this.db.collection('users').updateMany({
		isActive: 'no'
	}, {
		$set: {isActive: false}
	});

	this.db.collection('users').updateMany({
		isActive: {$exists: false}
	}, {
		$set: {isActive: true}
	});

	done();
};

module.exports.down = function (done) {
	// use this.db for MongoDB communication, and this.log() for logging
	done();
};