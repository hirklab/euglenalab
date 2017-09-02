var exec       = require('child_process').exec;

module.exports = {
	command: function(cmd, callback) {
		exec(cmd, function(error, stdout, stderr) {
			if (error !== null) {
				callback(error, stdout);
			} else if (stderr) {
				callback(stderr, stdout);
			} else if (stdout) {
				callback(null, stdout);
			} else {
				callback(null, null);
			}
		});
	}
};