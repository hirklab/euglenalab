import config from './env';
import socketioJwt from 'socketio-jwt';
import manager from './manager';
import logger from './logging';

function serve(io) {
  io.sockets
    .on('connection', socketioJwt.authorize({
      secret: config.auth.jwtSecret,
      timeout: 15000 // 15 seconds to send the authentication message
    }))
    .on('authenticated', function(socket) {
      //this socket is authenticated, we are good to handle more events from it.
      logger.log(`user socket connected : ${socket.decoded_token.id}`);

      socket.on('message', function(data) {
        //socket.broadcast.emit('message', data);
      });

    });
}

export default {
  serve
};


// socket.on('connect', function () {
//   console.log('connected');
// });
// socket.on('connecting', function () {
//   console.log('connecting');
// });
// socket.on('disconnect', function () {
//   console.log('disconnect');
// });
// socket.on('connect_failed', function () {
//   console.log('connect_failed');
// });
// socket.on('error', function (err) {
//   console.log('error: ' + err);
// });
// socket.on('reconnect_failed', function () {
//   console.log('reconnect_failed');
// });
// socket.on('reconnect', function () {
//   console.log('reconnected ');
// });
// socket.on('reconnecting', function () {
//   console.log('reconnecting');
// });