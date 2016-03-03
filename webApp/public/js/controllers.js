var controllersModule = angular.module('controllersModule',['servicesModule']);

controllersModule.controller('mainController', function($scope, $location, $rootScope, $route, partyService, netService) {
    $scope.playlist = function() {
        $location.path('/'+partyService.getPartyCode()+'/playlist');
    }
    $scope.search = function() {
        $location.path('/'+partyService.getPartyCode()+'/search');
    }
    $scope.exit = function() {
    	if(leaveParty()) {
            $location.path('/');
            $scope.topButtons.splice(0,$scope.topButtons.length);
            $rootScope.exitNotification = true;
        }
        else {
            //Handle error for improper logout here
        }
    },
    $scope.sendContact = function() {
        netService.sendContact({
            "name": $scope.contactName,
            "email": $scope.contactEmail,
            "phone": $scope.contactPhone,
            "message": $scope.contactMessage
        });
        alert("Message send triggered.");
    }
});

controllersModule.controller('joinPartyController', function($scope, $location, netService) {
    $scope.joinParty = function() {
        netService.getParty($scope.partyCode)
            .then(function(data) {
                if(data)
                    $location.path('/'+$scope.partyCode+'/playlist');
                else
                    alert("Could not connect to server, please try again.");
            }, function(error) {
                alert("Error joining party.")
            });
    },
    $scope.backHome = function() {
        $location.path('/');
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

controllersModule.controller('playlistController', function($scope, $rootScope, playlistService, partyService, netService) {
	$rootScope.topButtons = ["playlist", "search", "options", "exit"];

    //if local partycode is empty, must have joined via link, fetch party from server
    if(partyService.getPartyCode() == "") {
        netService.getParty($scope.partyCode)
            .then(function(data) {
                if(data)
                    $location.path('/'+partyService.getPartyCode()+'/playlist');
                else
                    alert("Could not connect to server, please try again.");
            }, function(error) {
                alert("Error joining party.")
            });
    }

    //fetch existing playlist from server


    $scope.emptyPlaylist = playlistService.isEmpty();
    $scope.playlist = playlistService.getPlaylist();
});

controllersModule.controller('searchController', function($scope, $location, $rootScope, partyService, playlistService) {
    $rootScope.topButtons = ["playlist", "search", "options", "exit"];
    $scope.submitSearch = function() {
        $scope.searchResults = search($scope.searchParams);
        $scope.searchParams = "";
    }
    $scope.addSong = function(id) {
        if(playlistService.addSong(id)) {
            $location.path('/'+partyService.getPartyCode()+'/playlist');
        }
    }
});