import express from 'express';
import validate from 'express-validation';


import userCtrl from '../controllers/user.controller';

const router = express.Router(); // eslint-disable-line new-cap

router.route('/')
  .get(userCtrl.list)
  // .post(validate(paramValidation.createUser), userCtrl.create);

router.route('/:userId')
  .get(userCtrl.get)
  // .put(validate(paramValidation.updateUser), userCtrl.update)
  .delete(userCtrl.remove);

/** Load user when API with userId route parameter is hit */
router.param('/:userId', userCtrl.load);

export default router;