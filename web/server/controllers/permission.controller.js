import Permission from '../models/permission.model';

function list(req, res, next) {
  Permission.getAll(req.query)
    .then(data => res.json(data))
    .catch(e => next(e));
}

function create(req, res, next) {
  let search = [req.body.name];

  if(req.body.description){
    search.push(req.body.description);
  }

  const permission = new Permission({
    name: req.body.name,
    description: req.body.description,
    search:search
  });

  permission.save()
    .then(savedPermission => res.json(savedPermission))
    .catch(e => next(e));
}

/**
 * Load permission and append to req.
 */
function load(req, res, next, id) {
  Permission.get(id)
    .then((permission) => {
      req._permission = permission; // eslint-disable-line no-param-reassign
      return next();
    })
    .catch(e => next(e));
}

function get(req, res) {
  const permission = req._permission;
  return res.json(permission);
}

function update(req, res, next) {
  const permission = req._permission;

  let search = [req.body.name];

  if(req.body.description){
    search.push(req.body.description);
  }

  permission.name = req.body.name;
  permission.description = req.body.description;
  permission.search = search;

  permission.save()
    .then(savedPermission => res.json(savedPermission))
    .catch(e => next(e));
}

function remove(req, res, next) {
  const permission = req._permission;

  permission.remove()
    .then(deletedPermission => res.json(deletedPermission))
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
