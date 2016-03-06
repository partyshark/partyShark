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

controllersModule.controller('optionsController', function($scope, $rootScope, $location, partyService, optionsService, netService) {
    $rootScope.topButtons = ["playlist", "search", "options", "exit"];
    $scope.startParty = function() {
    	optionsService.setNumParticipants($scope.numParticipants);
    	optionsService.setMaxQueueSize($scope.maxQueue);

    	//Make call to server to start party, on success, obtain party code and redirect
        netService.createParty()
            .then(function(data) {
                    //Set party options once party is created
                    netService.updatePartySettings()
                        .then(function(data) {
                            $location.path('/'+partyService.getPartyCode()+'/playlist');
                        }, function(error) {
                            if(error.what) {
                                console.log(error.what);
                                console.log(error.why);
                            }
                            else
                                console.log("Unable to contact server.");
                            console.log("Error setting party settings.");
                        });
            }, function(error) {
                console.log(error.what);
                console.log(error.why);
                console.log("Unable to contact server.");
                console.log("Error creating party.");

            });
        
    }
});

controllersModule.controller('playlistController', function($scope, $rootScope, playlistService, partyService, netService) {
	$rootScope.topButtons = ["playlist", "search", "options", "exit"];
    //$scope.isPlayer = (partyService.getPlayerName() == partyService.getUserName()) ? true : false;
    $scope.isPlayer = true;

    DZ.init({
            appId  : '174261',
            channelUrl : 'https://www.partyshark.tk/channel.html',
            player : {
            onload : function(){
                    
                }
            }
        });

    $scope.playRadio = function() {
        DZ.player.playRadio(37151);
    }

    //if local partycode is empty, must have joined via link, fetch party from server
    if(partyService.getPartyCode() == "") {
        netService.getParty($scope.partyCode)
            .then(function(data) {
                if(data)
                    $location.path('/'+partyService.getPartyCode()+'/playlist');
                else
                    alert("Could not connect to server, please try again.");
            }, function(error) {
                alert("Error joining party.");
            });
    }

    //fetch existing playlist from server
    netService.getPlaylist($scope.partyCode)
            .then(function(data) {
                if(data) {
                    $scope.emptyPlaylist = playlistService.isEmpty();
                    $scope.playlist = playlistService.getPlaylist();
                }
                else
                    alert("Could not connect to server, please try again.");
            }, function(error) {
                alert("Error joining party.")
            });
});

controllersModule.controller('searchController', function($scope, $location, $rootScope, partyService, playlistService, netService) {
    $rootScope.topButtons = ["playlist", "search", "options", "exit"];
    $scope.submitSearch = function() {
        netService.searchSongs($scope.searchParams)
            .then(function(data) {
                if(data)
                    $scope.searchResults = data;
                else
                    alert("Could not connect to server, please try again.");
            }, function(error) {
                alert("Error fetching search results party.")
            });
    },
    $scope.addSong = function(songCode) {
        netService.createPlaythrough(songCode)
            .then(function(data) {
                if(data)
                    $location.path('/'+partyService.getPartyCode()+'/playlist');
                else
                    alert("Could not connect to server, please try again.");
            }, function(error) {
                alert("Error fetching search results party.")
            });
    }
});