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
NoteSchema.plugin(plugins.rest, {});


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
NoteSchema.statics = Object.assign(NoteSchema.statics,{
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
});

/**
 * @typedef Note
 */
export default mongoose.model('Note', NoteSchema);
