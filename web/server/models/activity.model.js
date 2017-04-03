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
ActivitySchema.plugin(plugins.rest, {});


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
ActivitySchema.statics = Object.assign(ActivitySchema.statics,{
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
});

/**
 * @typedef Activity
 */
export default mongoose.model('Activity', ActivitySchema);
