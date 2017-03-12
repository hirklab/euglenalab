import express from 'express'

const router = express.Router();

router.get('/', function (request, response) {
    return response.send('connected to euglena controller!');
});

router.get('/status', function (request, response) {
    return response.send('connected to euglena controller!');
});

export {router};
