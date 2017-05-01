"use strict";
exports = module.exports = function(app, mongoose) {
  var theSchema = new mongoose.Schema({
    creationTime: {
      type: Number,
      default: new Date().getTime()
    },
    saveType: {
      type: String,
      enum: ['default', 'renderRefresh', 'runModelClick', 'startOverClick', 'refresh'],
      default: 'default'
    },

    user: {
      id: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
      },
      name: {
        type: String,
        default: ''
      },
      sessionID: {
        type: String,
        default: ''
      },
    },
    imageset: {
      id: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'ImageSet'
      },
      folderName: {
        type: String,
        default: ''
      },
    },
    setpath: {
      id: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'SetPath'
      },
      pathName: {
        type: String,
        default: '0:0'
      },
    },

    userStudyId: {
      type: String,
      default: 'Default'
    },

    modelCase: {
      type: Number,
      default: 3
    },
    modelDescription: {
      type: String,
      default: 'Default'
    },

    displayName: {
      type: String,
      default: 'Default'
    },

    length: {
      type: Number,
      default: 38
    },
    diameter: {
      type: Number,
      default: 8
    },
    x: {
      type: Number,
      default: 330
    },
    y: {
      type: Number,
      default: 228
    },
    zRot: {
      type: Number,
      default: -0.9
    },
    pitch: {
      type: Array,
      default: [0]
    },
    yaw: {
      type: Array,
      default: [0]
    },
    std: {
      type: Number,
      default: -1
    },

    // surge:{type:Array, default:[10]},
    // roll:{type:Array, default:[4]},
    // coupling:{type:Number, default:-3},

    surge: {
      type: Number,
      default: [60]
    },
    roll: {
      type: Number,
      default: [4]
    },
    coupling: {
      type: Number,
      default: -3
    },

    //coupling:{type:Array, default:[-3]},
    surgeName: {
      type: Array,
      default: []
    },
    couplingName: {
      type: Array,
      default: []
    },
    rollName: {
      type: Array,
      default: []
    },

  });
  app.db.model('ModelParameters', theSchema);
};