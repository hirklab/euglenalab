'use strict';

module.exports.id = "update_bpu_fields";

module.exports.up = function (done) {
  // use this.db for MongoDB communication, and this.log() for logging
	this.db.collection('bpus').update({}, { $rename: {
		"isOn": "isActive",
		"bpuStatus": "status"
	}}, {upsert:false, multi:true}, done);
};

module.exports.down = function (done) {
  // use this.db for MongoDB communication, and this.log() for logging
  done();
};