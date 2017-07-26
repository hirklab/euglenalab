(function () {
    'use strict';

    angular
        .module('BlurAdmin.pages.services', [])
        .service('socket', function ($rootScope, $location) {
            var socket = io.connect('http://localhost:5000', {
                forceNew: false,
                autoConnect:true,
                reconnection: true
            });

            socket.on('error', function(error) {
                console.log(error);
            });

            socket.on('message', function(data) {
                $rootScope.$broadcast("message", data);
            });

            var users = [];

            function isListeningAt(eventName) {
                return socket.hasOwnProperty("$events") && socket.$events.hasOwnProperty(eventName);
            }

            return {
                users:users,

                on: function (eventName, callback) {
                    if(eventName!=='message') {
                        socket.on(eventName, function () {
                            var args = arguments;
                            $rootScope.$apply(function () {
                                if (callback) {
                                    callback.apply(socket, args);
                                }
                            });
                        });
                    }
                },

                off: function(eventName, callback){
                    if(eventName!=='message') {
                        socket.removeAllListeners(eventName, function () {
                            var args = arguments;
                            $rootScope.$apply(function () {
                                if (callback) {
                                    callback.apply(socket, args);
                                }
                            });
                        });
                    }
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

                sock: function (funcName, options, callback) {
                    return function () {
                        var emitStr = handle + funcName;
                        var resStr = emitStr + 'Res';

                        var resFunc = function (resData) {
                            console.log(resData);
                            socket.removeListener(resStr, resFunc);
                            if (callback) {
                                callback.apply(null, resData);
                            }
                        };

                        socket.on(resStr, resFunc);
                        socket.emit(emitStr, options);
                    };
                },

                isListeningAt: isListeningAt
            };
        })
        .service('ip', function($http){
            return $http.get('http://ipinfo.io/json');
        })

})();