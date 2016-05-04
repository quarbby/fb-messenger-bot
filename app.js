var express = require('express');
var bodyParser = require('body-parser');
var request = require("request");

var config = require("./config");

var app = express();

app.use(bodyParser.json());
app.use(bodyParser.text({ type: 'text/html' }))
app.use(bodyParser.urlencoded({ extended: true }));

app.use('/img', express.static(__dirname + '/img'));

/*
* Just a function I use to test console logs and responses 
*/
app.get('/', function (req, res) {
  res.send('Hello World!');
  var str = "how about some pizza";
  console.log(encodeURI(str));
  console.log(req.get('host'));
  
  /*
  request.get('https://api.wit.ai/message?q=pizza%20please', {
    headers: {
      'Authorization': 'Bearer EQRDHTUB2PXKTSKICUUB2PGCWZ47G65F'
    }
  })
  .on('response', function(response) {
    console.log(response)
  })
  
});
*/

  request({
      url: 'https://api.wit.ai/message?q=pizza%20please', //URL to hit
      method: 'GET', //Specify the method
      headers: { //We can define headers too
        'Authorization': 'Bearer EQRDHTUB2PXKTSKICUUB2PGCWZ47G65F'
      }
  }, function(error, response, body){
      if(error) {
          console.log(error);
      } else {
          var bodyjsonparse = JSON.parse(body);
          var intent = bodyjsonparse["outcomes"][0]["entities"]["intent"][0]["value"];
          console.log(intent);
      }
  });
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
  console.log("app.post ran")
  
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
          "image_url": config.host + "/img/babypenguin.jpg",
          "buttons": [{
            "type": "postback",
            "url": "OMG So CUTE",
            "title": "next_picture"
          }, 
          {
            "type": "postback",
            "title": "Okay, cuteness overload",
            "payload": "end_convo",
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
            "type": "postback",
            "title": "Cool, Next Fact!",
            "payload": "next_fact"
          },
          {
            "type": "postback",
            "title": "Enough facts for now",
            "payload": "end_convo"
            }],
        }]
      }
    }
  };

    sendMessage(recipientId, messageData);
};

/*
* Send Message function
* Message should be in a JSON format 
* If just sending a text it's {text: text}
*/

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