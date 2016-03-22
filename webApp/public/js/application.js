var partyShark = angular.module('partyShark', ['ngRoute', 'servicesModule', 'controllersModule', 'directivesModule']);

partyShark.config(function($routeProvider) {
    $routeProvider
        .when('/', {
            templateUrl : 'views/home.html',
            controller  : 'NavController'
        })

        .when('/joinParty', {
            templateUrl : 'views/joinParty.html',
            controller  : 'joinPartyController'
        })

        .when('/:partyCode/options', {
            templateUrl : 'views/options.html',
            controller  : 'optionsController'
        })

        .when('/startParty', {
            templateUrl : 'views/startParty.html',
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
});
