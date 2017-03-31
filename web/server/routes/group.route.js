import express from 'express';
import validate from 'express-validation';


import ctrl from '../controllers/group.controller';

const router = express.Router(); // eslint-disable-line new-cap

router.route('/')
	.get(ctrl.list)
	// .post(validate(paramValidation.createUser), ctrl.create);

router.route('/:groupId')
	.get(ctrl.get)
	// .put(validate(paramValidation.updateUser), ctrl.update)
	.delete(ctrl.remove);

/** Load user when API with groupId route parameter is hit */
router.param('/:groupId', ctrl.load);

export default router;