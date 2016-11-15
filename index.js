'use strict';

const Hapi = require('hapi');
const config = require('./config');
const handler = require('./handler');


const server = new Hapi.Server();
server.connection({
  port: process.env.PORT || config.PORT,
  routes: {
    cors: true
  }
});


server.route({
  method: 'GET',
  path: '/webhook',
  config: {
    handler: handler.verify
  }
});

server.route({
  method: 'POST',
  path: '/webhook',
  config: {
    handler: handler.message
  }
});


server.start(() => {
  console.log('API Server', 'Started on ' + server.info.port);
});
