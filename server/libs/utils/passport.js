'use strict';
var mongoose = require('mongoose');

var LocalStrategy = require('passport-local').Strategy,
    JwtStrategy = require('passport-jwt').Strategy,
    ExtractJwt = require('passport-jwt').ExtractJwt;
    //TwitterStrategy = require('passport-twitter').Strategy,
    //GitHubStrategy = require('passport-github').Strategy,
    //FacebookStrategy = require('passport-facebook').Strategy,
    //GoogleStrategy = require('passport-google-oauth').OAuth2Strategy,
    //TumblrStrategy = require('passport-tumblr').Strategy;

var User = mongoose.model('User');

module.exports = function (app, passport) {
    passport.use(new LocalStrategy(
        function (username, password, done) {
            var conditions = {isActive: 'yes'};
            if (username.indexOf('@') === -1) {
                conditions.username = username;
            }
            else {
                conditions.email = username.toLowerCase();
            }

            User.findOne(conditions).populate('roles.admin').populate('roles.account').exec(function (err, user) {
                if (err) {
                    return done(err);
                }

                if (!user) {
                    return done(null, false, {message: 'Unknown user'});
                }

                User.validatePassword(password, user.password, function (err, isValid) {
                    if (err) {
                        return done(err);
                    }

                    if (!isValid) {
                        return done(null, false, {message: 'Invalid password'});
                    }

                    if (user.roles && user.roles.admin) {
                        user.roles.admin.populate("groups", function (err, admin) {
                            return done(err, user);
                        });
                    } else {
                        return done(err, user);
                    }
                });
            });
        }
    ));

    app.jwtOptions = {
        secretOrKey: '%Q#$%#$BTERVWW^BSYERYRUFJUYDERBYR$VSTET%#$^^#(*(%&#ERSGW$',
        jwtFromRequest: ExtractJwt.fromAuthHeader()
    };

    passport.use(new JwtStrategy(app.jwtOptions, function (jwt_payload, done) {
        User.findOne({_id: jwt_payload.id}).populate('roles.admin').populate('roles.account').exec(function (err, user) {
            if (err) {
                return done(err, false);
            }

            if (user) {
                if (user.roles && user.roles.admin) {
                    user.roles.admin.populate("groups", function (err, admin) {
                        done(err, user);
                    });
                } else {
                    done(err, user);
                }
            } else {
                done(null, false);
            }
        });
    }));

	passport.serializeUser(function (user, done) {
		done(null, user);
	});

	passport.deserializeUser(function (obj, done) {
		User.findOne({_id: obj._id}).populate('roles.admin').populate('roles.account').exec(function (err, user) {
			if (user && user.roles && user.roles.admin) {
				user.roles.admin.populate("groups", function (err, admin) {
					done(err, user);
				});
			}
			else {
				done(err, user);
			}
		});
	});

};
