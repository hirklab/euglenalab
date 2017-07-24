'use strict';

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

function accountOrFront(req, res, next) {
    if (req.isAuthenticated()) {
        res.redirect('/account');
    } else {
        require('./views/index').init(req, res, next)
    }
}

module.exports = function (app, passport) {
    app.get('/', accountOrFront);
    // app.get('/about/', require('./views/about/index').init);
    app.get('/help/', require('./views/help/index').init);
    app.get('/contact/', require('./views/contact/index').init);
    app.post('/contact/', require('./views/contact/index').sendMessage);

    app.get('/signup/', require('./views/signup/index').init);
    app.post('/signup/', require('./views/signup/index').signup);

    app.get('/login/', require('./views/login/index').init);
    app.post('/login/', require('./views/login/index').login);
    app.get('/login/forgot/', require('./views/login/forgot/index').init);
    app.post('/login/forgot/', require('./views/login/forgot/index').send);
    app.get('/login/reset/', require('./views/login/reset/index').init);
    app.get('/login/reset/:email/:token/', require('./views/login/reset/index').init);
    app.put('/login/reset/:email/:token/', require('./views/login/reset/index').set);
    app.get('/logout/', require('./views/logout/index').init);

    //goLabz - join page
    app.get('/basicuser/', require('./views/basicuser/index').find);

    //goLabz - join page
    app.get('/basicuserlivelab/', require('./views/basicuserlivelab/index').init);

    //goLabz - join page
    //app.get('/goLabz/', require('./views/goLabz/index').init);

    //goLabz - join page
    //app.get('/golabzjoylab/', require('./views/golabzjoylab/index').init);




    // let download happen without authentication
    app.get('/account/joinlabwithdata/downloadFile/:id/:filename/', require('./views/account/joinlabwithdata/index').downloadFile);
    app.get('/account/experiment/:id/', require('./views/account/joinlabwithdata/index').status);

    //account
    app.all('/account*', ensureAuthenticated);
    app.all('/account*', ensureAccount);

    //reroute home page after sign in to joinlabwithdata
    app.get('/account/', require('./views/account/joinlabwithdata/index').find);

    //account > verification
    app.get('/account/verification/', require('./views/account/verification/index').init);
    app.post('/account/verification/', require('./views/account/verification/index').resendVerification);
    app.get('/account/verification/:token/', require('./views/account/verification/index').verify);

    //account > joinlabwithdata
    app.get('/account/joinlabwithdata/', require('./views/account/joinlabwithdata/index').find);
    app.post('/account/joinlabwithdata/', require('./views/account/joinlabwithdata/index').create);
    app.get('/account/joinlabwithdata/:id/', require('./views/account/joinlabwithdata/index').read);
    app.get('/account/joinlabwithdata/download/:id/', require('./views/account/joinlabwithdata/index').download);
    app.put('/account/joinlabwithdata/:id/', require('./views/account/joinlabwithdata/index').update);
    app.delete('/account/joinlabwithdata/:id/', require('./views/account/joinlabwithdata/index').delete);
    app.get('/account/joinlabwithdata/details/downloadtrack/:id/:trackId', require('./views/account/joinlabwithdata/index').downloadTrack);

    app.post('/account/survey/', require('./views/account/survey/index').create);

    //livejoylab
    app.get('/account/livelab/', require('./views/account/livelab/index').init);

    // Develop game
    app.get('/account/developgame/', require('./views/account/developgame/index').init);
    app.post('/account/developgame/savefile/', require('./views/account/developgame/index').savefile);
    app.post('/account/developgame/getgamecode/', require('./views/account/developgame/index').getgamecode);

    //route not found
    app.all('*', require('./views/http/index').http404);
};
