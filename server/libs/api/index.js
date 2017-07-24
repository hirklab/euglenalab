'use strict';

var passport = require('passport');
var router = require('express').Router();

router.use('/auth', require('./auth'));
router.use('/users', require('./users'));
router.use('/groups', require('./groups'));
router.use('/microscopes', require('./microscopes'));
router.use('/experiments', require('./experiments'));

module.exports = router;