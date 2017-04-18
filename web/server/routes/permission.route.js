import express from 'express';
import validate from 'express-validation';

import {ensureAuthenticated, ensurePermission} from './utils';
import validation from '../validation/permission';
import ctrl from '../controllers/permission.controller';

const router = express.Router(); // eslint-disable-line new-cap

router.route('/')
	.get(ensureAuthenticated, ctrl.list)
	.post(ensureAuthenticated, ensurePermission('permissions.create'), validate(validation.create), ctrl.create);

router.route('/:permissionId')
	.get(ensureAuthenticated, ctrl.get)
	.put(ensureAuthenticated, ensurePermission('permissions.update.self'), validate(validation.update), ctrl.update)
	.delete(ensureAuthenticated, ensurePermission('permissions.remove'), ctrl.remove);

router.param('permissionId', ctrl.load);

export default router;
