/**
 * @author shirishgoyal
 * created on 16.12.2015
 */
(function () {
    'use strict';

    angular.module('BlurAdmin.pages.admin')
        .controller('AdminMicroscopeDetailCtrl', AdminMicroscopeDetailCtrl);

    /** @ngInject */
    function AdminMicroscopeDetailCtrl($scope, $http, $stateParams, $state, $timeout, socket, AdminMicroscope) {
        var vm = this;
        vm.message = '';

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

        AdminMicroscope.detail($stateParams.id).then(function (res) {
            vm.microscope = res.data.results;
            vm.microscope.snapshot = true;

            vm.microscope.panelClass = 'microscope bootstrap-panel';
            vm.microscope.panelClass += vm.microscope.isOn ? ' enabled' : ' disabled';

            if (vm.microscope.hasOwnProperty('publicAddr') && vm.microscope.publicAddr != null) {
                vm.microscope.address = 'http://' + vm.microscope.publicAddr.ip + ':' + vm.microscope.publicAddr.webcamPort + '?action=' + (vm.microscope.snapshot ? 'snapshot' : 'stream');
            } else {
                vm.microscope.address = '/assets/img/bpu-disabled.jpg';
            }

            vm.microscope.statistics = vm.microscope.stats.map(function (stat) {
                var newValue = {
                    'name': stat.statType,
                    'value': stat.data.inverseTimeWeightedAvg,
                    'max': stat.statType == 'response' ? 4 : stat.statType == 'population' ? 300 : 500
                };

                newValue['percent'] = newValue['value'] * 100 / newValue['max'];
                newValue['class'] = findClass(stat.statType, newValue['percent']);

                return newValue;
            });

            if (vm.microscope.statistics.length == 0) {
                vm.microscope.statistics = [{}, {}, {}]
            }

            vm.microscope.notes = vm.microscope.notes.map(function (note) {
                note.when = moment(note.userCreated.time).fromNow();
                return note;
            });

            AdminMicroscope.queue(vm.microscope.name).then(function (experiments) {
                vm.microscope.queue = experiments.data.running.concat(experiments.data.pending);
            });

            vm.initializeSocket(vm.microscope.name, function (err, data) {
                vm.refresh(vm.microscope.name, function(obj){

                });
            });
        });

        $scope.$watch('vm.microscope.snapshot', function (newValue, oldValue) {
            if (newValue != null && newValue != oldValue) {
                if (vm.microscope.hasOwnProperty('publicAddr') && vm.microscope.publicAddr != null) {
                    vm.microscope.address = 'http://' + vm.microscope.publicAddr.ip + ':' + vm.microscope.publicAddr.webcamPort + '?action=' + (newValue ? 'snapshot' : 'stream');
                } else {
                    vm.microscope.address = '/dashboard/assets/img/bpu-disabled.jpg';
                }
            }
        });

        $scope.$watch('vm.microscope.resample', function (newValue, oldValue) {
            if (newValue != null && newValue != oldValue && newValue) {
                vm.resample(5000);
            }
        });

        $scope.$watch('vm.microscope.resample10', function (newValue, oldValue) {
            if (newValue != null && newValue != oldValue && newValue) {
                vm.resample(10000);
            }
        });

        $scope.$watch('vm.microscope.resample120', function (newValue, oldValue) {
            if (newValue != null && newValue != oldValue && newValue) {
                vm.resample(120000);
            }
        });


        vm.toggle = function (status) {
            vm.microscope.snapshot = !status;
        };


        vm.addNote = function (message) {
            AdminMicroscope.addNote($stateParams.id, message).then(function (res) {
                vm.message = '';
                vm.microscope.notes = res.data.notes.map(function (note) {
                    note.when = moment(note.userCreated.time).fromNow();
                    return note;
                });
            });
        };

        vm.removeNote = function (item) {
            AdminMicroscope.removeNote($stateParams.id, item).then(function (res) {
                item.deleted = true;

                vm.microscope.notes = res.data.notes.map(function (note) {
                    note.when = moment(note.userCreated.time).fromNow();
                    return note;
                });
            });

        };

        var handle = '/admin_bpus';

        vm.initializeSocket = function (bpuName, callback) {
            socket.on('connect', function () {
                console.log('connecting...');
                var connectionInfo = {
                    bpuName: bpuName,
                    socketID: socket.id
                };

                var emitStr = handle + '/#setConnection';

                var resStr = emitStr + 'Res';

                var resFunc = function (resData) {
                    console.log(resData);

                    socket.removeListener(resStr, resFunc);
                    vm.ping();
                    callback(null, resData);
                };
                socket.on(resStr, resFunc);
                socket.emit(emitStr, connectionInfo);
            });
        };

        vm.ping = function () {
            socket.on(handle + '/#ping', function () {
                console.log('pinging...');

                var time = new Date() - vm.lastPing;
                vm.lastPing = new Date();
                socket.emit(handle + '/#pingRes');
            });
        };

        vm.resample = function (msec) {
            var options = {
                id: vm.microscope._id,
                bpuName: vm.microscope.name,
                index: vm.microscope.index,
                localAddr: vm.microscope.localAddr,
                flushTime: msec,
            };

            var emitStr = handle + '/#flush';
            var resStr = emitStr + 'Res';

            var resFunc = function (resData) {
                console.log(resData);
                socket.removeListener(resStr, resFunc);

                // callback(null, resData);
            };

            socket.on(resStr, resFunc);
            socket.emit(emitStr, options);

            $timeout(function(){
                vm.microscope.resample = false;
            },msec);
        };

        vm.refresh = function (bpuName, callback) {
            var foundBpu = function (bpu) {
                var updateObj = {};

                updateObj.bpuStatus = bpu.bpuInfo.bpuStatus;
                updateObj.username = bpu.bpuExpInfo.username;
                updateObj.runTime = bpu.bpuExpInfo.runTime;
                updateObj.timeLeft = bpu.bpuExpInfo.timeLeft;
                updateObj.processingTimePerExperiment = bpu.bpuInfo.overheadPerExp;

                callback(updateObj);
            };

            socket.on('/updateBpus', function (bpusUpdateObj) {
                console.log(bpusUpdateObj);
                // var isFound = false;
                // if (bpusUpdateObj && bpusUpdateObj.bpus && bpusUpdateObj.bpus.forEach) {
                //     bpusUpdateObj.bpus.forEach(function (bpu) {
                //         if (!isFound && bpuName === bpu.bpuInfo.name) {
                //             isFound = true;
                //             foundBpu(bpu);
                //         }
                //     });
                // }
            });
        };


        // vm.resample = function(options, callback){
        //     return socket.sock('/#flush',options, callback)
        // };

        // me.refreshGraphData = function (options, callback) {
        //     myPrint('refreshGraphData', 'emit', null, null);
        //     var emitStr = handle + '/#refreshGraphData';
        //     var resStr = emitStr + 'Res';
        //     var resFunc = function (resData) {
        //         myPrint('refreshGraphData', 'resFunc', null, null);
        //         me.mySocket.removeListener(resStr, resFunc);
        //         callback(null, resData);
        //     };
        //     me.mySocket.on(resStr, resFunc);
        //     me.mySocket.emit(emitStr, options);
        // };


    }
})();

// Display current health information/current state (including if any user is waiting in Queue on this BPU)
// Historical health information in graphs/chart, with time-slider
// Add/View/Edit Notes (time stamped, when viewed, show the time-stamps)