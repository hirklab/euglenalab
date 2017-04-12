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

GroupSchema.plugin(plugins.rest, {});


/**
 * Add your
 * - pre-save hooks
 * - validations
 * - virtuals
 */
// let autoPopulate = function(next) {
//   this
//     .populate('microscopes')
//     .populate('users')
//   next();
// };

// GroupSchema
//   .pre('findOne', autoPopulate)
//   .pre('findById', autoPopulate)
//   .pre('find', autoPopulate);
/**
 * Methods
 */
GroupSchema.method({

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
GroupSchema.statics = Object.assign(GroupSchema.statics, {

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

});

/**
 * @typedef User
 */
export default mongoose.model('Group', GroupSchema);