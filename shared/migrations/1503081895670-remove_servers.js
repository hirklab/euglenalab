'use strict';

module.exports.id = "remove_servers";

module.exports.up = function (done) {
  // use this.db for MongoDB communication, and this.log() for logging
	var that = this;
	this.db.collection('servers').drop(function (err) {
		if (err) {
			that.log(err);
		}
		done();
	});
};

module.exports.down = function (done) {
  // use this.db for MongoDB communication, and this.log() for logging
  done();
};