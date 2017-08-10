var _app = null;
var _fs = null;
var _exec = null;

var assert = require('assert');
var path = require('path');
var filename = path.basename(__filename);

exports = module.exports = function (app, deps, options, mainCallback) {
	var moduleName = filename;

	//Assert Deps
	if (app === null) {
		mainCallback('need app object');

	} else if (deps.async === null) {
		mainCallback('need async module');
	} else if (deps.fs === null) {
		mainCallback('need fs module');
	} else if (deps.exec === null) {
		mainCallback('need exec object');

	} else {

		_app = app;
		_fs = deps.fs;
		_exec = deps.exec;

		app.bpuStatus = app.bpuStatusTypes.reseting;

		//Check Options
		var o_doFlushFlag = options.doFlushFlag || false;
		var o_flushTime = options.flushTime || 20 * 1000;


	}
};

