var express = require('express');
var bodyParser = require('body-parser');
var request = require("request");

var config = require("./config");

var app = express();

app.use(bodyParser.json());
app.use(bodyParser.text({ type: 'text/html' }))
app.use(bodyParser.urlencoded({ extended: true }));

app.use('/img', express.static(__dirname + '/img'));

/* Some globals because I can't solve some Javascript problems :( */

var text = "";
var userid = "";

/*
* Just a function I use to test console logs and responses 
*/

app.get('/', function (req, res) {
  res.send('Hello World!');
  var str = "how about some pizza";
  console.log(encodeURI(str));
  console.log(req.get('host'));

});

/*
* Function for Facebook App validation 
* Currently not needed anymore
*/

app.get('/webhook/', function (req, res) {
  if (req.query['hub.verify_token'] === 'penguin_dragon') {
    res.send(req.query['hub.challenge']);
    console.log("Veryfing success");
    res.sendStatus(200)
  }

  console.log("Error: wrong validation token")
})


/* This function is where we receive messages from Facebook
*
*/

app.post('/webhook/', function (req, res) {
  var messaging_events = req.body.entry[0].messaging;
  console.log("facebook message received");
  
  for (var i = 0; i < messaging_events.length; i++) {
    var event = req.body.entry[0].messaging[i];
    userid = event.sender.id;
    if (event.postback) {
      var payload = event.postback.payload;
      console.log("Postback received: " + payload);
      
      executeIntent(payload);
      
    }
    else if (event.message && event.message.text) {
        text = event.message.text;
  
        getRequest();        
    }
    
  }
  res.sendStatus(200);
});

function getRequest(callback) {
  console.log("text " + text);
  request({
      url: 'https://api.wit.ai/message?q=' + encodeURI(text), 
      method: 'GET', 
      headers: { 
        'Authorization': 'Bearer ' + config.wit_access_token
      }
  }, function(error, response, body){
      if(!error && response.statusCode == 200) {
        var bodyjsonparse = JSON.parse(body);
        var intent = bodyjsonparse["outcomes"][0]["entities"]["intent"][0]["value"];
        console.log("intent " + intent);
        
        executeIntent(intent);
          
      }
  });
}

function executeIntent(intent) {
  console.log("Calling intent " + intent);
  
  switch (intent) {
    case "help":
      showHelp();
      break;
    case "greeting":
      sendGreeting();
      break;
    case "picture":
      console.log("Picture");
      sendPenguinPhoto(userid);
      break;
    case "fact":
      sendPenguinFact(userid);
    case "food":
      sendFoodMessage();
      break;
    case "goodbye":
      sendGoodbye();
      break;
    default:
      sendDefault();
      break;
  }   
}

function sendPenguinPhoto(recipientId) {
  console.log("photo message");
    
  var messageData = {
    "attachment": {
      "type": "template",
      "payload": {
        "template_type": "generic",
        "elements": [{
          "title": "Baby Penguin #1",
          "subtitle": "All 18 species of penguins live in the Southern Hemisphere.",
          "image_url": config.host + "/img/babypenguin.jpg",
          "buttons": [{
            "type": "postback",
            "title": "OMG SO CUTE",
            "payload": "picture"
          }, 
          {
            "type": "postback",
            "title": "Okay, enough distraction",
            "payload": "goodbye",
          }],
        }]
      }
    }
  };

    sendMessage(recipientId, messageData);
};

function sendPenguinFact(recipientId) {
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
            "type": "postback",
            "title": "Cool, Next Fact!",
            "payload": "fact"
          },
          {
            "type": "postback",
            "title": "Okay, enough distraction",
            "payload": "goodbye"
            }],
        }]
      }
    }
  };

    sendMessage(recipientId, messageData);
};

function showHelp() {
  var message = {text: "Penguins are naturally blur. Type 'picture' for cute penguin pictures, " +
              "'fact' for penguin trivia, 'joke' for some laughter and 'food' for hungry penguins"
  };
  sendMessage(userid, message);
}

function sendGreeting() {
  var message = {text: "Hello, Penguin here! What would you like to do today?\n" +
                "How about a penguin picture, fact, joke or food?"
  };
  sendMessage(userid, message);
}

function sendFoodMessage() {
  
}

function sendDefault() {
  
}

function sendGoodbye() {
  var message = {text: "Goodbye! Penguin will miss you!"};
  sendMessage(userid, message);
}

/*
* Send Message function
* Message should be in a JSON format 
* If just sending a text it's {text: text}
*/

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