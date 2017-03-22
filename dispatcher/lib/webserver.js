import express from 'express';

class Webserver {
	constructor(config) {
		this.config = config;
		this.app = express();
		this.router = express.Router();

		this.defineRoutes();
	}

	getServer(){
	  return this.server;
	}

	defineRoutes() {
		this.router.get('/', function(request, response) {
			return response.send('connected to euglena controller!');
		});

		this.router.get('/status', function(request, response) {
			return response.send('connected to euglena controller!');
		});

		this.app.use(this.router);
	}

	start(callback) {
		this.server = this.app.listen(this.config.port, this.config.ip, (err) => {
			if (err) {
				return callback(err);
			} else {
				// let host = this.server.address().address;
				// let port = this.server.address().port;
				return callback(null);
			}
		});
	}
}

export default Webserver;
