import Promise from 'bluebird';
import mongoose from 'mongoose';
import httpStatus from 'http-status';
import plugins from './plugins/index';

const ObjectId = mongoose.Schema.ObjectId;

/**
 * Score Schema
 */
const ScoreSchema = new mongoose.Schema({
  population: {
    type: Number,
    default: 0
  },
  activity: {
    type: Number,
    default: 0
  },
  response: {
    type: Number,
    default: 0
  },
  performance: {
    type: Number,
    default: 0
  },

  notes: [String],

  microscope: {
    type: ObjectId,
    ref: 'Microscope'
  },
});

/**
 * Index
 */
ScoreSchema.index({
  microscope: 1
});

ScoreSchema.plugin(plugins.timestamps, {
  index: true
});
ScoreSchema.plugin(plugins.pagination, {});


/**
 * Add your
 * - pre-save hooks
 * - validations
 * - virtuals
 */

/**
 * Methods
 */
ScoreSchema.method({
  //add methods to normalize values
});

/**
 * Statics
 */
ScoreSchema.statics = {

  /**
   * Get instance
   * @param {ObjectId} id - The objectId of instance.
   * @returns {Promise<Score, APIError>}
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
   * @param {String} bpuId - id of BPU instances are linked to
   * @param {number} page - page number.
   * @param {number} limit - max. number of instances to be returned.
   * @returns {Promise<Score, APIError>}
   */
  getByBPU(bpuId, page = 1, limit = 25) {
    return this.paginate({
        bpuId: ObjectId(bpuId)
      }, {
        page: page,
        limit: limit
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
   * @returns {Promise<Score[]>}
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
 * @typedef Score
 */
export default mongoose.model('Score', ScoreSchema);