'use strict';

// import mongoose from 'mongoose';
//
// mongoose.Query.prototype.paginate = function paginate (page, limit, cb) {
//   page = parseInt(page, 10) || 1;
//   limit = parseInt(limit, 10) || 10;
//
//   var query = this;
//   var model = this.model;
//
//   var skipFrom = (page * limit) - limit;
//
//   query = query.skip(skipFrom).limit(limit);
//
//   if(cb) {
//     query.exec(function(err, docs) {
//       if(err) {
//         cb(err, null, null);
//       } else {
//         model.count(query._conditions, function(err, total) {
//           if(err) {
//             cb(err, null, null);
//           } else {
//             cb(null, docs, total);
//           }
//         });
//       }
//     });
//   } else {
//     return this;
//   }
// };
//


//
function paginate(query, options, callback) {
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
    let docsQuery = this.find(query)
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
      count: this.count(query).exec()
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

function pagination(schema, options) {
  schema.statics.paginate = paginate;
  schema.statics.getAll = paginate;
}

export default pagination;

