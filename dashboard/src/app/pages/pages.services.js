(function () {
    'use strict';

    angular
        .module('BlurAdmin.pages.services', [])
        .factory('socket', function ($rootScope, $location) {
            var socket = io.connect('http://localhost:5000', {
                forceNew: false,
                autoConnect:false,
                reconnection: true
            });

            return socket;

            // socket.on('error', function(error) {
            //     console.log(error);
            // });
            //
            // return {
            //     connect: function (callback) {
            //         // if (socket === null || !socket.connected) {
            //         socket = io.connect('localhost:' + ($location.$$port + 200 - 1), {
            //             forceNew: true,
            //             reconnection: true,
            //         });
            //         console.log(socket);
            //         // }
            //
            //         socket.on('error', function(error) {
            //             console.log(error);
            //         });
            //     },
            //
            //     onopen: function (callback) {
            //         socket.onopen = function () {
            //             var args = arguments;
            //             $rootScope.$apply(function () {
            //                 callback.apply(socket, args);
            //             });
            //         };
            //     },
            //
            //     reconnect: function (callback) {
            //         socket.io.reconnect(function () {
            //             var args = arguments;
            //             $rootScope.$apply(function () {
            //                 callback.apply(socket, args);
            //             });
            //         });
            //     },
            //
            //     disconnect: function (callback) {
            //         socket.disconnect(function () {
            //             console.log('disconnected');
            //
            //             var args = arguments;
            //             $rootScope.$apply(function () {
            //                 callback.apply(socket, args);
            //             });
            //         });
            //     },
            //
            //     on: function (eventName, callback) {
            //         socket.on(eventName, function () {
            //             var args = arguments;
            //             $rootScope.$apply(function () {
            //                 callback.apply(socket, args);
            //             });
            //         });
            //     },
            //
            //     emit: function (eventName, data, callback) {
            //         socket.emit(eventName, data, function () {
            //             var args = arguments;
            //             $rootScope.$apply(function () {
            //                 if (callback) {
            //                     callback.apply(socket, args);
            //                 }
            //             });
            //         })
            //     },
            //
            //     sock: function (funcName, options, callback) {
            //         return function () {
            //             var emitStr = handle + funcName;
            //             var resStr = emitStr + 'Res';
            //
            //             var resFunc = function (resData) {
            //                 console.log(resData);
            //                 socket.removeListener(resStr, resFunc);
            //                 callback(null, resData);
            //             };
            //
            //             socket.on(resStr, resFunc);
            //             socket.emit(emitStr, options);
            //         };
            //     }
            // };
        });
})();