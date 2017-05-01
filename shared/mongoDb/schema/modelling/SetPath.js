"use strict";
exports = module.exports = function(app, mongoose) {
  var setPathSchema = new mongoose.Schema({
    user: {
      id: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
      },
      name: {
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

    displayName: {
      type: String,
      default: 'Default'
    },

    pathName: {
      type: String,
      default: '0:0'
    },

    points: {
      type: Array,
      default: [{
        displayName: 'Default'
      }]
    },

    pointIndex: {
      type: Number,
      default: 0
    },

    activePoint: {
      displayName: {
        type: String,
        default: 'Default'
      },
      frameNumber: {
        type: Number,
        default: 0
      },
      frameTime: {
        type: Number,
        default: 0
      },
      filename: {
        type: String,
        default: ''
      },
      timestamp: {
        type: Number,
        default: 0
      },
      x: {
        type: Number,
        default: 0
      },
      y: {
        type: Number,
        default: 0
      },
    },

  });
  app.db.model('SetPath', setPathSchema);
};