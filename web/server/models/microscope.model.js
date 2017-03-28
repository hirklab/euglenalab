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
      'initializing',
      'ready',
      'reserved'
    ],
    default: 'unknown'
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

  localAddress: {
    ip: {
      type: String,
      default: ''
    },
    port: {
      type: String,
      default: ''
    },
    webcam: {
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
    webcam: {
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
MicroscopeSchema.plugin(plugins.pagination, {});


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
MicroscopeSchema.statics = {

  /**
   * Get instance
   * @param {ObjectId} id - The objectId of instance.
   * @returns {Promise<Microscope, httpStatus>}
   */
  get(id) {
    return this.findById(id)
      .exec()
      .then((instance) => {
        if (instance) {
          return instance;
        }
        const err = httpStatus.NOT_FOUND;
        return Promise.reject(err);
      });
  },

  /**
   * Get instance
   * @param {String} identification - unique id for Microscope
   * @returns {Promise<Microscope, httpStatus>}
   */
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

  /**
   * List instances in descending order of 'createdAt' timestamp.
   * @param {number} page - page number.
   * @param {number} limit - max. number of instances to be returned.
   * @returns {Promise<Microscope[]>}
   */
  getAll({
    page = 1,
    limit = 25
  } = {}) {
    return this.paginate({}, {
        page: page,
        limit: limit
      })
      .exec();
  }
};

/**
 * @typedef Microscope
 */
export default mongoose.model('Microscope', MicroscopeSchema);