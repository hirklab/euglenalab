import Experiment from "../models/experiment.model";

function list(req, res, next) {
  Experiment.getAll(req.query)
    .then(data => res.json(data))
    .catch(e => next(e));
}

function create(req, res, next) {
  let search = [req.body.name];

  if (req.body.identification) {
    search.push(req.body.identification);
  }

  let experiment = new Experiment({
    identification: req.body.identification,
    name: req.body.name,
    search: search
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
