'use strict';

module.exports.id = "remove_status";

module.exports.up = function (done) {
  // use this.db for MongoDB communication, and this.log() for logging
	var that = this;
	this.db.collection('status').drop(done);
};

module.exports.down = function (done) {
  // use this.db for MongoDB communication, and this.log() for logging
  done();
};