var logger = require('./logging');

function User(id, username, sockets, sessionID) {
	this._id = id;
	this.username = username;
	this.sockets = sockets || [];
	this.sessionID = sessionID;
}

User.prototype.addSocket = function(socket) {
	this.sockets.push(socket);
};

User.prototype.numSockets = function() {
	return this.sockets.length;
}

User.prototype.removeDisconnectedSockets = function() {
	this.sockets = _.reject(this.sockets, function(d) {
		return !d.connected;
	});
};

User.prototype.hasSocket = function(socket) {
	return _.find(this.sockets, function(available) {
		return available.id === socket.id;
	});
}

module.exports = User;