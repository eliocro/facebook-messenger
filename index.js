'use strict';

const Hapi = require('hapi');
const Boom = require('boom');
const config = require('./config');


const server = new Hapi.Server();
server.connection({
  port: process.env.PORT || config.PORT,
  routes: {
    cors: true
  }
});


const token = process.env.VERIFY_TOKEN || config.VERIFY_TOKEN;

server.route({
  method: 'GET',
  path: '/webhook',
  config: {
    handler: (request, reply) => {
      let qs = request.query;

      if(qs['hub.mode'] === 'subscribe' && qs['hub.verify_token'] === token) {
        return reply(qs['hub.challenge']);
      }

      console.error('Failed validation. Make sure the validation tokens match.');
      reply(Boom.forbidden('Failed validation'));
    }
  }
});


server.start(() => {
  console.log('API Server', 'Started on ' + server.info.port);
});
