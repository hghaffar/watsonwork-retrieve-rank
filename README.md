
# Retrieve and Rank App Sample for IBM Watson Workspace

App built with node.js to listen to messages posted in a space in IBM Watson Workspace and returns back answer from a collections of documents using Watson Retrieve and Rank. 

This app will listen for `@RR <phrase>` and find the answer in a Retrieve and Rank collections.

The Watson Work platform provides **spaces** for people to exchange
**messages** in conversations. This app shows how to listen to a conversation
and receive messages on a Webhook endpoint, then send response messages back
to the conversation. It also demonstrates how to authenticate an application
and obtain the OAuth token needed to make Watson Work API calls.

## Deploy the app
Assuming you just want to take this code and get it running before hacking it, the first step is to get it deployed to a live on a server so that IBM Watson Workspace validates it's up and working before pushing messages to the app. 

To facilitate things, you can click the button below and it'll get it going to Bluemix very easily, however this is **NOT** required. Feel free to deploy on any server you want.

[![Deploy to Bluemix](https://bluemix.net/deploy/button.png)](https://bluemix.net/deploy?repository=https://github.com/watsonwork/watsonwork-retrieve-rank)

*Note*: you can run this code locally, but then you would need to change the webhook code to get the URL of the callback. See Appendix for instructions.

Once the code is live, make note of the URL (e.g. http://mysuperawesomeurl.mybluemix.net) as you'll need this later.

## How to register the Retrieve Rank App with IBM Watson Workspace
Now let's register the app to get some API keys and get things going. 
First, we need several API keys from Watson Retrieve&Rank. You can get them by going go to bluemix in the Retrieve and Rank service. 
In a couple of steps you can super easily register a "bot". 

get  RR_USERNAME :   Username in the retrieve and rank servce credentials
get  RR_PASSWORD : password in the retrieve and rank servce credentials
get  RR_CLUSTER_ID : the cluster_id of your repository in conversion services
get  RR_COLLECTION : name of the collection that contains the document to search
```

Second, let's register the app with IBM Watson Workspace and get some keys!

1. Go to [the developer apps page](https://workspace.ibm.com/developer/apps)
2. On the left, enter the `App Name` and the `Description of App`
3. Click on `Add an outbound webhook`
4. Give the webhook a name (e.g. "listen for messages") and check the `message-created` webhook. This is how we'll listen to messages in a space
5. In the callback URL, specify the URL for your app. This code assumes that the webhook listener is at `https://yoururl/webhook` so don't forget to add `/webhook` to the end of the URL (if you don't know where the app will be deployed, use a sample URL for now, like `https://twitter.acme.com/webhook` and you can modify that later)
6. Click on `Register app`
7. This will give you the App ID, App secret and webhook secret. You *need to save* these to environment variables called `TWITTER_CLIENT_ID`, `TWITTER_CLIENT_SECRET`, and `TWITTER_WEBHOOK_SECRET` respectively

At this point the webhook is not enabled since the system has not been able to verify it's up and running. While the webhook is probably running on Bluemix, it doesn't have the variables set

## Configure your app

Now that we have the API keys, set them as environment variables. If you are using Bluemix, you can set them up following these steps:

1. Go to [the Bluemix console](https://console.ng.bluemix.net/dashboard/applications/) and click on your app
2. Go to Runtime -> Environment Variables
3. Define the 7 variables from above: `WW_CLIENT_ID`, `WW_CLIENT_SECRET`, `WW_WEBHOOK_SECRET`, `RR_USERNAME`, `RR_USERNAME`, `RR_CLUSTER_ID` and `RR_COLLECTION`, provide the right values and save them.
4. Define a variable RR_WEBHOOK_CALL if you want to change the key @RR that told the bot that the question is for him to answer.  
4. Stop and start the app so the values take effect.

You are almost there!!! 

## Enable the webhook

1. Assuming all environment variables are set (see above), go back to the [IBM Watson Work Services apps page](https://workspace.ibm.com/developer/apps) and click on the pencil icon to edit your app
2. Check the box to enable your webhook
3. Save your changes by clicking on "Edit app"

This now does an HTTP POST verification call to ensure your webhook is setup properly. This will also ensure that all your variables and code are good to go. If so, the webhook is now enabled and it's ready to be used! How easy was that!?!

## Add the Retrieve and Rank app to a space to test
We are almost there! Now we need to add the app to spaces that we want to listen for messages, and where the app will post messages to.

1. Head out to [IBM Watson Workspace](https://workspace.ibm.com) and go to your favorite space
2. Go into the space settings
3. Click on `Apps` to go the apps menu
4. Click on your app to add it to the space
5. Type in `@RR with a question` and the app should respond with the better ranker answer. If you omit the @RR then the app will answer only if the answer's confidence is > 50%

Have fun!!

## What API does the app use?

The app uses the [Watson Work OAuth API]
(https://workspace.ibm.com/developer/docs) to authenticate and get an
OAuth token. It implements a Webhook endpoint according to the
[Watson Work Webhook API](https://workspace.ibm.com/developer/docs) to
listen to conversations and receive messages. Finally, it uses the
[Watson Work Spaces API] (https://workspace.ibm.com/developer/docs) to send
back greeting messages.


## License and Dependencies
Licensed under Apache 2.0 (see LICENSE)

Depends on:
* body-parser
* express
* request
* twitter
* request
* watson-developer-cloud