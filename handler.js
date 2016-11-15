'use strict';

const Boom = require('boom');
const request = require('request');

const config = require('./config');
const verifyToken = process.env.VERIFY_TOKEN || config.VERIFY_TOKEN;
const pageToken = process.env.PAGE_ACCESS_TOKEN || config.PAGE_ACCESS_TOKEN;


function callSendAPI (messageData) {
  request({
    uri: 'https://graph.facebook.com/v2.6/me/messages',
    qs: {
      access_token: pageToken
    },
    method: 'POST',
    json: messageData
  },
  (error, response, body) => {
    if(!error && response.statusCode === 200) {
      var recipientId = body.recipient_id;
      var messageId = body.message_id;

      console.log('Successfully sent generic message with id %s to recipient %s',
        messageId, recipientId);
    }
    else {
      console.error('Unable to send message.');
      console.error(response);
      console.error(error);
    }
  });
}


function sendTextMessage (recipientId, messageText) {
  let messageData = {
    recipient: {
      id: recipientId
    },
    message: {
      text: messageText
    }
  };
  callSendAPI(messageData);
}


function sendGenericMessage(recipientId) {
  let messageData = {
    recipient: {
      id: recipientId
    },
    message: {
      attachment: {
        type: 'template',
        payload: {
          template_type: 'generic',
          elements: [{
            title: 'Webfinance',
            subtitle: 'Forbrukslån - Til hva du vil',
            item_url: 'https://webfinance.net/',
            image_url: 'https://webfinance.net/img/webfinance-logo.png',
            buttons: [{
              type: 'web_url',
              url: 'https://webfinance.net/allbanks',
              title: 'Open Web URL'
            }, {
              type: 'postback',
              title: 'Tell me more',
              payload: 'Payload for first bubble',
            }]
          }]
        }
      }
    }
  };
  callSendAPI(messageData);
}


function receivedMessage (event) {
  let senderID = event.sender.id;
  let recipientID = event.recipient.id;
  let timeOfMessage = event.timestamp;

  console.log('Received message for user %d and page %d at %d with message:',
    senderID, recipientID, timeOfMessage);

  let message = event.message;
  console.log(JSON.stringify(message));

  // let messageId = message.mid;
  let text = message.text;
  let attachments = message.attachments;

  if (text) {
    if(text.toLowerCase() === 'yes') {
      // if the keyword is yes, send product information
      sendGenericMessage(senderID);
    }
    else {
      // Echo back message text
      sendTextMessage(senderID, text);
    }
  }
  else if (attachments) {
    sendTextMessage(senderID, 'Message with attachment received');
  }
}


function receivedPostback (event) {
  let senderID = event.sender.id;
  let recipientID = event.recipient.id;
  let timeOfMessage = event.timestamp;

  console.log('Received postback for user %d and page %d at %d with message:',
    senderID, recipientID, timeOfMessage);

  let postback = event.postback;
  console.log(JSON.stringify(postback));

  if(postback.payload === 'START') {
    return sendTextMessage(senderID, 'Hi there. Welcome! Do you want to know more?');
  }

  sendTextMessage(senderID, 'Sorry dude! That button doesn\'t work :(');
}


module.exports = {

  verify (request, reply) {
    let qs = request.query;

    if(qs['hub.mode'] === 'subscribe' && qs['hub.verify_token'] === verifyToken) {
      return reply(qs['hub.challenge']);
    }

    console.error('Failed validation. Make sure the validation tokens match.');
    reply(Boom.forbidden('Failed validation'));
  },

  message (request, reply) {
    let post = request.payload;

    if(post.object === 'page') {

      post.entry.forEach(entry => {
        // let pageId = entry.id;
        // let ts = entry.time;

        entry.messaging.forEach(event => {
          if(event.message) {
            receivedMessage(event);
          }
          else if(event.postback) {
            receivedPostback(event);
          }
          else {
            console.log('Webhook received unknown event: ', event);
          }
        });
      });
    }

    reply('OK');
  }

};
