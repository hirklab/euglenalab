import Experiment from "../models/experiment.model";

function list(req, res, next) {
  Experiment.getAll(req.query)
    .then(data => res.json(data))
    .catch(e => next(e));
}


// tag: String,
// 
//   microscope: {
//     type: ObjectId,
//     ref: 'Microscope'
//   },


//   status: {
//     type: String,
//     enum: [
//       'draft', //initial state - useful for batch, for live, it can directly be in submitted status
//       'submitted', //when user reserves an experiment
//       'queued', //when reserved experiment is waiting in queue
//       'initializing', //when queued experiment is about to start
//       'running', //when experiment is in progress
//       'executed', //when experiment has successfully captured stimulus for its duration
//       'processing', //when experiment is pushed for processing the stimulus and response data
//       'finished', //when experiment data has been processing and ready for download
//       'failed', //when experiment fails in any of the above steps
//       'cancelled' //when experiment is explicitly stopped in the middle by the user
//     ],
//     default: 'draft'
//   },
//   startedAt: {
//     type: Date,
//     default: null
//   },

//   completedAt: {
//     type: Date,
//     default: null
//   },

//   cancelledAt: {
//     type: Date,
//     default: null
//   },

//   processedAt: {
//     type: Date,
//     default: null
//   },

//   notes: String,

//   rating: {
//     type: Number,
//     default: 0
//   },

function create(req, res, next) {
  // let search = [req.body.proposedMicroscope];

  // if (req.body.identification) {
  //   search.push(req.body.identification);
  // }
  // 
  // 
  console.log(req.user);

  let experiment = new Experiment({
    proposedMicroscope: req.body.proposedMicroscope,
    category: req.body.category,
    // search: search,
    // tag:tag,
    // microscope:microscope,
    user: req.user._id,
    status: 'submitted',
    // proposedEvents:proposedEvents,
    // actualEvents:actualEvents,
    submittedAt: new Date(),
    isProfiling: req.body.isProfiling == null ? false : req.body.isProfiling

  });

  experiment.save()
    .then(savedExperiment => res.json(savedExperiment))
    .catch(e => next(e));
}

/**
 * Load experiment and append to req.
 */
function load(req, res, next, id) {
  Experiment.get(id)
    .then((experiment) => {
      req._experiment = experiment; // eslint-disable-line no-param-reassign
      return next();
    })
    .catch(e => next(e));
}

function get(req, res) {
  const experiment = req._experiment;
  return res.json(experiment);
}

function update(req, res, next) {
  const experiment = req._experiment;

  let search = [req.body.name, req._experiment.identification];

  experiment.name = req.body.name;
  experiment.search = search;

  experiment.save()
    .then(savedExperiment => res.json(savedExperiment))
    .catch(e => next(e));
}

function remove(req, res, next) {
  const experiment = req._experiment;
  experiment.remove()
    .then(deletedExperiment => res.json(deletedExperiment))
    .catch(e => next(e));
}

export default {
  load,
  get,
  create,
  update,
  list,
  remove
};