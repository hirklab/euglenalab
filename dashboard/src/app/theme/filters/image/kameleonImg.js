(function () {
  'use strict';

  angular.module('BioLab.theme')
      .filter('kameleonImg', kameleonImg);

  /** @ngInject */
  function kameleonImg(layoutPaths) {
    return function(input) {
      return layoutPaths.images.root + 'theme/icon/kameleon/' + input + '.svg';
    };
  }

})();
