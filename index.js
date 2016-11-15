'use strict';

const Hapi = require('hapi');
const config = require('./config');
const handler = require('./handler');

const appId = process.env.APP_ID || config.APP_ID;
const pageId = process.env.PAGE_ID || config.PAGE_ID;


const server = new Hapi.Server();
server.connection({
  port: process.env.PORT || config.PORT,
  routes: {
    cors: true
  }
});

server.register(require('vision'), err => {
  if (err) {
    throw err;
  }

  server.views({
    engines: {
      html: require('handlebars')
    },
    path: './www'
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

  server.route({
    method: 'GET',
    path: '/',
    handler: {
      view: {
        template: 'index',
        context: { appId, pageId }
      }
    }
  });

  server.start(() => {
    console.log('API Server', 'Started on ' + server.info.port);
  });

});
