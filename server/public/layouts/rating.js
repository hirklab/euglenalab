(function() {
  'use strict';

  $(document).ready(function() {

    $('input.rating').rating({
      filled: 'fa fa-star',
      filledSelected: 'fa fa-star-half-o',
      empty: 'fa fa-star-o'
    });

  });
}());