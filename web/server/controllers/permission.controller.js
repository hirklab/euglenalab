import Permission from '../models/permission.model';


function load(req, res, next, id) {
  Role.get(id)
    .then((Role) => {
      req.Role = Role; // eslint-disable-line no-param-reassign
      return next();
    })
    .catch(e => next(e));
}


function get(req, res) {
  return res.json(req.Role);
}


function create(req, res, next) {
  const Role = new Role({
    name: req.body.name,
    isActive: req.body.isActive
  });

  Role.save()
    .then(savedRole => res.json(savedRole))
    .catch(e => next(e));
}


function update(req, res, next) {
  const Role = req.Role;
  Role.Rolename = req.body.Rolename;
  Role.mobileNumber = req.body.mobileNumber;

  Role.save()
    .then(savedRole => res.json(savedRole))
    .catch(e => next(e));
}


function list(req, res, next) {
  const {
    limit = 50, skip = 0
  } = req.query;
  Role.list({
      limit,
      skip
    })
    .then(Roles => res.json(Roles))
    .catch(e => next(e));
}


function remove(req, res, next) {
  const Role = req.Role;
  Role.remove()
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