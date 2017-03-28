import config from '../../config/env';
import passport from '../../config/passport';

let isAuthenticated = passport.authenticate('jwt', {
	session: false
});

function ensureAuthenticated(req, res, next) {
	return isAuthenticated(req, res, next);

	// let loginUrl = `${req.protocol}://${req.headers.host}/${config.auth.loginUrl}`;
	// return res.json({
	// 	loginUrl
	// });
}

// passport.authenticate('local', {
// 		failureRedirect: '/error'
// 	}
// 	passport.authenticate('jwt', { session: false })

export default ensureAuthenticated;