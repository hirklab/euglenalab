import Promise from 'bluebird';
import mongoose from 'mongoose';
import httpStatus from 'http-status';
import plugins from './plugins/index';

const ObjectId = mongoose.Schema.ObjectId;

/**
 * Note Schema
 */
const NoteSchema = new mongoose.Schema({
  message: String,
  isPrivate: {
    type: Boolean,
    default: false
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
NoteSchema.index({
  userId: 1
});
NoteSchema.index({
  microscope: 1
});
NoteSchema.plugin(plugins.timestamps, {
  index: true
});
NoteSchema.plugin(plugins.pagination, {});


/**
 * Add your
 * - pre-save hooks
 * - validations
 * - virtuals
 */

/**
 * Methods
 */
NoteSchema.method({});

/**
 * Statics
 */
NoteSchema.statics = {

  /**
   * Get instance
   * @param {ObjectId} id - The objectId of instance.
   * @returns {Promise<Note, APIError>}
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
   * @returns {Promise<Note, APIError>}
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
   * @returns {Promise<Note[]>}
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
 * @typedef Note
 */
export default mongoose.model('Note', NoteSchema);