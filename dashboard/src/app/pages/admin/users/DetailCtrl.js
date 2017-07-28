(function () {
	'use strict';

	angular.module('BioLab.pages.admin')
		.controller('UserDetailCtrl', UserDetailCtrl);

	/** @ngInject */
	function UserDetailCtrl($scope, $http, $stateParams, $state, User, lodash) {
		var vm     = this;
		vm.message = '';

		User.detail($stateParams.id).then(function (res) {
			vm.user        = res.data.results;
			vm.user.roles  = lodash.transform(vm.user.roles, function (result, value, key) {
				result.push({
					'key':   key,
					'value': value
				});
				return result;
			}, []);
			vm.user.groups = lodash.transform(vm.user.groups, function (result, value, key) {
				result.push({
					'key':   value,
					'value': key
				});
				return result;
			}, []);
		});


		// vm.add = function(message){
		//     User.add($stateParams.id, message).then(function(res){
		//         vm.message='';
		//         vm.microscope.notes = res.data.notes.map(function(note){
		//             note.when = moment(note.userCreated.time).fromNow();
		//             return note;
		//         });
		//     });
		// };
		//
		// vm.remove = function(item){
		//     User.remove($stateParams.id, item).then(function(res){
		//         item.deleted = true;
		//
		//         vm.microscope.notes = res.data.notes.map(function(note){
		//             note.when = moment(note.userCreated.time).fromNow();
		//             return note;
		//         });
		//     });
		//
		// }


	}
})();