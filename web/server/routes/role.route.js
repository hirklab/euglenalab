import express from 'express';
import validate from 'express-validation';

import {ensureAuthenticated, ensurePermission} from './utils';
import validation from '../validation/role';
import ctrl from '../controllers/role.controller';

const router = express.Router(); // eslint-disable-line new-cap

router.route('/')
  .get(ensureAuthenticated, ctrl.list)
  .post(ensureAuthenticated, ensurePermission('roles.create'), validate(validation.create), ctrl.create);

router.route('/:roleId')
  .get(ensureAuthenticated, ctrl.get)
  .put(ensureAuthenticated, ensurePermission('roles.update.self'), validate(validation.update), ctrl.update)
  .delete(ensureAuthenticated, ensurePermission('roles.remove'), ctrl.remove);

/** Load user when API with roleId route parameter is hit */
router.param('roleId', ctrl.load);

export default router;
