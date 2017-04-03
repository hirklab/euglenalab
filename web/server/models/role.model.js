import Promise from "bluebird";
import mongoose from "mongoose";
import httpStatus from "http-status";
import plugins from "./plugins/index";

/**
 * User Schema
 */
const ObjectId = mongoose.Schema.ObjectId;

const RoleSchema = new mongoose.Schema({
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

  permissions: [{
    type: ObjectId,
    ref: 'Permission'
  }],

  search: [String]

});

/**
 * Index
 */
RoleSchema.index({
  name: 1
}, {
  unique: true
});

RoleSchema.index({
  search: 1
});

RoleSchema.plugin(plugins.timestamps, {
  index: true
});

RoleSchema.plugin(plugins.rest, {});

let autoPopulate = function(next) {
  this
    .populate('permissions');
  next();
};

RoleSchema
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
RoleSchema.method({});

/**
 * Statics
 */
RoleSchema.statics = Object.assign(RoleSchema.statics,{

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
  }
});

/**
 * @typedef User
 */
export default mongoose.model('Role', RoleSchema);
