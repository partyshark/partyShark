var controllersModule = angular.module('controllersModule',['servicesModule']);

controllersModule.controller('mainController', function($scope, $location, $rootScope, $route, partyService, netService) {
    $scope.playlist = function() {
        $location.path('/'+partyService.getPartyCode()+'/playlist');
    }
    $scope.search = function() {
        $location.path('/'+partyService.getPartyCode()+'/search');
    }
    $scope.exit = function() {
        //replace with exit party net service call
    	if(true) {
            $location.path('/');
            $scope.topButtons.splice(0,$scope.topButtons.length);
            $.notify("Left party sucessfully!", "success");
        }
        else {
            $.notify("Error leaving party, server will fix this eventually...", "error");
        }
    },
    $scope.options = function() {
        $location.path('/'+partyService.getPartyCode()+'/options');
    },
    $scope.sendContact = function() {
        netService.sendContact({
            "name": $scope.contactName,
            "email": $scope.contactEmail,
            "phone": $scope.contactPhone,
            "message": $scope.contactMessage
        });
        $.notify("Server is not accepting messages yet", "info");
    }
});

controllersModule.controller('joinPartyController', function($scope, $location, netService) {
    $scope.joinParty = function() {
        netService.getParty($scope.partyCode)
            .then(function(data) {
                $location.path('/'+$scope.partyCode+'/playlist');
            }, function(error) {
                console.log(error);
                $.notify("Error joining party.", "error");
            });
    },
    $scope.backHome = function() {
        $location.path('/');
    }
});

controllersModule.controller('startPartyController', function($scope, $rootScope, $location, partyService, optionsService, netService) {
    $rootScope.topButtons = [];
    $scope.startParty = function() {
    	optionsService.setNumParticipants($scope.numParticipants);
    	optionsService.setMaxQueueSize($scope.maxQueue);
        netService.createParty()
            .then(function(data) {
                    //Set party options once party is created
                    netService.updatePartySettings()
                        .then(function(data) {
                            $location.path('/'+partyService.getPartyCode()+'/playlist');
                        }, function(error) {
                            console.log(error);
                            $.notify("Error setting party settings.", "error");
                        });
            }, function(error) {
                console.log(error);
                $.notify("Error creating party.", "error");
            });
        
    },
    $scope.backHome = function() {
        $location.path('/');
    }
});

controllersModule.controller('optionsController', function($scope, $rootScope, $location, partyService, optionsService, netService) {
    $rootScope.topButtons = ["playlist", "search", "options", "exit"];
    $scope.update = function() {
        netService.updatePartySettings()
            .then(function(data) {
                $.notify("Party settings changed!", "success");
            }, function(error) {
                console.log(error);
                $.notify("Error updating party settings.", "error");
            });
    }
});

controllersModule.controller('playlistController', function($scope, $routeParams, $location, $rootScope, playlistService, partyService, netService) {
	$rootScope.topButtons = ["playlist", "search", "options", "exit"];
    //$scope.isPlayer = (partyService.getPlayerName() == partyService.getUserName()) ? true : false;
    $scope.isPlayer = false;
/*
    //Check for flash
    if(swfobject.hasFlashPlayerVersion("8.0")) {
        DZ.init({
            appId  : '174261',
            channelUrl : 'https://www.partyshark.tk/channel.html',
            player : {
            onload : function(){
                    
                }
            }
        });
    }
    else {
        $.notify("Flash Player is needed to initialize player.", "error");
    }
    
*/
    $scope.playRadio = function() {
        DZ.player.playRadio(37151);
    }

    //if local partycode is empty, must have joined via link, fetch party from server
    if(!partyService.isInParty()) {
        partyService.setPartyCode($routeParams.partyCode);
        netService.createUser(partyService.getPartyCode())
            .then(function(data) {
                netService.getParty(partyService.getPartyCode())
                    .then(function(data) {
                        $.notify("You've joined the party as "+partyService.getDisplayName(), "success");
                        fetchPlaylist();
                    }, function(error) {
                        console.log(error);
                    $.notify("Could not join party.", "error");
                });
            }, function(error) {
                console.log(error);
                $.notify("Could not join party.", "error");
            });
        
    }
    else {
        fetchPlaylist();
    }

    function fetchPlaylist() {
        //fetch existing playlist from server
        netService.getPlaylist(partyService.getPartyCode())
            .then(function(data) {
                $scope.emptyPlaylist = playlistService.isEmpty();
                $scope.playlist = playlistService.getPlaylist();
            }, function(error) {
                console.log(error);
                $.notify("Could not get playlist.", "error");
            });
    }  
});

controllersModule.controller('searchController', function($scope, $location, $rootScope, partyService, playlistService, netService) {
    $rootScope.topButtons = ["playlist", "search", "options", "exit"];
    $scope.submitSearch = function() {
        netService.searchSongs($scope.searchParams)
            .then(function(results) {
                if (!results.length)
                    $.notify("Search returned no results.", "info");
                //Array of song objects
                $scope.searchResults = results;
            }, function(error) {
                console.log(error);
                $.notify("Could not complete search.", "error");
            });
    },
    $scope.addSong = function(songCode) {
        netService.createPlaythrough(songCode)
            .then(function(data) {
                $location.path('/'+partyService.getPartyCode()+'/playlist');
            }, function(error) {
                alert("Error fetching search results party.")
            });
    }
});