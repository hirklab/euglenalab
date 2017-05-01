'use strict';

exports = module.exports = function(app, mongoose) {
  var theScheme = new mongoose.Schema({
    account: {
      id: { type: mongoose.Schema.Types.ObjectId, ref: 'Account' },
    },
    user: {
      id: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
      name: { type: String, default: '' },
    },
    imageset: {
      id: { type: mongoose.Schema.Types.ObjectId, ref: 'ImageSet' },
    },
    req: { 
      sessionID:{type:String, default:''},  
      url:{type:String, default:''},     
      remoteAddress:{type:String, default:''},  
      startTime:{type:String, default:''},  
    },

    serverTag:{type:String, default:''},  
    serverTab:{type:String, default:''},  
    dayTag:{type:String, default:''},  

    times:{type:Array, default:[]},
    
    clientSocketID:{type:String, default:''},
  });
  app.db.model('LabSession', theScheme);
};
