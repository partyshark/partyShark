var controllersModule = angular.module('controllersModule',['servicesModule']);

controllersModule.controller('mainController', function($scope, $location, $route, partyService) {
    //Handle user eaving party here
    $scope.exit = function() {
    	alert("Leave party communications here");
    	//on success, go to main
    	$location.path('/');
    	//Show successfull logout notification
    }
});

controllersModule.controller('optionsController', function($scope, $location, partyService, optionsService) {
    $scope.startParty = function() {
    	optionsService.setNumParticipants($scope.numParticipants);
    	optionsService.setMaxQueueSize($scope.maxQueue);

    	//Make call to server to start party, on success, obtain party code and redirect
        $location.path('/'+partyService.getPartyCode()+'/playlist');
    }
});

controllersModule.controller('playlistController', function($scope, $rootScope, optionsService) {
	$rootScope.topButtons = ["playlist", "search", "options", "exit"];

});

controllersModule.controller('searchController', function($scope, partyService) {
    
});