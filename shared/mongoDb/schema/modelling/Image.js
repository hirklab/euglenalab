"use strict";
exports = module.exports = function(app, mongoose) {
  var theSchema = new mongoose.Schema({
    imageset: {
      id:{type:mongoose.Schema.Types.ObjectId, ref:'ModelImageSet'}
    },
    filename:{type:String, default:''},
    filepath:{type:String, default:''},

    displayName:{type:String, default:'No Data'},
  
    index:{type:Number, default:-1},
    timestamp:{type:Number, default:-1},
    relativeTimeToImageZero:{type:Number, default:-1}, //Time since first image in the associated image set
  });
  app.db.model('Image', theSchema);
};
