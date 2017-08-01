'use strict';
var mongoose = require('mongoose');


var schemaName='Group';
var getDocByName=function(app, name, callback) {
  app.db.models.User.findOne({username:name}, {}, function(err, mongoDoc) {
    if(err) {
      callback(schemaName+' Schema:getDocByName:err:'+err, null);
    } else if(mongoDoc===null) {
      callback(schemaName+' Schema:getDocByName:err:'+'was null', null);
    } else if(mongoDoc.username!==name) {
      callback(schemaName+' Schema:getDocByName:err:'+'names do not match', null);
    } else {
      callback(null, mongoDoc);
    }
  });
};
var getDocById=function(app, id, callback) {
  app.db.models.User.findById(id, {}, function(err, mongoDoc) {
    if(err) {
      callback(schemaName+' Schema:getDocById:err:'+err, null);
    } else if(mongoDoc===null) {
      callback(schemaName+' Schema:getDocById:err:'+'was null', null);
    } else {
      callback(null, mongoDoc);
    }
  });
};
exports = module.exports = function(app) {
  var schema = new mongoose.Schema({
    name: { type: String, default: 'default' },
    description: { type: String, default: 'default' },
    users: { type: Array, default: [] },
    settings: {
      doSaveImages: { type: Boolean, default: true },
      doSaveLightData: { type: Boolean, default: true },
      doMakeVideo: { type: Boolean, default: false },
      
      doAllowTextFile: { type: Boolean, default: true },
      doAllowLive: { type: Boolean, default: true },
      doAllowScript: { type: Boolean, default: false },
      
      doClientSideImageSave: { type: Boolean, default: false },
      doClientSideLightDataSave: { type: Boolean, default: false },
    },
  });
  schema.plugin(require('./plugins/pagedFind'));
  schema.index({ name: 1 });
  schema.set('autoIndex', app.config.isDevelopment);


  schema.statics.getAllGroups=function(callback) {
    var allGroups=[];
    app.db.models.Group.find({}, {name:1}, function(err, mongoDocs) {
      if(err) {
        callback(schemaName+' Schema:getAllGroups:err:'+err, null);
      } else if(mongoDocs===null) {
        callback(schemaName+' Schema:getAllGroups:err:'+'was null', null);
      } else {
        mongoDocs.forEach(function(grp) {
          allGroups.push(grp.name);
        });
        callback(null, allGroups);
      }
    });
  };

    return schema;
};
