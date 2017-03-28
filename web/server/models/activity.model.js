import Promise from 'bluebird';
import mongoose from 'mongoose';
import httpStatus from 'http-status';
import plugins from './plugins/index';

const ObjectId = mongoose.Schema.ObjectId;

/**
 * Activity Schema
 */
const ActivitySchema = new mongoose.Schema({
  category: {
    type: String,
    enum: ['flush'],
    default: 'flush'
  },

  microscope: {
    type: ObjectId,
    ref: 'Microscope'
  },
  user: {
    type: ObjectId,
    ref: 'User'
  },
});

/**
 * Index
 */
ActivitySchema.index({
  user: 1
});
ActivitySchema.index({
  microscope: 1
});
ActivitySchema.plugin(plugins.timestamps, {
  index: true
});
ActivitySchema.plugin(plugins.pagination, {});


/**
 * Add your
 * - pre-save hooks
 * - validations
 * - virtuals
 */

/**
 * Methods
 */
ActivitySchema.method({});

/**
 * Statics
 */
ActivitySchema.statics = {

  /**
   * Get instance
   * @param {ObjectId} id - The objectId of instance.
   * @returns {Promise<Activity, APIError>}
   */
  get(id) {
    return this.findById(id)
      .exec()
      .then((instance) => {
        if (instance) {
          return Promise.resolve(instance);
        }
        const err = httpStatus.NOT_FOUND;
        return Promise.reject(err);
      });
  },

  /**
   * Get instance
   * @param {String} bpuId - id of BPU instances are linked to
   * @param {number} page - page number.
   * @param {number} limit - max. number of instances to be returned.
   * @returns {Promise<Activity, APIError>}
   */
  getByBPU(bpuId, page = 1, limit = 25) {
    return this.paginate({
        bpuId: mongoose.Schema.ObjectId(bpuId)
      }, {
        page: page,
        limit: limit
      })
      .exec()
      .then((instance) => {
        if (instance) {
          return Promise.resolve(instance);
        }
        const err = httpStatus.NOT_FOUND;
        return Promise.reject(err);
      });
  },

  /**
   * List instances in descending order of 'createdAt' timestamp.
   * @param {number} page - page number.
   * @param {number} limit - max. number of instances to be returned.
   * @returns {Promise<Activity[]>}
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
 * @typedef Activity
 */
export default mongoose.model('Activity', ActivitySchema);