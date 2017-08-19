'use strict';

module.exports.id = "remove_accounts";

module.exports.up = function (done) {
  // use this.db for MongoDB communication, and this.log() for logging
	var that = this;
	this.db.collection('accounts').drop(done);
};

module.exports.down = function (done) {
  // use this.db for MongoDB communication, and this.log() for logging
  done();
};