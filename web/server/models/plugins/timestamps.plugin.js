'use strict';

function timestampsPlugin (schema, options) {
  schema.add({
    createdAt: {
      type: Date,
      'default': Date.now
    },
    modifiedAt: {
      type: Date,
      'default': Date.now
    },
    deletedAt: {
      type: Date,
      sparse: true
    }
  });

  // Define the pre save hook
  schema.pre('save', function (next) {
    this.modifiedAt = new Date();
    next();
  });

  if (options && options.index) {
    // Create an index on all the paths
    schema.path('createdAt').index(options.index);
    schema.path('modifiedAt').index(options.index);
    schema.path('deletedAt').index(options.index);
  }
}

export default timestampsPlugin;
