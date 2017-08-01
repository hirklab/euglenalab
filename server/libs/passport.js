'use strict';
var LocalStrategy = require('passport-local').Strategy,
    JwtStrategy = require('passport-jwt').Strategy,
    ExtractJwt = require('passport-jwt').ExtractJwt;
    //TwitterStrategy = require('passport-twitter').Strategy,
    //GitHubStrategy = require('passport-github').Strategy,
    //FacebookStrategy = require('passport-facebook').Strategy,
    //GoogleStrategy = require('passport-google-oauth').OAuth2Strategy,
    //TumblrStrategy = require('passport-tumblr').Strategy;

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

            app.db.models.User.findOne(conditions).populate('roles.admin').populate('roles.account').exec(function (err, user) {
                if (err) {
                    return done(err);
                }

                if (!user) {
                    return done(null, false, {message: 'Unknown user'});
                }

                app.db.models.User.validatePassword(password, user.password, function (err, isValid) {
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
        app.db.models.User.findOne({_id: jwt_payload.id}).populate('roles.admin').populate('roles.account').exec(function (err, user) {
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
		done(null, user._id);
	});

	passport.deserializeUser(function (id, done) {
		app.db.models.User.findOne({_id: id}).populate('roles.admin').populate('roles.account').exec(function (err, user) {
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


    //if (app.config.oauth.twitter.key) {
    //    passport.use(new TwitterStrategy({
    //            consumerKey: app.config.oauth.twitter.key,
    //            consumerSecret: app.config.oauth.twitter.secret
    //        },
    //        function (token, tokenSecret, profile, done) {
    //            done(null, false, {
    //                token: token,
    //                tokenSecret: tokenSecret,
    //                profile: profile
    //            });
    //        }
    //    ));
    //}
    //
    //if (app.config.oauth.github.key) {
    //    passport.use(new GitHubStrategy({
    //            clientID: app.config.oauth.github.key,
    //            clientSecret: app.config.oauth.github.secret,
    //            customHeaders: {"User-Agent": app.config.projectName}
    //        },
    //        function (accessToken, refreshToken, profile, done) {
    //            done(null, false, {
    //                accessToken: accessToken,
    //                refreshToken: refreshToken,
    //                profile: profile
    //            });
    //        }
    //    ));
    //}
    //
    //if (app.config.oauth.facebook.key) {
    //    passport.use(new FacebookStrategy({
    //            clientID: app.config.oauth.facebook.key,
    //            clientSecret: app.config.oauth.facebook.secret
    //        },
    //        function (accessToken, refreshToken, profile, done) {
    //            done(null, false, {
    //                accessToken: accessToken,
    //                refreshToken: refreshToken,
    //                profile: profile
    //            });
    //        }
    //    ));
    //}
    //
    //if (app.config.oauth.google.key) {
    //    passport.use(new GoogleStrategy({
    //            clientID: app.config.oauth.google.key,
    //            clientSecret: app.config.oauth.google.secret
    //        },
    //        function (accessToken, refreshToken, profile, done) {
    //            done(null, false, {
    //                accessToken: accessToken,
    //                refreshToken: refreshToken,
    //                profile: profile
    //            });
    //        }
    //    ));
    //}
    //
    //if (app.config.oauth.tumblr.key) {
    //    passport.use(new TumblrStrategy({
    //            consumerKey: app.config.oauth.tumblr.key,
    //            consumerSecret: app.config.oauth.tumblr.secret
    //        },
    //        function (token, tokenSecret, profile, done) {
    //            done(null, false, {
    //                token: token,
    //                tokenSecret: tokenSecret,
    //                profile: profile
    //            });
    //        }
    //    ));
    //}


};
