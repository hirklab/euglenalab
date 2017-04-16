import Microscope from "../models/microscope.model";
import manager from "../../config/manager";

function list(req, res, next) {
  Microscope.getAll(req.query)
    .then(data => res.json(data))
    .catch(e => next(e));
}

function create(req, res, next) {
  let search = [req.body.name];

  if (req.body.identification) {
    search.push(req.body.identification);
  }

  let microscope = new Microscope({
    identification: req.body.identification,
    name: req.body.name,
    search: search
  });

  microscope.save()
    .then(savedMicroscope => res.json(savedMicroscope))
    .catch(e => next(e));
}

/**
 * Load microscope and append to req.
 */
function load(req, res, next, id) {
  Microscope.get(id)
    .then((microscope) => {
      req._microscope = microscope; // eslint-disable-line no-param-reassign
      return next();
    })
    .catch(e => next(e));
}

function get(req, res) {
  const microscope = req._microscope;
  return res.json(microscope);
}

function update(req, res, next) {
  const microscope = req._microscope;

  let search = [req.body.name, req._microscope.identification];

  microscope.name = req.body.name;
  microscope.search = search;

  microscope.save()
    .then(savedMicroscope => res.json(savedMicroscope))
    .catch(e => next(e));
}

function remove(req, res, next) {
  const microscope = req._microscope;
  microscope.remove()
    .then(deletedMicroscope => res.json(deletedMicroscope))
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
