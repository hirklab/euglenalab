/**
 * Animated load block
 */
(function () {
  'use strict';

  angular.module('BioLab.theme')
      .directive('fadeIn', fadeIn);

  /** @ngInject */
  function fadeIn($timeout, $rootScope) {
    return {
      restrict: 'A',
      link: function ($scope, elem) {
        var delay = 1000;

        if ($rootScope.$pageFinishedLoading) {
          delay = 100;
        }

        $timeout(function () {
          elem.removeClass('full-invisible');
          elem.addClass('animated fadeIn');
        }, delay);
      }
    };
  }

})();