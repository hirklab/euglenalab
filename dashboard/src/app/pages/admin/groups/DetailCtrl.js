(function () {
    'use strict';

    angular.module('BioLab.pages.admin')
        .controller('GroupDetailCtrl', GroupDetailCtrl);

    /** @ngInject */
    function GroupDetailCtrl($scope, $http, $stateParams, $state, Group, lodash) {
        var vm = this;
        vm.message='';

        Group.detail($stateParams.id).then(function (res) {
            vm.group = res.data.results;
            vm.group.settings = lodash.transform(vm.group.settings,function(result, value,key){
                result.push({
                    'key':key,
                    'value':value
                });
                return result;
            },[]);
            // vm.group.groups = lodash.transform(vm.group.groups,function(result, value,key){
            //     result.push({
            //         'key':value,
            //         'value':key
            //     });
            //     return result;
            // },[]);
        });



        // vm.add = function(message){
        //     Group.add($stateParams.id, message).then(function(res){
        //         vm.message='';
        //         vm.microscope.notes = res.data.notes.map(function(note){
        //             note.when = moment(note.groupCreated.time).fromNow();
        //             return note;
        //         });
        //     });
        // };
        //
        // vm.remove = function(item){
        //     Group.remove($stateParams.id, item).then(function(res){
        //         item.deleted = true;
        //
        //         vm.microscope.notes = res.data.notes.map(function(note){
        //             note.when = moment(note.groupCreated.time).fromNow();
        //             return note;
        //         });
        //     });
        //
        // }


    }
})();