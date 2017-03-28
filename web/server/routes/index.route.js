import express from 'express';

import throttle from '../../config/throttle';
import userRoutes from './user.route';
import authRoutes from './auth.route';


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

router.use('/api/auth', throttle, authRoutes);
router.use('/api/users', userRoutes);


export default router;