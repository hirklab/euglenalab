import Promise from 'bluebird';
import mongoose from 'mongoose';
import httpStatus from 'http-status';
import plugins from './plugins/index';

const ObjectId = mongoose.Schema.ObjectId;

/**
 * Experiment Schema
 */
const ExperimentSchema = new mongoose.Schema({
  tag: String,

  microscope: {
    type: ObjectId,
    ref: 'Microscope'
  },

  user: {
    type: ObjectId,
    ref: 'User'
  },

  category: {
    type: String,
    enum: ['live', 'batch'],
    default: 'batch'
  },

  status: {
    type: String,
    enum: [
      'draft', //initial state - useful for batch, for live, it can directly be in submitted status
      'submitted', //when user reserves an experiment
      'queued', //when reserved experiment is waiting in queue
      'initializing', //when queued experiment is about to start
      'running', //when experiment is in progress
      'executed', //when experiment has successfully captured stimulus for its duration
      'processing', //when experiment is pushed for processing the stimulus and response data
      'finished', //when experiment data has been processing and ready for download
      'failed', //when experiment fails in any of the above steps
      'cancelled' //when experiment is explicitly stopped in the middle by the user
    ],
    default: 'draft'
  },

  proposedEvents: {
    type: Array,
    default: []
  },

  actualEvents: {
    type: Array,
    default: []
  },

  submittedAt: {
    type: Date,
    default: null
  },

  startedAt: {
    type: Date,
    default: null
  },

  completedAt: {
    type: Date,
    default: null
  },

  processedAt: {
    type: Date,
    default: null
  },

  isProfiling: {
    type: Boolean,
    default: false
  },

  notes: String,

  rating: {
    type: Number,
    default: 0
  },

  //Set in Processing script
  // proc_doNotProcess:{type: Boolean, default: false },               //proc set when we don't want to process
  // proc_attempts:{type: Number, default: 0 },                        //stat attempts processing
  // proc_err:{type: String, default: null },                          //last err for processing
  //
  // proc_startPath:{type: String, default: null },                    //set on proc server when exp id was matched in mount data dir.
  //
  // proc_jpgFiles:{type: Array, default: [] },                        //set on proc server when validating exp data pacakge prior to starting processing
  //
  // proc_lightDataArrayPath:{type: String, default: null },           //set on proc server when validating exp data location of specical file
  //
  // proc_expSchemaJsonPath:{type: String, default: null },           //set on proc server when validating exp data location of specical file
  //
  // proc_endPath:{type: String, default: null },                      //set on proc server when processing has finished and the tar file is made.
  //
  // user_tarFilePath:{type: String, default: null },                     //set on clinet server when user attempts first download.
  // user_tarFilename:{type: String, default: null },                      //set on clinet server when user attempts first download.

});

/**
 * Index
 */
ExperimentSchema.index({
  user: 1
});
ExperimentSchema.index({
  microscope: 1
});
ExperimentSchema.plugin(plugins.timestamps, {
  index: true
});
ExperimentSchema.plugin(plugins.listFilter, {});


/**
 * Add your
 * - pre-save hooks
 * - validations
 * - virtuals
 */

/**
 * Methods
 */
ExperimentSchema.method({});

/**
 * Statics
 */
ExperimentSchema.statics = {

  /**
   * Get instance
   * @param {ObjectId} id - The objectId of instance.
   * @returns {Promise<Experiment, APIError>}
   */


  /**
   * Get instance
   * @param {String} bpuId - id of BPU instances are linked to
   * @param {number} page - page number.
   * @param {number} limit - max. number of instances to be returned.
   * @returns {Promise<Experiment, APIError>}
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
};

/**
 * @typedef Experiment
 */
export default mongoose.model('Experiment', ExperimentSchema);