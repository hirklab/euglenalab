(function () {
    'use strict';

    // var io = require('socket.io-client');

    angular
        .module('BlurAdmin.pages.services', [])
        .factory('socket', function ($rootScope, $location) {
            var socket = io.connect('localhost:'+($location.$$port+200-1)); // controller is on Webserver + 200

            return {
                on: function (eventName, callback) {
                    socket.on(eventName, function () {
                        var args = arguments;
                        $rootScope.$apply(function () {
                            callback.apply(socket, args);
                        });
                    });
                },
                emit: function (eventName, data, callback) {
                    socket.emit(eventName, data, function () {
                        var args = arguments;
                        $rootScope.$apply(function () {
                            if (callback) {
                                callback.apply(socket, args);
                            }
                        });
                    })
                },
                sock: function(funcName, options, callback){
                    return function() {
                        var emitStr = handle + funcName;
                        var resStr = emitStr + 'Res';

                        var resFunc = function (resData) {
                            console.log(resData);
                            socket.removeListener(resStr, resFunc);
                            callback(null, resData);
                        };

                        socket.on(resStr, resFunc);
                        socket.emit(emitStr, options);
                    };
                }
            };
        });
})();