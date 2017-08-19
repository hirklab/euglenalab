'use strict';

var mongoose = require('mongoose');
var schema   = new mongoose.Schema({
	name:        {type: String, default: 'default'},
	description: {type: String, default: 'default'},
	users:       {type: Array, default: []}
});

schema.plugin(require('./plugins/pagedFind'));
schema.plugin(require('./plugins/timestamps'));

schema.index({name: 1});

// schema.set('autoIndex', app.config.isDevelopment);

schema.statics.getAllGroups = function (callback) {
	var allGroups = [];

	app.db.models.Group.find({}, {name: 1}, function (err, docs) {
		if (err || docs === null) {
			callback(err, null);
		} else {
			docs.forEach(function (grp) {
				allGroups.push(grp.name);
			});

			callback(null, allGroups);
		}
	});
};

module.exports = schema;

