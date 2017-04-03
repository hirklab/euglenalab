import Group from "../models/group.model";

function list(req, res, next) {
  Group.getAll(req.query)
    .then(data => res.json(data))
    .catch(e => next(e));
}

function create(req, res, next) {
  let search = [req.body.name];

  if (req.body.description) {
    search.push(req.body.description);
  }

  let group = new Group({
    name: req.body.name,
    description: req.body.description,
    search: search
  });

  if (req.body.users) {
    group['users'] = req.body.users;
  }

  group.save()
    .then(savedGroup => res.json(savedGroup))
    .catch(e => next(e));
}

/**
 * Load group and append to req.
 */
function load(req, res, next, id) {
  Group.get(id)
    .then((group) => {
      req._group = group; // eslint-disable-line no-param-reassign
      return next();
    })
    .catch(e => next(e));
}

function get(req, res) {
  const group = req._group;
  return res.json(group);
}

function update(req, res, next) {
  const group = req._group;

  let search = [req.body.name];

  if (req.body.description) {
    search.push(req.body.description);
  }

  group.name = req.body.name;
  group.description = req.body.description;
  group.search = search;

  if (req.body.users) {
    group['users'] = req.body.users;
  }
  group.save()
    .then(savedGroup => res.json(savedGroup))
    .catch(e => next(e));
}

function remove(req, res, next) {
  const group = req._group;
  group.remove()
    .then(deletedGroup => res.json(deletedGroup))
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
