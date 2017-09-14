'use strict';

var events = require('events');

module.exports = function(req, res) {
  var workflow = new events.EventEmitter();

  workflow.outcome = {
    success: false,
    errors: [],
    errfor: {}
  };

  workflow.hasErrors = function() {
    return Object.keys(workflow.outcome.errfor).length > 0 || workflow.outcome.errors.length > 0;
  };

  workflow.on('exception', function(err) {
    workflow.outcome.errors.push(err);
    return workflow.emit('response');
  });

  workflow.on('response', function() {
    workflow.outcome.success = !workflow.hasErrors();
    res.send(workflow.outcome);
  });

  return workflow;
};
