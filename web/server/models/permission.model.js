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

const PermissionSchema = new mongoose.Schema({
  name: {
    type: String,
    unique: true
  },

  description: {
    type: String,
    default: ''
  },

  search: [String]

});

/**
 * Index
 */
PermissionSchema.index({
  name: 1
}, {
  unique: true
});

PermissionSchema.index({
  search: 1
});

PermissionSchema.plugin(plugins.timestamps, {
  index: true
});

PermissionSchema.plugin(plugins.pagination, {});


/**
 * Add your
 * - pre-save hooks
 * - validations
 * - virtuals
 */

/**
 * Methods
 */
PermissionSchema.method({});

/**
 * Statics
 */
PermissionSchema.statics = {
  /**
   * Get instance
   * @param {ObjectId} id - The objectId of instance.
   * @returns {Promise<Permission, APIError>}
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
   * @returns {Promise<Permission, APIError>}
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

  /**
   * List instances in descending order of 'createdAt' timestamp.
   * @param {number} page - page number.
   * @param {number} limit - max. number of users to be returned.
   * @returns {Promise<Permission[]>}
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
 * @typedef Permission
 */
export default mongoose.model('Permission', PermissionSchema);