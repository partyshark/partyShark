var controllersModule = angular.module('controllersModule',['servicesModule']);

controllersModule.controller('mainController', function($scope, $location, $rootScope, $route, partyService, netService) {
    $scope.isPlayer = false;
    $scope.playlist = function() {
        $location.path('/'+partyService.getPartyCode()+'/playlist');
    }
    $scope.search = function() {
        $location.path('/'+partyService.getPartyCode()+'/search');
    }
    $scope.exit = function() {
        //replace with exit party net service call
        netService.leaveParty()
            .then(function(data) {
                $location.path('/');
                $scope.isPlayer = false;
                $scope.topButtons.splice(0,$scope.topButtons.length);
                $.notify("Left party sucessfully!", "success");
            }, function(error) {
                console.log(error);
                $.notify("Error leaving party, server will fix this eventually...", "error");
            });
    }
    $scope.options = function() {
        $location.path('/'+partyService.getPartyCode()+'/options');
    }
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

controllersModule.controller('joinPartyController', function($scope, $location, netService, partyService) {
    $scope.joinParty = function() {
        partyService.setPartyCode($scope.partyCode);
        netService.createUser(partyService.getPartyCode())
            .then(function(data) {
                netService.getParty(partyService.getPartyCode())
                    .then(function(data) {
                        $.notify("You've joined the party as "+partyService.getDisplayName(), "success");
                        $location.path('/'+partyService.getPartyCode()+'/playlist');
                    }, function(error) {
                        console.log(error);
                    $.notify("Could get party.", "error");
                });
            }, function(error) {
                console.log(error);
                $.notify("Could not join party.", "error");
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
                            //Get user name
                            netService.getDisplayName()
                                .then(function(data) {
                                    $.notify("You've joined the party as "+partyService.getDisplayName(), "success");
                                    $location.path('/'+partyService.getPartyCode()+'/playlist');
                                }, function(error) {
                                    console.log(error);
                                    $.notify("Error retrieving user name.", "error");
                                });

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

controllersModule.controller('playlistController', function($scope, $filter, $routeParams, $location, $rootScope, playlistService, partyService, netService) {
	$rootScope.topButtons = ["playlist", "search", "options", "exit"];

    $rootScope.isPlayer = partyService.isPlayer();
    if($rootScope.isPlayer && !playlistService.isPlayerInitialized()) {
        if(swfobject.hasFlashPlayerVersion("6.0")) {
            DZ.init({
                appId  : '174261',
                channelUrl : 'https://www.partyshark.tk/channel.html',
                player : {
                onload : function(){
                        playlistService.setPlayerInitialized();
                        $.notify("Player loaded.", "success");
                    }
                }
            });
        }
        else {
            $.notify("Flash Player is needed to initialize player.", "error");
        }
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
        console.log("fetch playlist");
        fetchPlaylist();
    }

    function fetchPlaylist() {
        //fetch existing playlist from server
        netService.getPlaylist(partyService.getPartyCode())
            .then(function(data) {
                $scope.emptyPlaylist = playlistService.isEmpty();
                $scope.playlist = playlistService.getPlaylist();
                populatePlaylist();
                //playthrough items with song info in scope.playlist
            }, function(error) {
                console.log(error);
                $.notify("Could not get playlist.", "error");
            });
    }  

    function populatePlaylist() {
        var playlist = playlistService.getPlaylist(),
            i;
        playlist.forEach(function(item) {
            netService.getSong(item.song_code)
                .then(function(data) {
                    item["title"] = data.title;
                    item["artist"] = data.artist;
                    item["year"] = data.year;
                    item["duration"] = data.duration;
                }, function(error) {
                    console.log("Could not get song details for songCode: "+playlist[i].song_code);
                }); 
        }) 
        $scope.playlist = playlistService.getPlaylist();
    }

    $scope.votePlaythrough = function(playthroughCode, vote) {
        netService.updateCurrentPlaythrough(partyService.getPartyCode, playthroughCode, vote)
            .then(function(response) {
                $.notify("Vote was added!", "success");
                playlistService.getPlaylist().findIndex(function(element, index, array) {
                    if(element.code == playthroughCode) {
                        element.upvotes = response.upvotes;
                        element.downvotes = response.downvotes;
                        element.position = response.position;
                    }
                });
                $scope.playlist = playlistService.getPlaylist();
                $scope.order = 'position';
            },
            function(error) {
                console.log(error);
                $.notify("Vote was not added to the playthrough.", "error");
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
                DZ.player.playTracks([data.data.song_code]);
            }, function(error) {
                alert("Error fetching search results party.")
            });
    }
});











