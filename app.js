var express = require('express');
var bodyParser = require('body-parser');
var request = require("request");

var config = require("./config");

var app = express();

app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

app.use('/img', express.static(__dirname + '/img'));

app.get('/', function (req, res) {
  res.send('Hello World!');
});

app.get('/webhook/', function (req, res) {
  if (req.query['hub.verify_token'] === 'penguin_dragon') {
    res.send(req.query['hub.challenge']);
    console.log("Veryfing success");
    res.sendStatus(200)
  }

  console.log("Error: wrong validation token")
})

app.get('/imgTest/', function (req, res) {  
    console.log(config.testing_token);
    console.log(req.get('host'));
    
})

var host;

app.post('/webhook/', function (req, res) {
  var messaging_events = req.body.entry[0].messaging;
  console.log("app.post ran")
  
  host = req.get('host');
  console.log(host);
  
  for (var i = 0; i < messaging_events.length; i++) {
    event = req.body.entry[0].messaging[i];
    var userid = event.sender.id;
    if (event.message && event.message.text) {
      var text = event.message.text;
      if (text == "need a penguin") {
        console.log("need a penguin");
        penguinPhotoMessage(userid);
      }
      else if (text == "where is penguin facts") {
        penguinFactMessage(userid);
      }
      //sendTextMessage(sender, "Hello Penguin!! "+ text.substring(0, 200));
      else {
        sendMessage(userid, {text: "Hello Penguin!!"});
      }
    }
  }
  res.sendStatus(200);
});


function penguinPhotoMessage(recipientId) {
  console.log("photo message");
    
  var messageData = {
    "attachment": {
      "type": "template",
      "payload": {
        "template_type": "generic",
        "elements": [{
          "title": "Baby Penguin #1",
          "subtitle": "All 18 species of penguins live in the Southern Hemisphere.",
          "image_url": host + "/img/babypenguin.jpg",
          "buttons": [{
            "type": "web_url",
            "url": "https://www.messenger.com/",
            "title": "Show Penguin"
            }, 
            {
            "type": "postback",
            "title": "OMG SO CUTE",
            "payload": "Payload for first element in a generic bubble",
          }],
        },{
          "title": "Baby Penguin #2",
          "subtitle": "The most southerly penguin colony in the world are a group of Adelies that regularly nest near Camp Royds, Antarctica.",
          "image_url": host + "/img/babypenguin2.jpg",
          "buttons": [{
            "type": "web_url",
            "url": "https://www.messenger.com/",
            "title": "Show Penguin"
            }, 
            {
            "type": "postback",
            "title": "OMG SO CUTE",
            "payload": "Payload for first element in a generic bubble",
          }],
        }]
      }
    }
  };

    sendMessage(recipientId, messageData);
};

function penguinFactMessage(recipientId) {
  console.log("penguin fact message");
    
  var messageData = {
    "attachment": {
      "type": "template",
      "payload": {
        "template_type": "generic",
        "elements": [{
          "title": "Penguin Fact #1",
          "subtitle": "About 95% of Galapagos penguins, the most northernly of all penguin species, is found along the western coast of Isabela and around Fernandina Island.",
          "buttons": [{
            "type": "web_url",
            "url": "https://www.messenger.com/",
            "title": "Cool, Next Fact!"
            }],
        }]
      }
    }
  };

    sendMessage(recipientId, messageData);
};

var request;

function sendMessage(recipientId, message) {
    request({
        url: 'https://graph.facebook.com/v2.6/me/messages',
        qs: {access_token: config.access_token},
        method: 'POST',
        json: {
            recipient: {id: recipientId},
            message: message,
        }
    }, function(error, response, body) {
        if (error) {
            console.log('Error sending message: ', error);
        } else if (response.body.error) {
            console.log('Error: ', response.body.error);
        }
    });
};

app.listen(process.env.PORT, process.env.IP, function () {
  console.log('Example app listening on ' + process.env.IP + ' on port ' + process.env.PORT);
});