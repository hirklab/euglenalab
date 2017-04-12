import express from 'express';
import validate from 'express-validation';
import {ensureAuthenticated, ensurePermission} from './utils';

import userCtrl from '../controllers/user.controller';

const router = express.Router(); // eslint-disable-line new-cap

router.route('/')
	.get(ensureAuthenticated, userCtrl.list)
	// .post(validate(paramValidation.createUser), userCtrl.create);

router.route('/:userId')
	.get(ensureAuthenticated, userCtrl.get)
	// .put(validate(paramValidation.updateUser), userCtrl.update)
	.delete(ensureAuthenticated, userCtrl.remove);

/** Load user when API with userId route parameter is hit */
router.param('userId', userCtrl.load);

export default router;
