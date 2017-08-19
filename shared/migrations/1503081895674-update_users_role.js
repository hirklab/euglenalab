'use strict';

module.exports.id = "update_users_role";

module.exports.up = function (done) {
	// use this.db for MongoDB communication, and this.log() for logging
	var that = this;
	this.db.collection('users').find().snapshot().forEach(
		function (e) {
			// update document, using its own properties
			if (e.hasOwnProperty('roles')) {
				e.role = e.roles.hasOwnProperty('admin') && e.roles.admin ? 'admin' : 'student';
			}
			// remove old properties
			delete e.socketID;
			delete e.sessionStartTime;
			delete e.sessionsLastX;
			delete e.allGroups;
			delete e.lastGraphBuildDate;
			delete e.lastTimeSent;
			delete e.liveBpu;
			delete e.liveBpuExperiment;
			delete e.lastExperimentRunDate;
			delete e.currentBpu;
			delete e.roles;
			delete e.sessionID;
			delete e.socketHandle;
			delete e.lastXSessions;
			delete e.scripts;
			delete e.textBpuExperiments;
			delete e.experiments;
			delete e.autoUserType;
			delete e.autoUserStats;
			delete e.avgUseStats;
			delete e.autoUserLabelY;
			delete e.autoUserEventsToRun;
			delete e.autoUserEventsToRun;

			// save the updated document
			that.db.collection('users').save(e);
		}, done
	);

};

module.exports.down = function (done) {
	// use this.db for MongoDB communication, and this.log() for logging
	done();
};