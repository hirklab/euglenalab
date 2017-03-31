import Promise from "bluebird";
import mongoose from "mongoose";
import httpStatus from "http-status";
import plugins from "./plugins/index";

/**
 * User Schema
 */
const ObjectId = mongoose.Schema.ObjectId;

const RoleSchema = new mongoose.Schema({
  name: {
    type: String,
    unique: true
  },

  isActive: {
    type: Boolean,
    default: true
  },

  permissions: [{
    type: ObjectId,
    ref: 'Permission'
  }],

  search: [String]

});

/**
 * Index
 */
RoleSchema.index({
  name: 1
}, {
  unique: true
});

RoleSchema.index({
  search: 1
});

RoleSchema.plugin(plugins.timestamps, {
  index: true
});

let autoPopulate = function (next) {
  this
    .populate('permissions');
  next();
};

RoleSchema
  .pre('findOne', autoPopulate)
  .pre('findById', autoPopulate)
  .pre('find', autoPopulate);

/**
 * Add your
 * - pre-save hooks
 * - validations
 * - virtuals
 */

/**
 * Methods
 */
RoleSchema.method({});

function paginate(model, query, options, callback) {
  query = query || {};
  options = Object.assign({}, options);

  let select = options.select;
  let sort = options.sort;
  let populate = options.populate;
  let lean = options.lean || false;
  let leanWithId = options.leanWithId ? options.leanWithId : true;
  let limit = options.limit ? options.limit : 10;
  let page, offset, skip, promises;

  if (options.offset) {
    offset = options.offset;
    skip = offset;
  } else if (options.page) {
    page = options.page;
    skip = (page - 1) * limit;
  } else {
    page = 1;
    offset = 0;
    skip = offset;
  }

  if (limit) {
    let docsQuery = model.find(query)
      .select(select)
      .sort(sort)
      .skip(skip)
      .limit(limit)
      .lean(lean);

    if (populate) {
      [].concat(populate).forEach((item) => {
        docsQuery.populate(item);
      });
    }

    promises = {
      docs: docsQuery.exec(),
      count: model.count(query).exec()
    };

    if (lean && leanWithId) {
      promises.docs = promises.docs.then((docs) => {
        docs.forEach((doc) => {
          doc.id = String(doc._id);
        });
        return docs;
      });
    }
  }

  promises = Object.keys(promises).map((x) => promises[x]);

  return Promise.all(promises).then((data) => {
    let result = {
      docs: data.docs,
      total: data.count,
      limit: limit
    };

    if (offset !== undefined) {
      result.offset = offset;
    }

    if (page !== undefined) {
      result.page = page;
      result.pages = Math.ceil(data.count / limit) || 1;
    }

    if (typeof callback === 'function') {
      return callback(null, result);
    }

    let promise = new Promise();
    promise.resolve(result);

    return promise;
  });
}

/**
 * Statics
 */
RoleSchema.statics = {
  getAll({
    page = 1,
    limit = 25
  } = {}) {
    return paginate(this, {},{page:page,limit:limit});
  },

  /**
   * Get instance
   * @param {ObjectId} id - The objectId of instance.
   * @returns {Promise<User, APIError>}
   */
  get(id) {
    return this.findById(id)
      .exec()
      .then((instance) => {
        if (instance) {
          return instance;
        }
        const err = httpStatus.NOT_FOUND;
        return Promise.reject(err);
      });
  },

  /**
   * Get instance
   * @param {String} instance.
   * @returns {Promise<User, APIError>}
   */
  getByName(name) {
    return this.findOne({
      name: name
    })
      .exec()
      .then((instance) => {
        if (instance) {
          return instance;
        }
        const err = httpStatus.NOT_FOUND;
        return Promise.reject(err);
      });
  },

  findByName(name) {
    return this.findOne({
      name: name
    })
      .exec()
      .then((instance) => {
        if (instance) {
          return instance;
        } else {
          return false;
        }
      });
  }
};

// RoleSchema.plugin(plugins.pagination, {});

/**
 * @typedef User
 */
export default mongoose.model('Role', RoleSchema);
