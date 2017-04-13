import express from 'express';

import throttle from '../../config/throttle';
import authRoutes from './auth.route';
import userRoutes from './user.route';
import roleRoutes from './role.route';
import permissionRoutes from './permission.route';
import groupRoutes from './group.route';
import microscopeRoutes from './microscope.route';
import experimentRoutes from './experiment.route';


const router = express.Router(); // eslint-disable-line new-cap

router.get('/', (req, res) =>
	res.send({
		'message': 'OK'
	})
);

router.get('/error', (req, res) =>
	res.send({
		'error': 'invalid request'
	})
);

router.get('/api', (req, res) =>
	res.send({
		'message': 'OK'
	})
);

router.use('/api/auth', authRoutes);
router.use('/api/users', userRoutes);
router.use('/api/roles', roleRoutes);
router.use('/api/permissions', permissionRoutes);
router.use('/api/groups', groupRoutes);
router.use('/api/microscopes', microscopeRoutes);
router.use('/api/experiments', experimentRoutes);


export default router;
