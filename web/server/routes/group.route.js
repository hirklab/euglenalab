import express from 'express';
import validate from 'express-validation';

import {ensureAuthenticated, ensurePermission} from './utils';

import validation from '../validation/group';
import ctrl from '../controllers/group.controller';

const router = express.Router(); // eslint-disable-line new-cap

router.route('/')
  .get(ensureAuthenticated, ctrl.list)
  .post(ensureAuthenticated, ensurePermission('groups.create'), validate(validation.create), ctrl.create);

router.route('/:groupId')
  .get(ensureAuthenticated, ctrl.get)
  .put(ensureAuthenticated, ensurePermission('groups.update.self'), validate(validation.update), ctrl.update)
  .delete(ensureAuthenticated, ensurePermission('groups.remove'), ctrl.remove);

/** Load user when API with groupId route parameter is hit */
router.param('groupId', ctrl.load);

export default router;
