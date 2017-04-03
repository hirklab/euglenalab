import express from 'express';
import validate from 'express-validation';

import ensureAuthenticated from './utils';
import validation from '../validation/permission';
import ctrl from '../controllers/permission.controller';

const router = express.Router(); // eslint-disable-line new-cap

router.route('/')
	.get(ensureAuthenticated, ctrl.list)
	.post(ensureAuthenticated, validate(validation.create), ctrl.create);

router.route('/:permissionId')
	.get(ensureAuthenticated, ctrl.get)
	.put(ensureAuthenticated, validate(validation.update), ctrl.update)
	.delete(ensureAuthenticated, ctrl.remove);

/** Load user when API with permissionId route parameter is hit */
router.param('permissionId', ctrl.load);

export default router;
