/**
 * @author v.lugovksy
 * created on 15.12.2015
 */
(function () {
  'use strict';

  angular.module('BlurAdmin.theme')
    .run(themeRun);

  /** @ngInject */
  function themeRun($timeout, $rootScope, $log, $state, layoutPaths, preloader, $q, baSidebarService, themeLayoutSettings, Auth) {
    var whatToWait = [
      preloader.loadAmCharts(),
      $timeout(3000)
    ];

    var theme = themeLayoutSettings;
    if (theme.blur) {
      if (theme.mobile) {
        whatToWait.unshift(preloader.loadImg(layoutPaths.images.root + 'blur-bg-mobile.jpg'));
      } else {
        whatToWait.unshift(preloader.loadImg(layoutPaths.images.root + 'blur-bg.jpg'));
        whatToWait.unshift(preloader.loadImg(layoutPaths.images.root + 'blur-bg-blurred.jpg'));
      }
    }

    $q.all(whatToWait).then(function () {
      $rootScope.$pageFinishedLoading = true;
    });

    $timeout(function () {
      if (!$rootScope.$pageFinishedLoading) {
        $rootScope.$pageFinishedLoading = true;
      }
    }, 2000);

    $rootScope.$baSidebarService = baSidebarService;

    $rootScope.$on("$stateChangeStart",
        function (event, toState, toParams, fromState, fromParams) {
          // $log.log(toState);

          if(!toState.hasOwnProperty('authenticate')){
            toState.authenticate = false;
          }

          if (toState.authenticate && !Auth.isAuthenticated()) {
            event.preventDefault();
            $state.go('auth.login');
          } else {
            //check if login page and already logged in
            if ((toState.name == 'auth.login' || toState.name == 'auth.register' ) && Auth.isAuthenticated()) {
              event.preventDefault();
              $state.go('admin');
            }
          }
        });
  }

})();