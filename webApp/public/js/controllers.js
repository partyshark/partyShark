var controllersModule = angular.module('controllersModule',['servicesModule']);

controllersModule.controller('mainController', function($scope, $location, $rootScope, $route, partyService) {
    $scope.playlist = function() {
        $location.path('/'+partyService.getPartyCode()+'/playlist');
    }
    $scope.search = function() {
        $location.path('/'+partyService.getPartyCode()+'/search');
    }
    $scope.exit = function() {
    	if(logout()) {
            $location.path('/');
            $scope.topButtons.splice(0,$scope.topButtons.length);
            $rootScope.exitNotification = true;
        }
        else {
            //Handle error for improper logout here
        }
    }
});

controllersModule.controller('optionsController', function($scope, $rootScope, $location, partyService, optionsService) {
    $rootScope.topButtons = ["playlist", "search", "options", "exit"];
    $scope.startParty = function() {
    	optionsService.setNumParticipants($scope.numParticipants);
    	optionsService.setMaxQueueSize($scope.maxQueue);

    	//Make call to server to start party, on success, obtain party code and redirect
        $location.path('/'+partyService.getPartyCode()+'/playlist');
    }
});

controllersModule.controller('playlistController', function($scope, $location, $rootScope, partyService, playlistService) {
	$rootScope.topButtons = ["playlist", "search", "options", "exit"];
    $scope.emptyPlaylist = playlistService.isEmpty();
    

});

controllersModule.controller('searchController', function($scope, $rootScope, partyService, searchResultsService) {
    $rootScope.topButtons = ["playlist", "search", "options", "exit"];
    $scope.submitSearch = function() {
        searchResultsService.setResults(search($scope.searchParams));
        $scope.searchResults = searchResultsService.getResults();
        $scope.searchParams = "";
    }
});