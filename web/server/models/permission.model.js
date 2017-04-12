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
PermissionSchema.plugin(plugins.rest, {});


/**
 * Add your
 * - pre-save hooks
 * - validations
 * - virtuals
 */

/**
 * Methods
 */
PermissionSchema.method({

  toJSON() {
    var obj = this.toObject();
    delete obj.search;
    delete obj.createdAt;
    delete obj.modifiedAt;
    return obj;
  }
});

/**
 * Statics
 */
PermissionSchema.statics = Object.assign(PermissionSchema.statics, {
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
});

/**
 * @typedef Permission
 */
export default mongoose.model('Permission', PermissionSchema);