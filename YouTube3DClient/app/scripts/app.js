var app = angular.module('YouTube3DApp', ['ui.bootstrap'])
.config(function ($interpolateProvider) {
	$interpolateProvider.startSymbol('[[');
	$interpolateProvider.endSymbol(']]');
}).run(function(){
});
