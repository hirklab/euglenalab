import Group from '../models/group.model';


function load(req, res, next, id) {
  Group.get(id)
    .then((Group) => {
      req.Group = Group; // eslint-disable-line no-param-reassign
      return next();
    })
    .catch(e => next(e));
}


function get(req, res) {
  return res.json(req.Group);
}


function create(req, res, next) {
  const Group = new Group({
    name: req.body.name,
    isActive: req.body.isActive
  });

  Group.save()
    .then(savedGroup => res.json(savedGroup))
    .catch(e => next(e));
}


function update(req, res, next) {
  const Group = req.Group;
  Group.Groupname = req.body.Groupname;
  Group.mobileNumber = req.body.mobileNumber;

  Group.save()
    .then(savedGroup => res.json(savedGroup))
    .catch(e => next(e));
}


function list(req, res, next) {
  const {
    limit = 50, skip = 0
  } = req.query;
  Group.list({
      limit,
      skip
    })
    .then(Groups => res.json(Groups))
    .catch(e => next(e));
}


function remove(req, res, next) {
  const Group = req.Group;
  Group.remove()
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