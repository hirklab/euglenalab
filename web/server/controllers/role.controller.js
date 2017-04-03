import Role from "../models/role.model";

function list(req, res, next) {
  Role.getAll(req.query)
    .then(data => res.json(data))
    .catch(e => next(e));
}

function create(req, res, next) {
  let search = [req.body.name];

  if (req.body.description) {
    search.push(req.body.description);
  }

  let role = new Role({
    name: req.body.name,
    description: req.body.description,
    search: search
  });

  if (req.body.permissions) {
    role['permissions'] = req.body.permissions;
  }

  role.save()
    .then(savedRole => res.json(savedRole))
    .catch(e => next(e));
}

/**
 * Load role and append to req.
 */
function load(req, res, next, id) {
  Role.get(id)
    .then((role) => {
      req._role = role; // eslint-disable-line no-param-reassign
      return next();
    })
    .catch(e => next(e));
}

function get(req, res) {
  const role = req._role;
  return res.json(role);
}

function update(req, res, next) {
  const role = req._role;

  let search = [req.body.name];

  if (req.body.description) {
    search.push(req.body.description);
  }

  role.name = req.body.name;
  role.description = req.body.description;
  role.search = search;

  if (req.body.permissions) {
    role['permissions'] = req.body.permissions;
  }
  role.save()
    .then(savedRole => res.json(savedRole))
    .catch(e => next(e));
}

function remove(req, res, next) {
  const role = req._role;
  role.remove()
    .then(deletedRole => res.json(deletedRole))
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
