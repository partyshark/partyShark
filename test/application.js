var partyShark = angular.module('partyShark', ['ngRoute', 'servicesModule', 'controllersModule', 'directivesModule']);

partyShark.config(function($routeProvider) {
    $routeProvider
        .when('/', {
            templateUrl : 'views/home.html',
            controller  : 'HomeController'
        })

        .when('/join-party', {
            templateUrl : 'views/join-party.html',
            controller  : 'joinPartyController'
        })

        .when('/:partyCode/options', {
            templateUrl : 'views/options.html',
            controller  : 'optionsController'
        })

        .when('/start-party', {
            templateUrl : 'views/start-party.html',
            controller  : 'startPartyController'
        })

        .when('/:partyCode/playlist', {
            templateUrl : 'views/playlist.html',
            controller  : 'playlistController'
        })

        .when('/:partyCode/search', {
            templateUrl : 'views/search.html',
            controller  : 'searchController'
        })

        .otherwise({
            redirectTo: '/'
        })
});
