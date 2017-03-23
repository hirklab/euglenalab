/**
 * @author shirishgoyal
 * created on 16.12.2015
 */
(function () {
    'use strict';

    angular.module('BlurAdmin.pages.admin')
        .controller('AdminMicroscopeListCtrl', AdminMicroscopeListCtrl);

    /** @ngInject */
    function AdminMicroscopeListCtrl($scope, $http, $timeout, $element, AdminMicroscope) {

        var vm = this;

        var thresholds = AdminMicroscope.thresholds;

        var findClass = function (statType, value) {
            if (statType != null || statType != '') {
                var threshold = thresholds[statType];

                return threshold.find(function (thresh) {
                    return thresh.min <= value;
                })['value'];
            }
            return '';
        };

        AdminMicroscope.list().then(function (res) {
            vm.microscopes = res.data.results
                .filter(function (microscope) {
                    return microscope.name != 'fake';
                })
                .map(function (microscope) {
                    microscope.panelClass = 'microscope bootstrap-panel';

                    microscope.panelClass += microscope.isOn ? ' enabled' : ' disabled';

                    if(microscope.isOn) {
                        microscope.address = 'http://'+microscope.publicAddr.ip + ':'+ microscope.publicAddr.webcamPort + '?action=snapshot';
                    }else {
                        microscope.address = '/assets/img/bpu-disabled.jpg'
                    }

                    microscope.statistics = microscope.stats.map(function (stat) {
                        var newValue = {
                            'name': stat.statType,
                            'value': stat.data.inverseTimeWeightedAvg,
                            'max': stat.statType == 'response' ? 4 : stat.statType == 'population' ? 300 : 500
                        };

                        newValue['percent'] = newValue['value'] * 100 / newValue['max'];
                        newValue['class'] = findClass(stat.statType, newValue['percent']);

                        return newValue;
                    });

                    if (microscope.statistics.length == 0) {
                        microscope.statistics = [{}, {}, {}]
                    }

                    return microscope;
                });
        });
    }
})();