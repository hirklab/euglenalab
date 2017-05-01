'use strict';

exports = module.exports = function(app, mongoose) {
  var userSessionSchema = new mongoose.Schema({
    
    user: {
      id: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
      name: { type: String, default: '' },
    },
   
    sessionID:{type:String, default:''},  //From the passport req
    startTime:{type:String, default:''},  //From the passport req
    logins:{type: Array, default: []},
   

  });
  app.db.model('UserSession', userSessionSchema);
};
