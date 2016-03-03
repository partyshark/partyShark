var partyShark = angular.module('partyShark', ['ngRoute', 'servicesModule', 'controllersModule', 'directivesModule']);

partyShark.config(function($routeProvider) {
    $routeProvider
        .when('/', {
            templateUrl : 'views/home.html',
            controller  : 'mainController'
        })

        .when('/options', {
            templateUrl : 'views/options.html',
            controller  : 'optionsController'
        })

        .when('/:partyCode/playlist', {
            templateUrl : 'views/playlist.html',
            controller  : 'playlistController'
        })

        .when('/:partyCode/search', {
            templateUrl : 'views/search.html',
            controller  : 'searchController'
        })
});
