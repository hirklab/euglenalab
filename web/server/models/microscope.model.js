import Promise from 'bluebird';
import mongoose from 'mongoose';
import httpStatus from 'http-status';
import plugins from './plugins/index';

const ObjectId = mongoose.Schema.ObjectId;

/**
 * Microscope Schema
 */
const MicroscopeSchema = new mongoose.Schema({
  identification: {
    type: String,
    unique: true,
    required: true
  },

  name: {
    type: String,
    default: 'Unnamed'
  },

  isActive: {
    type: Boolean,
    default: false
  },

  status: {
    type: String,
    enum: [
      'unknown',
      'connecting',
      'idle',
      'queued',
      'running',
      'maintenance',
      'offline'
    ],
    default: 'unknown'
  },

  connected: {
    type: Boolean,
    default: false
  },

  magnification: { //for fixed, min=max=value
    value: {
      type: Number,
      default: 10
    },
    min: {
      type: Number,
      default: 0
    },
    max: {
      type: Number,
      default: 100
    },
  },

  backLight: { // use percentage
    value: {
      type: Number,
      default: 0
    },
    min: {
      type: Number,
      default: 0
    },
    max: {
      type: Number,
      default: 100
    },
  },

  ambientLight: { // use percentage
    value: {
      type: Number,
      default: 0
    },
    min: {
      type: Number,
      default: 0
    },
    max: {
      type: Number,
      default: 100
    },
  },

  internalRating: {
    type: Number,
    default: 0
  },

  externalRating: {
    type: Number,
    default: 0
  },

  localAddress: {
    ip: {
      type: String,
      default: ''
    },
    port: {
      type: String,
      default: ''
    },
    cameraPort: {
      type: String,
      default: ''
    },
  },

  publicAddress: {
    ip: {
      type: String,
      default: ''
    },
    port: {
      type: String,
      default: ''
    },
    cameraPort: {
      type: String,
      default: ''
    },
  }

});

/**
 * Index
 */
MicroscopeSchema.index({
  identification: 1
}, {
  unique: true
});
MicroscopeSchema.plugin(plugins.timestamps, {
  index: true
});
MicroscopeSchema.plugin(plugins.rest, {});


/**
 * Add your
 * - pre-save hooks
 * - validations
 * - virtuals
 */

/**
 * Methods
 */
MicroscopeSchema.method({});

/**
 * Statics
 */
MicroscopeSchema.statics = Object.assign(MicroscopeSchema.statics, {
  getOrCreate(identification, properties) {
    return this.findOneAndUpdate({
          identification: identification
        },
        properties, {
          upsert: true,
          new: true,
          // setDefaultsOnInsert:true
        }
      )
      .exec()
      .then((instance) => {
        if (instance) {
          return instance;
        }
        const err = httpStatus.NOT_FOUND;
        return Promise.reject(err);
      });
  },

  getByIdentification(identification) {
    return this.findOne({
        identification: identification
      })
      .exec()
      .then((instance) => {
        if (instance) {
          return instance;
        }
        const err = httpStatus.NOT_FOUND;
        return Promise.reject(err);
      });
  },
});

/**
 * @typedef Microscope
 */
export default mongoose.model('Microscope', MicroscopeSchema);