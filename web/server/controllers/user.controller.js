import User from '../models/user.model';

function list(req, res, next) {
  User.getAll()
    .then(data => res.json(data))
    .catch(e => next(e));
}

function create(req, res, next) {
  const user = new User({
    username: req.body.username,
    mobileNumber: req.body.mobileNumber
  });

  user.save()
    .then(savedUser => res.json(savedUser))
    .catch(e => next(e));
}

/**
 * Load user and append to req.
 */
function load(req, res, next, id) {
  User.get(id)
    .then((user) => {
      req._user = user; // eslint-disable-line no-param-reassign
      return next();
    })
    .catch(e => next(e));
}

function get(req, res) {
  const user = req._user;
  return res.json(user);
}

function update(req, res, next) {
  const user = req._user;

  user.username = req.body.username;
  user.mobileNumber = req.body.mobileNumber;

  user.save()
    .then(savedUser => res.json(savedUser))
    .catch(e => next(e));
}

function remove(req, res, next) {
  const user = req._user;
  user.remove()
    .then(deletedUser => res.json(deletedUser))
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
