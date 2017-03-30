import Role from '../models/Role.model';

/**
 * Load Role and append to req.
 */
function load(req, res, next, id) {
  Role.get(id)
    .then((Role) => {
      req.Role = Role; // eslint-disable-line no-param-reassign
      return next();
    })
    .catch(e => next(e));
}

/**
 * Get Role
 * @returns {Role}
 */
function get(req, res) {
  return res.json(req.Role);
}

/**
 * Create new Role
 * @property {string} req.body.name - The Rolename of Role.
 * @property {string} req.body.mobileNumber - The mobileNumber of Role.
 * @returns {Role}
 */
function create(req, res, next) {
  const Role = new Role({
    name: req.body.name,
    isActive: req.body.isActive
  });

  Role.save()
    .then(savedRole => res.json(savedRole))
    .catch(e => next(e));
}

/**
 * Update existing Role
 * @property {string} req.body.Rolename - The Rolename of Role.
 * @property {string} req.body.mobileNumber - The mobileNumber of Role.
 * @returns {Role}
 */
function update(req, res, next) {
  const Role = req.Role;
  Role.Rolename = req.body.Rolename;
  Role.mobileNumber = req.body.mobileNumber;

  Role.save()
    .then(savedRole => res.json(savedRole))
    .catch(e => next(e));
}

/**
 * Get Role list.
 * @property {number} req.query.skip - Number of Roles to be skipped.
 * @property {number} req.query.limit - Limit number of Roles to be returned.
 * @returns {Role[]}
 */
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

/**
 * Delete Role.
 * @returns {Role}
 */
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