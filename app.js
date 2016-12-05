// dependencies
var express = require('express'),
	crypto = require('crypto'),
	bodyParser = require('body-parser'),
	zipcode = require('zipcode'),
	request = require('request');

// Watson Work Services URL
const watsonWork = "https://api.watsonwork.ibm.com";

// Application Id, obtained from registering the application at https://developer.watsonwork.ibm.com
const appId = process.env.WW_CLIENT_ID;

// Application secret. Obtained from registration of application.
const appSecret = process.env.WW_CLIENT_SECRET;

// Webhook secret. Obtained from registration of a webhook.
const webhookSecret = process.env.WW_WEBHOOK_SECRET;

// Username and Password for Retrieve and Rank service.
const rr_username = process.env.RR_USERNAME;
const rr_password = process.env.RR_PASSWORD;

// cluster_id and collection nale of retrieve and rank search.
const rr_cluster_id = process.env.RR_CLUSTER_ID;
const rr_collection  = process.env.RR_COLLECTION;

// Keyword to "listen" for when receiving outbound webhook calls.
const webhookKeyword = process.env.RR_WEBHOOK_CALL;

const failMessage =
`Hey, maybe it's me... maybe it's Retrieve and Rank, but I sense the fail whale should be here... Try again later`;


const app = express();

// Send 200 and empty body for requests that won't be processed.
const ignoreMessage = (res) => {
  res.status(200).end();
}

// Process webhook verification requests
const verifyCallback = (req, res) => {
  console.log("Verifying challenge");

  const bodyToSend = {
    response: req.body.challenge
  };

  // Create a HMAC-SHA256 hash of the recieved body, using the webhook secret
  // as the key, to confirm webhook endpoint.
  const hashToSend =
    crypto.createHmac('sha256', webhookSecret)
    .update(JSON.stringify(bodyToSend))
    .digest('hex');

  res.set('X-OUTBOUND-TOKEN', hashToSend);
  res.send(bodyToSend).end();
};

// Validate events coming through and process only message-created or verification events.
const validateEvent = (req, res, next) => {

  // Event to Event Handler mapping
  const processEvent = {
    'verification': verifyCallback,
    'message-created': () => next()
  };

  // If event exists in processEvent, execute handler. If not, ignore message.
  return (processEvent[req.body.type]) ?
    processEvent[req.body.type](req, res) : ignoreMessage(res);
};

// Authenticate Application
const authenticateApp = (callback) => {

  // Authentication API
  const authenticationAPI = 'oauth/token';

  const authenticationOptions = {
    "method": "POST",
    "url": `${watsonWork}/${authenticationAPI}`,
    "auth": {
      "user": appId,
      "pass": appSecret
    },
    "form": {
      "grant_type": "client_credentials"
    }
  };

  request(authenticationOptions, (err, response, body) => {
    // If can't authenticate just return
    if (response.statusCode != 200) {
      console.log("Error authentication application. Exiting.");
      process.exit(1);
    }
    callback(JSON.parse(body).access_token);
  });
};

// Send message to Watson Workspace
const sendMessage = (spaceId, message, query) => {

  // Spaces API
  const spacesAPI = `v1/spaces/${spaceId}/messages`;

  // Photos API
  const photosAPI = `photos`;

  // Format for sending messages to Workspace
  const messageData = {
    type: "appMessage",
    version: 1.0,
    annotations: [
      {
        type: "generic",
        version: 1.0,
        color: "#1DA1F2",
        title: "Your question : "+ query ,
        text: message
      }
    ]
  };

  // Authenticate application and send message.
  authenticateApp( (jwt) => {

    const sendMessageOptions = {
      "method": "POST",
      "url": `${watsonWork}/${spacesAPI}`,
      "headers": {
        "Authorization": `Bearer ${jwt}`
      },
      "json": messageData
    };

    request(sendMessageOptions, (err, response, body) => {
      if(response.statusCode != 201) {
        console.log("Error posting Retrieve and Rank information.");
        console.log(response.statusCode);
        console.log(err);
      }
    });
  });
};

// Ensure we can parse JSON when listening to requests
app.use(bodyParser.json());

app.get('/', (req, res) => {
  res.send('IBM Watson Workspace app for Retrieve and Rank is alive and happy!');
});

// This is callback URI that Watson Workspace will call when there's a new message created
app.post('/webhook', validateEvent, (req, res) => {


  // Check if the first part of the message is the text that is in the webhook_call env variable.
  // This lets us "listen" for the webhook call keyword.  
// a next version should use NLC to see if the message need to be processed
  var  RRCalled = 1 ;
  var RRQuery = req.body.content;
  // find if the webhookkeyword has been used in the string (at any place) 
  if (req.body.content.indexOf(webhookKeyword) === -1) {
  	// if it's not requested, then we answer only if confidence is > 0.5
       	RRCalled = 0 ;
    } 
    else {
     // get only the question 
     RRQuery = req.body.content.replace(webhookKeyword,'');
     }
 // Send status back to Watson Work to confirm receipt of message
  res.status(200).end();
  
// to be sure not to have a call if message is empty 
  if (req.body.content === '' ){
  	 console.log('return');
  	return;
  }	
 
  
  // Id of space where outbound event originated from.
  const spaceId = req.body.spaceId;

  console.log('Getting Retrieve and Rank results: \'' + RRQuery + '\'');

   
    // test to search in retrieve and rank 
    var RetrieveAndRankV1 = require('watson-developer-cloud/retrieve-and-rank/v1');
    var retrieve = new RetrieveAndRankV1({
        username: rr_username, 
        password: rr_password 
    });



var solrClient = retrieve.createSolrClient({
  cluster_id: rr_cluster_id , 
  collection_name: rr_collection 
});

// get the last ranker id 
retrieve.listRankers({},
  function(err, response) {
    if (err)
      console.log('liste ranker id error: ', err);
    else {
       //console.log(JSON.stringify(response, null, 2));
       //  console.log('ranker_id :' + response.rankers[response.rankers.length-1].ranker_id);
         // search doc in a ranker collections 
         //  Use a querystring parser to encode output.
         var qs = require('qs');
         var ranker_id = response.rankers[response.rankers.length-1].ranker_id;
         var query1     = qs.stringify({q: RRQuery, ranker_id: ranker_id, fl: 'body,ranker.confidence'});

         solrClient.get('fcselect', query1, function(err, searchResponse) {
             if(err) {
               console.log('Error searching for documents: ' + err);
             }
            else {
            	
                // console.log('reponse de retrieve ' + JSON.stringify(searchResponse.response.docs, null, 2));
                // we only send the biggest confidence answer 
                // if the webhook call was not add in the workspace message then we send an answer only if 
                // confidence should be > 0.5 
                var tmp = searchResponse.response.docs[0] ; 
                if (RRCalled === 1 || (RRCalled === 0 && tmp["ranker.confidence"] > 0.5) ){
                	var messageToPost2 = "";
              	    messageToPost2 = "With a confidence of " + Math.round(tmp["ranker.confidence"]* 10000) / 100 + "% Here is the answer to your question :" + tmp["body"];
               	    console.log(messageToPost2);
                 	sendMessage(spaceId, messageToPost2, RRQuery);
                }
              }   

        })
    }});

  
    return;
  });

// Kickoff the main process to listen to incoming requests
app.listen(process.env.PORT || 3000, () => {
  console.log('Retrieve and Rank app is listening on the port');
});
