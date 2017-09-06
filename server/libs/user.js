var logger = require('./logging');

function User(id, username, sockets, sessionID){
	this._id  = id;
	this.username = username;
	this.sockets = sockets || [];
	this.sessionID = sessionID;
}

module.exports = User;