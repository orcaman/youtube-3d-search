# 3DYouTube.nl

#### the code used on [3DYouTube.nl](http://www.3dyoutube.nl/)

## see it in action
This is the code used on [3DYouTube.nl](http://www.3dyoutube.nl/), a fun little open source project that was born in a small home alone hackathon. It demonstrates some nice concepts, namely working with GAE's python runtime, grunt and angular.js.

## general architecture

The code is hosted on Google App Engine, and is comprised of the following:
- backend: a pytyhon application used to fetch videos from youtube on demand
- YouTube3DClient: this is the frontend project. It's an angular.js project using grunt. the grunt build command compiles the app and copies it to the static folder on the app engine backend
- chrome: a chrome extension that puts the website in the new tab


## private keys/passwords:

The website uses some external services: 
- YouTube API: client and server (to fetch videos on the server and to fetch playlists on the client)
- Add This: a nice component to add a social media sidebar
- Google App Engine: the runtime for the application backend
- Google Analytics

If you want to test the code using your own keys, this is where you would find them:

MainCtrl.js:
 - "your_oauth_2_client_id_here": (line 73) - your OAuth 2 client ID 
 - "your_host_here": (line 443 - the address of your GAE host)

app.yaml:

-"your_app_id_here": (line 1) - your GAE app ID
-"youtube_dev_key": (line 27) - your YouTube Developer API key

index.html
- "your-UA": (line 84) - your Google Analytics UA
- "your add this id": (line 104) - your "Add This" ID

index-mobile.html
- "your-UA": (line 55) - your Google Analytics UA
- "your add this id": (line 75) your add this id - your "Add This" ID

## license

MIT. Copyright (c) Or Hiltch
