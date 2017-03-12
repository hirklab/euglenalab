(function() {
  'use strict';

  let schemaPath = './../../../shared/mongoDb/schema';

  module.exports = function(app, mongoose) {
    require(schemaPath + '/Note')(app, mongoose);
    require(schemaPath + '/User')(app, mongoose);
    require(schemaPath + '/Session')(app, mongoose);
    require(schemaPath + '/BpuExperiment')(app, mongoose);
    require(schemaPath + '/Bpu')(app, mongoose);
    require(schemaPath + '/ListExperiment')(app, mongoose);
    require(schemaPath + '/MyFunctions')(app, mongoose);
  };

}).call(this);
