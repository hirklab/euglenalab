import Promise from 'bluebird';
import mongoose from 'mongoose';
import _ from 'lodash';
import bcrypt from 'bcrypt';
import crypto from 'crypto-promise';
import httpStatus from 'http-status';
import plugins from './plugins/index';

/**
 * User Schema
 */
const ObjectId = mongoose.Schema.ObjectId;

const UserSchema = new mongoose.Schema({
  username: {
    type: String,
    unique: true
  },

  email: {
    type: String,
    unique: true
  },

  name: {
    type: String,
    default: ''
  },

  isActive: {
    type: Boolean,
    default: false
  },

  isSystem: {
    type: Boolean,
    default: false
  },

  isVerified: {
    type: Boolean,
    default: false
  },

  verificationToken: {
    type: String,
    default: ''
  },

  password: {
    type: String,
    default: null
  },

  resetPassword: {
    token: {
      type: String,
      default: ''
    },

    expiresAt: {
      type: Date,
      default: null
    }
  },

  groups: [{
    type: ObjectId,
    ref: 'Group'
  }],

  roles: [{
    type: ObjectId,
    ref: 'Role'
  }],

  search: [String]

});

/**
 * Index
 */
UserSchema.index({
  username: 1
}, {
  unique: true
});

UserSchema.index({
  email: 1
}, {
  unique: true
});

UserSchema.index({
  search: 1
});

UserSchema.plugin(plugins.timestamps, {
  index: true
});

UserSchema.plugin(plugins.pagination, {});


let autoPopulate = function(next) {
  this
    .populate('groups')
    .populate('roles');
  next();
};

UserSchema
  .pre('findOne', autoPopulate)
  .pre('findById', autoPopulate)
  .pre('find', autoPopulate);


/**
 * Add your
 * - pre-save hooks
 * - validations
 * - virtuals
 */

/**
 * Methods
 */
UserSchema.method({
  hasRole(roleName) {
    console.log(this.roles);
    return _.includes(this.roles, roleName);
  },

  hasGroup(groupName) {
    console.log(this.groups);
    return _.includes(this.groups, groupName);
  },

  toJSON() {
    var obj = this.toObject();
    delete obj.password;
    delete obj.resetPassword;
    delete obj.verificationToken;
    delete obj.isSystem;
    return obj;
  }
});

/**
 * Statics
 */
UserSchema.statics = {

  encryptPassword(password) {
    return bcrypt.genSalt(10)
      .then((salt) => {
        return bcrypt.hash(password, salt);
      })
      .catch((err) => {
        return false;
      });
  },

  validatePassword(password, hash) {
    return bcrypt.compare(password, hash)
      .then((res) => {
        return res;
      })
      .catch((err) => {
        return false;
      });
  },

  generateResetToken() {
    let data = {};
    return crypto.randomBytes(21)
      .then((randomString) => {
        return randomString.toString('hex');
      })
      .then((token) => {
        data.token = token;
        return bcrypt.genSalt(10);
      })
      .then((salt) => {
        data.salt = salt;
        return bcrypt.hash(data.token, data.salt);
      })
      .then((token) => {
        return token;
      })
      .catch((err) => {
        return false;
      });
  },

  /**
   * Get user
   * @param {ObjectId} id - The objectId of user.
   * @returns {Promise<User, APIError>}
   */
  get(id) {
    return this.findById(id)
      .exec()
      .then((user) => {
        if (user) {
          return user;
        }
        const err = httpStatus.NOT_FOUND;
        return Promise.reject(err);
      });
  },

  /**
   * Get user
   * @param {String} username.
   * @returns {Promise<User, APIError>}
   */
  getByUsername(username) {
    return this.findOne({
        username: username
      })
      .exec()
      .then((user) => {
        if (user) {
          return user;
        }
        const err = httpStatus.NOT_FOUND;
        return Promise.reject(err);
      });
  },

  getByEmail(email) {
    return this.findOne({
        email: email
      })
      .exec()
      .then((user) => {
        if (user) {
          return user;
        }
        const err = httpStatus.NOT_FOUND;
        return Promise.reject(err);
      });
  },

  existsUsername(username) {
    return this.findOne({
        username: username
      })
      .exec()
      .then((user) => {
        if (user) {
          return true;
        } else {
          return false;
        }
      });
  },

  existsEmail(email) {
    return this.findOne({
        email: email
      })
      .exec()
      .then((user) => {
        if (user) {
          return true;
        } else {
          return false;
        }
      });
  },

  /**
   * List users in descending order of 'createdAt' timestamp.
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
export default mongoose.model('User', UserSchema);