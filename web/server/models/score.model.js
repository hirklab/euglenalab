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
ScoreSchema.plugin(plugins.rest, {});


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
ScoreSchema.statics = Object.assign(ScoreSchema.statics,{
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

});

/**
 * @typedef Score
 */
export default mongoose.model('Score', ScoreSchema);
