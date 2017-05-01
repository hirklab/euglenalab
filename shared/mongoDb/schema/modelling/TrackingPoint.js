"use strict";
exports = module.exports = function(app, mongoose) {
  var theSchema = new mongoose.Schema({
    image:{type:mongoose.Schema.Types, ref:'ModelParameters'},
    x:{type:Number, default:null},
    y:{type:Number, default:null},
  });
  app.db.model('TrackingPoint', theSchema);
};
