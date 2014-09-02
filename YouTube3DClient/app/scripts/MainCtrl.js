var inputID = 'query';
var maxItems = 5;
var isGoogleApiClientReady = false;
var appendSelectedVideoDone = false;
googleApiClientReady = function() {
	isGoogleApiClientReady = true;
}


app.controller('MainCtrl', function($scope, $http, $document, $timeout, browser) {
	$('.preloader').fadeOut(2500);
	if (browser() === 'firefox') {
		$('#button').css('padding-bottom', 2);
	}
	$('#login').hide();
	$scope.nowShowingTitle = 'now playing:';
	$scope.nowShowingDesc = 'most popular in ' + YouTube3DAppConfig.globals.country;
	$scope.loginText = 'my playlists';
	$scope.selected = undefined;
	$scope.onSearchTermSelected = function ($item) {
		$scope.doSearch($item);
	};

	$scope.doFbShare = function() {
		_gaq.push(['_trackEvent', YouTube3DAppConfig.globals.category, 'fb-share-site']);
		popupwindow('https://www.facebook.com/sharer/sharer.php?u=http%3A%2F%2Fwww.3dyoutube.nl', 'facebook', 550, 300);
		function popupwindow(url, title, w, h) {
			var left = (screen.width/2)-(w/2);
			var top = (screen.height/2)-(h/2);
			return window.open(url, title, 'toolbar=no, location=no, directories=no, status=no, menubar=no, scrollbars=no, resizable=no, copyhistory=no, width='+w+', height='+h+', top='+top+', left='+left);
		} 
	}
	$scope.getTerms = function(q) {
		return $http.jsonp("https://suggestqueries.google.com/complete/search?client=chrome&q="+q+"&callback=JSON_CALLBACK")
		.then(function(response){
			if (response && response.data && response.data.length > 1) {
				var rslt = response.data[1].slice(0, maxItems - 1);
				for (var i in rslt) {
					if (rslt[i].indexOf('http://') === 0 || rslt[i].indexOf('https://') === 0) {
						var removed = rslt.splice(i, 1);
					}
				}
				rslt = rslt.slice(0, 4);
				if ($('#' + inputID).val()) {
					rslt.unshift($('#' + inputID).val());
				}
				return rslt;
			}
		});
	};

	$scope.doSearch = function(iQ) {
		var q = iQ || $('#searchInput').val();
		if (q == undefined || q == null || (q != null && q.toString().length === 0)) {
			return;
		}
		$scope.nowShowingTitle = 'search results:';
		$scope.nowShowingDesc = ' ' + q + ' ';
		search(q);
	}

	$document.bind('keypress', function(e) {
		if(e.which == 13) {
			$scope.doSearch();
		} else {
			if (!$('#' + inputID).is(":focus")) {
				$('#' + inputID).focus();
			}
		}
	});


	var OAUTH2_CLIENT_ID = 'your_oauth_2_client_id_here';
	var OAUTH2_SCOPES = [
	'https://www.googleapis.com/auth/youtube'
	];

	function handleAuthResult(authResult) {
		if (authResult && !authResult.error) {
			if (clicked) {	
				$scope.onChangePlaylistLinkClicked();
			}
			$('.pre-auth').hide();
			$('.post-auth').show();
			$('#login').hide();
			$('#change').show();
		} else {
			$('#login').show();
			$('#change').hide();

		}
	}
	function checkAuth() {
		gapi.auth.authorize({
			client_id: OAUTH2_CLIENT_ID,
			scope: OAUTH2_SCOPES,
			immediate: true
		}, handleAuthResult);
	}


	function initGoogleApiAuth() {
		if (!isGoogleApiClientReady) {
			$timeout(initGoogleApiAuth, 100);
			return;
		}
		gapi.auth.init(function() {
			window.setTimeout(checkAuth, 1);
		});  
	}
	var clicked = false;
	$scope.doAuthorize_Notif = function() {
		_gaq.push(['_trackEvent', YouTube3DAppConfig.globals.category, 'playlist-click']);
		if (!clicked) {
			clicked = true;
			$scope.loginText = 'login with Google';
			$('#icon-login').removeClass('fa-bars').addClass('fa-google');
		} else {
			$scope.loginText = 'my playlists';
			$scope.doAuthorize();
		}
	}

	$scope.doAuthorize = function() {
		gapi.auth.authorize({
			client_id: OAUTH2_CLIENT_ID,
			scope: OAUTH2_SCOPES,
			immediate: false
		}, handleAuthResult);
	}

	initGoogleApiAuth();
	$scope.items = [];

	$scope.onEnter = function() {
		$scope.nowShowingTitle='choose playlist';
	}

	$scope.onLeave = function() {
		$scope.nowShowingTitle='now playing:';	
	}
	$scope.onChangePlaylistLinkClicked = function() {
		_gaq.push(['_trackEvent', YouTube3DAppConfig.globals.category, 'playlist', 'view']);
		gapi.client.load('youtube', 'v3', function() {
			var request = gapi.client.youtube.playlists.list({
				mine: true,
				part: 'snippet,contentDetails'
			});
			request.execute(function(response) {
				var result = [];
				for (var i = 0; i < response.result.items.length; i++) {
					playlistID = response.result.items[i].id;
					playlistTitle = response.result.items[i].snippet.title;
					numOfVids = response.result.items[i].contentDetails.itemCount;
					result.push({title: playlistTitle + ' ('+numOfVids+')', id: playlistID});
				}
				$timeout(function() {
					$scope.items = result;
					$('.dropdown-menu-change').show();
				}, 0);
			});
		});
	}

	$scope.onPlaylistChanged = function(playlistId, playlistTitle) {
		_gaq.push(['_trackEvent', YouTube3DAppConfig.globals.category, 'playlist', playlistTitle]);
		$('.dropdown-menu-change').hide();
		var requestOptions = {
			playlistId: playlistId,
			part: 'snippet',
			maxResults: 50
		};
		var request = gapi.client.youtube.playlistItems.list(requestOptions);
		request.execute(function(response) {
			var playlistItems = response.result.items;
			if (playlistItems) {
				cleanScene();
				$timeout(function() {
					$scope.nowShowingTitle = 'now playing:';
					$scope.nowShowingDesc = ' ' + playlistTitle.replace(')', ' videos)') + ' ';
				}, 0);
				for (var i = 0; i < playlistItems.length; i++) {
					( function ( data, time ) {
						setTimeout( function () {
							scene.add( new Element(data, true) );
						}, time );
					} )( playlistItems[ i ], i * 15 );
				}
			}
		});
	}


	_gaq.push(['_trackEvent', YouTube3DAppConfig.globals.category, 'view', YouTube3DAppConfig.globals.selectedVideoID]);
	var camera, scene, renderer;
	var player;

	var auto = true;
	var currentlyPlayingVideoID = '';
	var Element = function ( entry, isPlaylistItem ) {
		var vidID = isPlaylistItem ? entry.snippet.resourceId.videoId : entry.id.$t.split(':').pop();
		var vidTitle = isPlaylistItem ? entry.snippet.title : entry.title.$t.split(':').pop();
		vidTitle = vidTitle ? vidTitle : '';
		var w = YouTube3DAppConfig.globals.isMobile ? 240 : 480;
		var h = YouTube3DAppConfig.globals.isMobile ? 180 : 360;
		var dom = document.createElement( 'div' );
		dom.style.width = w + 'px';
		dom.style.height = h + 'px';
		dom.setAttribute('data-selected-video', vidID);

		var image = document.createElement( 'img' );
		image.style.position = 'absolute';
		image.style.width = w + 'px';
		image.style.height = h + 'px';
		var imgSrc = isPlaylistItem ? entry.snippet.thumbnails.high.url : entry.media$group.media$thumbnail[ 2 ].url;
		image.src = imgSrc;

		dom.appendChild( image );

		var button = document.createElement( 'img' );
		button.style.position = 'absolute';
		button.style.left = ( ( w - 86 ) / 2 ) + 'px';
		button.style.top = ( ( h - 61 ) / 2 ) + 'px';
		button.style.visibility = 'hidden';
		button.style.WebkitFilter = 'grayscale()';

		button.src = 'data:image/png;base64,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';
		dom.appendChild( button );

		var blocker = document.createElement( 'div' );
		blocker.style.position = 'absolute';
		blocker.style.width = w + 'px';
		blocker.style.height = h + 'px';
		blocker.style.background = 'rgba(0,0,0,0.5)';
		blocker.style.cursor = 'pointer';
		dom.appendChild( blocker );

		var object = new THREE.CSS3DObject( dom );
		object.position.x = Math.random() * 4000 - 2000;
		object.position.y = 3000;
		object.position.z = Math.random() * - 5000;

		image.addEventListener( 'load', function ( event ) {

			button.style.visibility = 'visible';

			new TWEEN.Tween( object.position )
			.to( { y: Math.random() * 2000 - 1000 }, 2000 )
			.easing( TWEEN.Easing.Exponential.Out )
			.start();

		}, false );

		dom.addEventListener( 'mouseover', function () {

			button.style.WebkitFilter = '';
			blocker.style.background = 'rgba(0,0,0,0)';

		}, false );

		dom.addEventListener( 'mouseout', function () {

			button.style.WebkitFilter = 'grayscale()';
			blocker.style.background = 'rgba(0,0,0,0.75)';

		}, false );

		dom.addEventListener( 'click', function ( event ) {

			if (currentlyPlayingVideoID === vidID) {
				return false;
			}
			currentlyPlayingVideoID = vidID;
			event.stopPropagation();

			auto = false;

			if ( player !== undefined ) {

				player.parentNode.removeChild( player );
				player = undefined;

			}

			player = document.createElement( 'iframe' );
			player.style.position = 'absolute';
			player.style.width = w + 'px';
			player.style.height = h + 'px';
			player.style.border = '0px';

			player.src = 'http://www.youtube.com/embed/' + vidID + '?rel=0&autoplay=1&controls=1&showinfo=0';
			this.appendChild( player );
			var params = "'" + vidID + "','" + imgSrc + "'";
			if (!$(this).find('.fb-on-display').length) {
				$(this).append('<a class="fb-on-display" onclick="shareVideo('+params+')"><i class="fa fa-facebook-square icon-small"></i>Share this video</a><br><p class="vid-title">'+vidTitle+'</p>');
			}
			_gaq.push(['_trackEvent', YouTube3DAppConfig.globals.category, 'video-click', vidID ]);
					//

					$timeout(function() {
						try {
							$scope.nowShowingDesc = vidTitle.length > 38 ? vidTitle.substr(0, 37) + '...' : vidTitle;
						} catch (ex) {
							$scope.nowShowingDesc  = '';
						}
					}, 0);

					var prev = object.position.z + 400;

					new TWEEN.Tween( camera.position )
					.to( { x: object.position.x, y: object.position.y - 25 }, 1500 )
					.easing( TWEEN.Easing.Exponential.Out )
					.start();

					new TWEEN.Tween( { value: prev } )
					.to( { value: 0  }, 2000 )
					.onUpdate( function () {

						move( this.value - prev );
						prev = this.value;

					} )
					.easing( TWEEN.Easing.Exponential.Out )
					.start();

				}, false );

return object;

};

init();
animate();

function init() {

	camera = new THREE.PerspectiveCamera( 75, window.innerWidth / window.innerHeight, 1, 5000 );
	camera.position.y = - 25;

	scene = new THREE.Scene();

	renderer = new THREE.CSS3DRenderer();
	renderer.setSize( window.innerWidth, window.innerHeight );
	renderer.domElement.style.position = 'absolute';
	renderer.domElement.style.top = '45px';
	document.getElementById( 'container' ).appendChild( renderer.domElement );

	var query = document.getElementById( 'query' );
	query.addEventListener( 'keyup', function ( event ) {

		if ( event.keyCode === 13 ) {

			search( query.value );

		}

	}, false );

	query.addEventListener( 'click', function ( event ) {

	}, false );

	var button = document.getElementById( 'button' );
	button.addEventListener( 'click', function ( event ) {

		search( query.value );

	}, false );

	if ( window.location.hash.length > 0 ) {

		query.value = decodeURIComponent(window.location.hash.substr( 1 ));

	}

	var q = query.value ? query.value : '';
	search(q);

	document.body.addEventListener( 'mousewheel', onMouseWheel, false );

	document.body.addEventListener( 'click', function ( event ) {

		auto = true;

		if ( player !== undefined ) {

			player.parentNode.removeChild( player );
			player = undefined;
			currentlyPlayingVideoID = '';
			$('.vid-title').remove();
			$('.fb-on-display').remove();

		}

		new TWEEN.Tween( camera.position )
		.to( { x: 0, y: - 25 }, 1500 )
		.easing( TWEEN.Easing.Exponential.Out )
		.start();

	}, false );

	window.addEventListener( 'resize', onWindowResize, false );

}

function cleanScene() {

	for ( var i = 0, l = scene.children.length; i < l; i ++ ) {

		( function () {

			var object = scene.children[ i ];
			var delay = i * 15;

			new TWEEN.Tween( object.position )
			.to( { y: - 2000 }, 1000 )
			.delay( delay )
			.easing( TWEEN.Easing.Exponential.In )
			.onComplete( function () {

				scene.remove( object );

			} )
			.start();

		} )();

	}

}


function search( term ) {
	window.location.hash = encodeURIComponent(term);

	cleanScene();
	$('.dropdown-menu-change').hide();

	if (term && term.length > 0) {
		_gaq.push(['_trackEvent', YouTube3DAppConfig.globals.category, 'search', term]);
	} 

	var host = '<your_host_here>'
	$.getJSON(host + '/api/search?q=' + encodeURIComponent(term))
	.success(function(data) {
		var entries = data.feed.entry;
		if (YouTube3DAppConfig.globals.category === 'video' && !appendSelectedVideoDone) {
			appendSelectedVideoDone = true;
			var entry = {};
			entry.isPlaylistItem = true;
			entry.snippet = {};
			entry.snippet.thumbnails = {};
			entry.snippet.thumbnails.high = {};
			entry.snippet.thumbnails.high.url = YouTube3DAppConfig.globals.selectedVideoThumbnail;
			entry.snippet.resourceId = {};
			entry.snippet.resourceId.videoId = YouTube3DAppConfig.globals.selectedVideoID;
			entries.push(entry);
		}
		for ( var i = 0; i < entries.length; i ++ ) {
			( function ( data, time ) {
				setTimeout( function () {
					scene.add(new Element(data,data.isPlaylistItem));
				}, time );
			} )( entries[ i ], i * 15 );
		}
		setTimeout(function() {
			var imagesToClick = $('[data-selected-video="' + YouTube3DAppConfig.globals.selectedVideoID + '"]');
			imagesToClick.first().click();
		}, 3000);

	})
	.error(function() {
		$('.error').show();
		_gaq.push(['_trackEvent', YouTube3DAppConfig.globals.category, 'ajax-error']);
	});
}



function move( delta ) {

	for ( var i = 0; i < scene.children.length; i ++ ) {

		var object = scene.children[ i ];

		object.position.z += delta;

		if ( object.position.z > 0 ) {

			object.position.z -= 5000;

		} else if ( object.position.z < - 5000 ) {

			object.position.z += 5000;

		}

	}

}

function onMouseWheel( event ) {

	move( event.wheelDelta );

}

function onWindowResize() {

	camera.aspect = window.innerWidth / window.innerHeight;
	camera.updateProjectionMatrix();

	renderer.setSize( window.innerWidth, window.innerHeight );

}

function animate() {

	requestAnimationFrame( animate );

	TWEEN.update();

	if ( auto === true ) {

		move( 1 );

	}

	renderer.render( scene, camera );

}

function getParameterByName(name) {
	name = name.replace(/[\[]/, "\\[").replace(/[\]]/, "\\]");
	var regex = new RegExp("[\\?&]" + name + "=([^&#]*)"),
	results = regex.exec(location.search);
	return results == null ? "" : decodeURIComponent(results[1].replace(/\+/g, " "));
}

$(document).ready(function() {
	if (getParameterByName('popup') === '1') {
		$('.now-showing').hide();
		$('input').width(250);
		$('#search').width(300);
		$('#search').css('left', 83);
	}
});

});


function shareVideo(vidID, thumb) {
	_gaq.push(['_trackEvent', YouTube3DAppConfig.globals.category, 'fb-share-video']);
	var url = 'https://www.facebook.com/sharer/sharer.php?u=http%3A%2F%2Fwww.3dyoutube.nl%2Fvideo%2F' + encodeURIComponent(btoa(vidID)) + '%2F' + encodeURIComponent(btoa(thumb));
	popupwindow(url, 'facebook', 550, 300);
	function popupwindow(url, title, w, h) {
		var left = (screen.width/2)-(w/2);
		var top = (screen.height/2)-(h/2);
		return window.open(url, title, 'toolbar=no, location=no, directories=no, status=no, menubar=no, scrollbars=no, resizable=no, copyhistory=no, width='+w+', height='+h+', top='+top+', left='+left);
	} 
}

app.service('browser', ['$window', function($window) {

	return function() {

		var userAgent = $window.navigator.userAgent;

		var browsers = {chrome: /chrome/i, safari: /safari/i, firefox: /firefox/i, ie: /internet explorer/i};

		for(var key in browsers) {
			if (browsers[key].test(userAgent)) {
				return key;
			}
		};

		return 'unknown';
	}

}]);