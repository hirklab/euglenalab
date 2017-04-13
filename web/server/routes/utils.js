import config from '../../config/env';
import passport from '../../config/passport';
import _ from 'lodash';

let isAuthenticated = passport.authenticate('jwt', {
  session: false
  // failureRedirect: '/error'
});

function ensureAuthenticated(req, res, next) {
  return isAuthenticated(req, res, next);

  // let loginUrl = `${req.protocol}://${req.headers.host}/${config.auth.loginUrl}`;
  // return res.json({
  // 	loginUrl
  // });
}

function ensurePermission(permission) {
  let hasPermission = permissions => _.intersection([permission], permissions).length > 0;

  return (req, res, next) => {
    if (_.has(req, 'user')) {

      let permissions = [];
      if (_.has(user, 'roles')) {
        _.each(user.roles, (role) => {

          if (_.has(role, 'permissions')) {
            _.each(role.permissions, (permission) => {
              permissions.push(permission.name);
            })
          }

        });
      }

      if (hasPermission(permissions)) {
        next(); // allowed
      }else{
        response.status(403).json({message: "Forbidden"}); // not allowed
      }
    }
    else {
      response.status(403).json({message: "Forbidden"}); // not allowed
    }
  }
}

export {ensureAuthenticated, ensurePermission};
