import Promise from 'bluebird';
import mongoose from 'mongoose';
import _ from 'lodash';
import bcrypt from 'bcrypt';
import httpStatus from 'http-status';
import plugins from './plugins/index';

/**
 * User Schema
 */
const ObjectId = mongoose.Schema.ObjectId;

const GroupSchema = new mongoose.Schema({
  name: {
    type: String,
    unique: true
  },

  description: {
    type: String,
    default: ''
  },

  isActive: {
    type: Boolean,
    default: true
  },

  microscopes: [{
    type: ObjectId,
    ref: 'Microscope'
  }],

  users: [{
    type: ObjectId,
    ref: 'User'
  }],

  search: [String]

});

/**
 * Index
 */
GroupSchema.index({
  name: 1
}, {
  unique: true
});

GroupSchema.index({
  search: 1
});

GroupSchema.plugin(plugins.timestamps, {
  index: true
});

GroupSchema.plugin(plugins.pagination, {});


/**
 * Add your
 * - pre-save hooks
 * - validations
 * - virtuals
 */

/**
 * Methods
 */
GroupSchema.method({});

/**
 * Statics
 */
GroupSchema.statics = {
  /**
   * Get instance
   * @param {ObjectId} id - The objectId of instance.
   * @returns {Promise<User, APIError>}
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
   * @param {String} instance.
   * @returns {Promise<User, APIError>}
   */
  getByName(name) {
    return this.findOne({
        name: name
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

  findByName(name) {
    return this.findOne({
        name: name
      })
      .exec()
      .then((instance) => {
        if (instance) {
          return instance;
        } else {
          return false;
        }
      });
  },

  /**
   * List instances in descending order of 'createdAt' timestamp.
   * @param {number} page - page number.
   * @param {number} limit - max. number of users to be returned.
   * @returns {Promise<User[]>}
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
 * @typedef User
 */
export default mongoose.model('Group', GroupSchema);