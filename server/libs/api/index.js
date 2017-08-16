'use strict';

var passport = require('passport');
var router = require('express').Router();
// var Arena = require('bull-arena');
// var arena = Arena({"queues":[
// 	{
// 		"name": "scheduler",
// 		"port": 5000,
// 		"host": "127.0.0.1",
// 		"hostId": "main"
// 	}
// ]}, {
// 	disableListen:false
// });

router.use('/auth', require('./auth'));
router.use('/users', require('./users'));
router.use('/groups', require('./groups'));
router.use('/microscopes', require('./microscopes'));
router.use('/experiments', require('./experiments'));
// router.use('/queues', arena);

module.exports = router;