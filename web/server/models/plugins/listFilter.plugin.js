function listFilter(schema, pluginOptions) {
  pluginOptions = pluginOptions || {};

  schema.static('getAll', function(options) {
    options = Object.assign(pluginOptions, options, {});

    let page = parseInt(options.page) || 1;
    let limit = parseInt(options.limit) || 20;

    //sanity checks
    if (page <= 0) page = 1;
    if (limit <= 0) limit = 20;
    if (limit > 100) limit = 100;

    let skip = (page - 1) * limit;

    let sort = options.sort || options.sort || ''
    let populate = options.populate || null;

    let find = options.find || {};
    let fields = options.fields || [];

    let Model = this;

    // finding fields
    if ('string' === typeof find) {
      let text = new RegExp(find, 'i');

      find = {
        $and: []
      }

      if (fields) {
        fields.forEach((field) => {
          let obj = {}
          obj[field] = text;
          find.$and.push(obj)
        })
      } else {
        Model.schema.eachPath((path, type) => {
          if (0 !== path.indexOf('_') && String === type.options.type) {
            let obj = {}
            obj[path] = text;
            find.$and.push(obj)
          }
        })
      }
    } else if (typeof find !== 'object' || find === null) {
      find = {};
    }

    let query = Model
      .find(find)
      .sort(sort)
      .skip(skip)
      .limit(limit);

    if (populate !== undefined && populate !== null) {
      query.populate(populate);
    }

    return query.exec().then(
      (results) => {
        return Model.count(find).then(
          (count) => {
            let pages = Math.ceil(count / limit) || 1;

            return {
              docs: results,
              total: count,
              page: page,
              pages: Math.ceil(count / limit) || 1,
              limit: limit,
              hasPrevious: page > 1,
              hasNext: page < pages
            };
          })
      });

  })
}

export default listFilter;