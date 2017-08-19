'use strict';
var schemaPath = './';

module.exports = {
	LoginAttempt: require(schemaPath + '/LoginAttempt'),
	User:         require(schemaPath + '/User'),
	Group:        require(schemaPath + '/Group'),
	Bpu:          require(schemaPath + '/Bpu'),
	Experiment:   require(schemaPath + '/Experiment'),
	Survey:       require(schemaPath + '/Survey'),
	Note:         require(schemaPath + '/Note'),
	Score:        require(schemaPath + '/Score')
};