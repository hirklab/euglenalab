var passport = require('passport');

function ensureAdmin(req, res, next) {
    if (req.user.canPlayRoleOf('admin')) {
        return next();
    } else {
        res.redirect('/');
    }
}

function checkGoLabz(req, res, next) {
    var isGoLabz = false;
    var goLabzGroup = 'golabz';
    for (var ind = 0; ind < req.user.groups.length; ind++) {
        if (req.user.groups[ind] === goLabzGroup) isGoLabz = true;
    }
    if (isGoLabz) {
        res.redirect('/basicuser');
    } else {
        return next();
    }
}

function ensureAccount(req, res, next) {

    if (req.user.canPlayRoleOf('account')) {
        if (req.app.config.requireAccountVerification) {
            if (req.user.roles.account.isVerified !== 'yes' && !/^\/account\/verification\//.test(req.url)) {
                return res.redirect('/account/verification/');
            } else {
                // return next();
                checkGoLabz(req, res, next);
            }
        } else {
            // return next();
            checkGoLabz(req, res, next);
        }
    } else {
        res.redirect('/');
    }
}


module.exports = {
    ensureAuthenticated: passport.authenticate('jwt', {session: false}),
    ensureAccount: ensureAccount,
    ensureAdmin: ensureAdmin
};