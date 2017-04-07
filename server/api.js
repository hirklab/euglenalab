'use strict';

//Admin and Account Checks
function ensureAuthenticated(req, res, next) {
    if (req.isAuthenticated()) {
        return next();
    } else {
        res.set('X-Auth-Required', 'true');
        req.session.returnUrl = req.originalUrl;
        res.redirect('/login/');
    }
}
function ensureAdmin(req, res, next) {
    if (req.user.canPlayRoleOf('admin')) {
        return next();
    } else {
        res.redirect('/');
    }
}

function ensureAccount(req, res, next) {
    if (req.user.canPlayRoleOf('account')) {
        if (req.app.config.requireAccountVerification) {
            if (req.user.roles.account.isVerified !== 'yes' && !/^\/account\/verification\//.test(req.url)) {
                return res.redirect('/account/verification/');
            } else {
                checkGoLabz(req, res, next);
            }
        } else {
            checkGoLabz(req, res, next);
        }
    } else {
        res.redirect('/');
    }
}

exports = module.exports = function (app, passport) {
    app.post('/api/auth/register/', require('./views/api/index').register);
    app.post('/api/auth/login/', require('./views/api/index').login);

    app.get('/api/users/', passport.authenticate('jwt', {session: false}), ensureAdmin, require('./views/api/index').listUsers);
    app.get('/api/users/:id', passport.authenticate('jwt', {session: false}), ensureAdmin, require('./views/api/index').detailUsers);

    app.get('/api/groups/', passport.authenticate('jwt', {session: false}), ensureAdmin, require('./views/api/index').listGroups);
    app.get('/api/groups/:id', passport.authenticate('jwt', {session: false}), ensureAdmin, require('./views/api/index').detailGroups);

    //app.get('/api/bio-units/', passport.authenticate('jwt', {session: false}), ensureAdmin, require('./views/api/index').get_bio_units);
    app.get('/api/bio-units/:id/', passport.authenticate('jwt', {session: false}), ensureAdmin, require('./views/api/index').bio_unit_detail);
    app.get('/api/bio-units/:id/health/', passport.authenticate('jwt', {session: false}), ensureAdmin, require('./views/api/index').bio_unit_health);
    app.get('/api/bio-units/:name/queue/', passport.authenticate('jwt', {session: false}), ensureAdmin, require('./views/api/index').bio_unit_queue);

    app.post('/api/bio-units/:id/notes/',
        passport.authenticate('jwt', {session: false}),
        ensureAdmin,
        require('./views/api/index').add_note
    );
    app.delete('/api/bio-units/:id/notes/:noteId/',
        passport.authenticate('jwt', {session: false}),
        ensureAdmin,
        require('./views/api/index').remove_note
    );

    app.get('/api/experiments/', passport.authenticate('jwt', {session: false}), require('./views/api/index').listExperiments);
    // app.post('/api/experiments/', passport.authenticate('jwt', {session: false}),
    // require('./views/api/index').create_experiment);
    app.get('/api/experiments/:id/status/', passport.authenticate('jwt', {session: false}), require('./views/api/index').get_experiment_status);
    app.get('/api/experiments/:id/', passport.authenticate('jwt', {session: false}), require('./views/api/index').get_experiment_detail);
    app.get('/api/bio-units/', passport.authenticate('jwt', {session: false}), require('./views/api/index').get_bio_units);
    // app.post('/api/experiment/', passport.authenticate('jwt', {session: false}), require('./views/api/index').create_experiment);
};
