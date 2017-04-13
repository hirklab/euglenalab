function serve(io) {
	io.on('connection', function(socket) {
		socket.on('message', function(data) {
			socket.broadcast.emit('message', data);
		});
	});
}

export default {
	serve
};