function listFilter(schema, pluginOptions) {
	pluginOptions = pluginOptions || {};

	schema.static('getAll', function (options) {
		options = Object.assign(pluginOptions, options, {});

		var page  = parseInt(options.page) || 1;
		var limit = parseInt(options.limit) || 20;

		//sanity checks
		if (page <= 0) page = 1;
		if (limit <= 0) limit = 20;
		if (limit > 100) limit = 100;

		var skip = (page - 1) * limit;

		var sort     = options.sort || options.sort || '';
		var populate = options.populate || null;

		var find   = options.find || {};
		var fields = options.fields || [];

		var Model = this;

		// finding fields
		if ('string' === typeof find) {
			var text = new RegExp(find, 'i');

			find = {
				$and: []
			};

			if (fields) {
				fields.forEach(function (field) {
					var obj    = {};
					obj[field] = text;
					find.$and.push(obj)
				})
			} else {
				Model.schema.eachPath(function (path, type) {
					if (0 !== path.indexOf('_') && String === type.options.type) {
						var obj   = {};
						obj[path] = text;
						find.$and.push(obj)
					}
				})
			}
		} else if (typeof find !== 'object' || find === null) {
			find = {};
		}

		var query = Model
			.find(find)
			.sort(sort)
			.skip(skip)
			.limit(limit);

		if (populate !== undefined && populate !== null) {
			query.populate(populate);
		}

		return query.exec().then(
			function (results) {
				return Model.count(find).then(
					function (count) {
						var pages = Math.ceil(count / limit) || 1;

						return {
							docs:        results,
							total:       count,
							page:        page,
							pages:       Math.ceil(count / limit) || 1,
							limit:       limit,
							hasPrevious: page > 1,
							hasNext:     page < pages
						};
					})
			});

	})
}

module.exports = listFilter;