import express from 'express';
import validate from 'express-validation';

import {ensureAuthenticated, ensurePermission} from './utils';
import validation from '../validation/experiment';
import ctrl from '../controllers/experiment.controller';

const router = express.Router(); // eslint-disable-line new-cap

router.route('/')
  .get(ensureAuthenticated, ctrl.list)
  .post(ensureAuthenticated, validate(validation.create), ctrl.create);

router.route('/:experimentId')
  .get(ensureAuthenticated, ctrl.get)
  .put(ensureAuthenticated, validate(validation.update), ctrl.update)
  .delete(ensureAuthenticated, ctrl.remove);

/** Load user when API with experimentId route parameter is hit */
router.param('experimentId', ctrl.load);

export default router;
