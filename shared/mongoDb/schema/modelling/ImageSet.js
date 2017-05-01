"use strict";
exports = module.exports = function(app, mongoose) {
  var imageSetSchema = new mongoose.Schema({
    user: {
      id: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
      name: { type: String, default: '' },
    },
    
    path:{type:String, default:''},
    folderName:{type:String, default:''},
    displayName:{type:String, default:'No Data'},
    
    imageSetKeys: { type: Array, default: [] },

    images:{type:Array, default:[]},
    imageIndex:{type:Number, default:0},
    activeImage: {
      displayName:{type:String, default:'No Data'},
      frameNumber:{type:Number, default:0},
      frameTime:{type:Number, default:0},
      filename:{type:String, default:''},
      timestamp:{type:Number, default:0},
    }, 
    

    texts:{type:Array, default:[]},

    lightDataPath:{type:String, default:''},
    lightDataName:{type:String, default:''}, //text file name with out extenstion at the end of lightdatapath

    lightData:{type:Array, default:[]},
    lightDataIndex:{type:Number, default:0},
    activeLightData: {
      imageFrameNumber:{type:Number, default:0},
      displayName:{type:String, default:'No Data'},
      frameNumber:{type:Number, default:0},
      frameTime:{type:Number, default:0},
      timestamp:{type:Number, default:0},
      angle:{type:Number, default:0},
      intensity:{type:Number, default:0},
    },

    setpaths:{type:Array, default:[]}, 

    imageIntervalPerSecond:{type:Number, default:1},
    imagePlayBackPct:{type:Number, default:10},
  });
  app.db.model('ImageSet', imageSetSchema);
};
