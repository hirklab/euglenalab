"use strict";
var async=require('async');
var exec=require('child_process').exec;
var fs=require('fs');

var mongoose = require('mongoose');

var _getSocketFromAppIo=function(appIo, thisDocSocketID) {
  var clientIds=Object.keys(appIo.engine.clients);
  var userSocket=null;
  for(var ind=0;ind<clientIds.length;ind++) {
    if('/#'+thisDocSocketID===''+clientIds[ind]) {
      if(appIo.sockets.sockets['/#'+thisDocSocketID]) userSocket=appIo.sockets.sockets['/#'+thisDocSocketID]; 
      if(appIo.sockets.sockets[''+thisDocSocketID]) userSocket=appIo.sockets.sockets[''+thisDocSocketID]; 
      break;
    }
    if(''+thisDocSocketID===''+clientIds[ind]) {
      if(appIo.sockets.sockets['/#'+thisDocSocketID]) userSocket=appIo.sockets.sockets['/#'+thisDocSocketID]; 
      if(appIo.sockets.sockets[''+thisDocSocketID]) userSocket=appIo.sockets.sockets[''+thisDocSocketID]; 
      break;
    }
  }
  return userSocket;
};

var getDoc=function(app, data, callback) {
  if(data._id) {getDocById(app, data._id, callback);
  } else if(data.id) {getDocById(app, data.id, callback);
  } else if(data.name) {getDocByName(app, data.name, callback);
  } else if(data.username) {getDocByName(app, data.username, callback);
  } else {callback('User Schema:getDoc:err:'+'data(_id, id, name, username)', null);
  }
};
var getDocByName=function(app, name, callback) {
  app.db.models.User.findOne({username:name}, {}, function(err, mongoDoc) {
    if(err) {
      callback('User Schema:getDocByName:err:'+err, null);
    } else if(mongoDoc===null) {
      callback('User Schema:getDocByName:err:'+'was null', null);
    } else if(mongoDoc.username!==name) {
      callback('User Schema:getDocByName:err:'+'names do not match', null);
    } else {
      callback(null, mongoDoc);
    }
  });
};
var getDocById=function(app, id, callback) {
  app.db.models.User.findById(id, {}, function(err, mongoDoc) {
    if(err) {
      callback('User Schema:getDocById:err:'+err, null);
    } else if(mongoDoc===null) {
      callback('User Schema:getDocById:err:'+'was null', null);
    } else {
      callback(null, mongoDoc);
    }
  });
};


exports = module.exports = function(app) {

  var schema = new mongoose.Schema({
    //My Additions
    groups: { type: Array, default: [] },
    lastExperimentRunDate: { type: Date, default: new Date(0) },

    //Default
    username: { type: String, unique: true },
    password: String,
    email: { type: String, unique: true },
    roles: {
      admin: { type: mongoose.Schema.Types.ObjectId, ref: 'Admin' },
      account: { type: mongoose.Schema.Types.ObjectId, ref: 'Account' }
    },
    isActive: String,
    timeCreated: { type: Date, default: Date.now },
    resetPasswordToken: String,
    resetPasswordExpires: Date,
    twitter: {},
    github: {},
    facebook: {},
    google: {},
    tumblr: {},
    search: [String]
  });

  //Default
  schema.methods.canPlayRoleOf = function(role) {
    if (role === "admin" && this.roles.admin) {
      return true;
    }

    if (role === "account" && this.roles.account) {
      return true;
    }

    return false;
  };

  schema.methods.defaultReturnUrl = function() {
    var returnUrl = '/';
    if (this.canPlayRoleOf('account')) {
      returnUrl = '/account/';
    }

    if (this.canPlayRoleOf('admin')) {
      returnUrl = '/admin/';
    }

    return returnUrl;
  };
  schema.statics.encryptPassword = function(password, done) {
    var bcrypt = require('../../../server/node_modules/bcrypt');
    bcrypt.genSalt(10, function(err, salt) {
      if (err) {
        return done(err);
      }

      bcrypt.hash(password, salt, function(err, hash) {
        done(err, hash);
      });
    });
  };
  schema.statics.validatePassword = function(password, hash, done) {
    var bcrypt = require('../../../server/node_modules/bcrypt');
    bcrypt.compare(password, hash, function(err, res) {
      done(err, res);
    });
  };
  schema.plugin(require('./plugins/pagedFind'));
  schema.index({ username: 1 }, { unique: true });
  schema.index({ email: 1 }, { unique: true });
  schema.index({ timeCreated: 1 });
  schema.index({ 'twitter.id': 1 });
  schema.index({ 'github.id': 1 });
  schema.index({ 'facebook.id': 1 });
  schema.index({ 'google.id': 1 });
  schema.index({ search: 1 });
  schema.set('autoIndex', app.config.isDevelopment);
  return schema;

};
