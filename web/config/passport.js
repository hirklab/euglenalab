import passport from 'passport';
import passportLocal from 'passport-local';
import passportJWT from 'passport-jwt';

import config from './env';
import User from '../server/models/user.model';

const LocalStrategy = passportLocal.Strategy;
const JWTStrategy = passportJWT.Strategy;
const ExtractJwt = passportJWT.ExtractJwt;

const jwtOptions = {
  secretOrKey: config.auth.jwtSecret,
  jwtFromRequest: ExtractJwt.fromAuthHeader()
};

passport.use(new LocalStrategy(
  function(username, password, done) {

    let conditions = {
      isActive: true
    };

    if (username.indexOf('@') === -1) {
      conditions.username = username;
    } else {
      conditions.email = username.toLowerCase();
    }

    User.findOne(conditions, function(err, user) {
      if (err) {
        return done(err);
      }

      if (!user) {
        return done(null, false, {
          message: 'Invalid user'
        });
      }

      User.validatePassword(password, user.password, function(err, isValid) {
        if (err) {
          return done(err);
        }

        if (!isValid) {
          return done(null, false, {
            message: 'Invalid authentication details'
          });
        }

        return done(null, user);
      });
    });
  }
));

passport.use(new JWTStrategy(jwtOptions, function(jwt_payload, done) {
  User.findOne({
    id: jwt_payload.sub
  }, function(err, user) {
    if (err) {
      return done(err, false);
    }
    if (user) {
      done(null, user);
    } else {
      done(null, false);
    }
  });
}));

passport.serializeUser(function(user, done) {
  done(null, user._id);
});

passport.deserializeUser(function(id, done) {
  User.get(id).populate('roles').populate('groups').then(function(err, user) {
    if (user && user.roles && user.groups) {
      done(err, user);
    } else {
      done(err, user);
    }
  });
});


// TwitterStrategy = require('passport-twitter').Strategy,
// GitHubStrategy = require('passport-github').Strategy,
// FacebookStrategy = require('passport-facebook').Strategy,
// GoogleStrategy = require('passport-google-oauth').OAuth2Strategy,

// if (app.config.oauth.twitter.key) {
//   passport.use(new TwitterStrategy({
//       consumerKey: app.config.oauth.twitter.key,
//       consumerSecret: app.config.oauth.twitter.secret
//     },
//     function (token, tokenSecret, profile, done) {
//       done(null, false, {
//         token: token,
//         tokenSecret: tokenSecret,
//         profile: profile
//       });
//     }
//   ));
// }
//
// if (app.config.oauth.github.key) {
//   passport.use(new GitHubStrategy({
//       clientID: app.config.oauth.github.key,
//       clientSecret: app.config.oauth.github.secret,
//       customHeaders: {"User-Agent": app.config.projectName}
//     },
//     function (accessToken, refreshToken, profile, done) {
//       done(null, false, {
//         accessToken: accessToken,
//         refreshToken: refreshToken,
//         profile: profile
//       });
//     }
//   ));
// }
//
// if (app.config.oauth.facebook.key) {
//   passport.use(new FacebookStrategy({
//       clientID: app.config.oauth.facebook.key,
//       clientSecret: app.config.oauth.facebook.secret
//     },
//     function (accessToken, refreshToken, profile, done) {
//       done(null, false, {
//         accessToken: accessToken,
//         refreshToken: refreshToken,
//         profile: profile
//       });
//     }
//   ));
// }
//
// if (app.config.oauth.google.key) {
//   passport.use(new GoogleStrategy({
//       clientID: app.config.oauth.google.key,
//       clientSecret: app.config.oauth.google.secret
//     },
//     function (accessToken, refreshToken, profile, done) {
//       done(null, false, {
//         accessToken: accessToken,
//         refreshToken: refreshToken,
//         profile: profile
//       });
//     }
//   ));
// }
// 
// 

export default passport;