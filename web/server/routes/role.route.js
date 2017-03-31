import express from 'express';
import validate from 'express-validation';


import roleCtrl from '../controllers/role.controller';

const router = express.Router(); // eslint-disable-line new-cap

router.route('/')
	.get(roleCtrl.list)
	// .post(validate(paramValidation.createUser), roleCtrl.create);

router.route('/:roleId')
	.get(roleCtrl.get)
	// .put(validate(paramValidation.updateUser), roleCtrl.update)
	.delete(roleCtrl.remove);

/** Load user when API with roleId route parameter is hit */
router.param('/:roleId', roleCtrl.load);

export default router;