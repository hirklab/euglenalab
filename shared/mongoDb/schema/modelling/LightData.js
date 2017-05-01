"use strict";
exports = module.exports = function(app, mongoose) {
  var theSchema = new mongoose.Schema({
    imageset: {
      id:{type:mongoose.Schema.Types.ObjectId, ref:'ModelImageSet' },
    },
    filename:{type:String, default:''},
    filepath:{type:String, default:''},

    displayName:{type:String, default:'No Data'},
    
    index:{type:Number, default:-1},
    timestamp:{type:Number, default:-1},
    relativeTimeToLightDataZero:{type:Number, default:-1},   //Time since the first light data in this set
    relativeTimeToImageZero:{type:Number, default:-1}, //Time since first image in the associated image set

 
    ledTop1:{type:Number, default:0},
    ledRight2:{type:Number, default:0},
    ledBottom3:{type:Number, default:0},
    ledLeft4:{type:Number, default:0},
  });
  app.db.model('LightData', theSchema);
};
