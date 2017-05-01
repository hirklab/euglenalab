"use strict";
exports = module.exports = function(app, mongoose) {
  var theSchema = new mongoose.Schema({
    
    description:{type:String, default:'No Data'},
    
    folderPath:{type:String, default:''},
    folderName:{type:String, default:''},
    
    displayName:{type:String, default:'No Data'},
    
    images:[mongoose.modelSchemas.Image],
    activeImageIndex:{type:Number, default:0},

    lightdata:[mongoose.modelSchemas.LightData],
    activeLightDataIndex:{type:Number, default:0},

    otherFiles:{type:Array, default:[]},

    trackingPoints:[mongoose.modelSchemas.TrackingPoint],
  });
  app.db.model('ModelImageSet', theSchema);
};
