import express from 'express';
import validate from 'express-validation';

import ensureAuthenticated from './utils';
import validation from '../validation/auth';
import AuthCtrl from '../controllers/auth.controller';

const router = express.Router(); // eslint-disable-line new-cap

router.route('/register').post(validate(validation.register), AuthCtrl.register);
router.route('/login').post(validate(validation.login), AuthCtrl.login);
router.route('/logout').get(ensureAuthenticated, AuthCtrl.logout);
router.route('/forgot-password').post(validate(validation.forgotPassword), AuthCtrl.forgotPassword);
router.route('/reset-password').post(validate(validation.resetPassword), AuthCtrl.resetPassword);

export default router;
