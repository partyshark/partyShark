var controllersModule = angular.module('controllersModule',['servicesModule']);

controllersModule.controller('mainController', function($scope, $interval, $route,$location, $rootScope, $route, partyService, netService) {
    $scope.isPlayer = false;
    $scope.isAdmin = false;

    $scope.playerPromise = null;

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
                $scope.isPlayer = false;
                $interval.cancel($scope.playerPromise);
                $scope.topButtons.splice(0,$scope.topButtons.length);
                $location.path('/');
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

controllersModule.controller('joinPartyController', function($scope, $rootScope, $location, netService, partyService) {
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

controllersModule.controller('optionsController', function($scope, $rootScope, $routeParams, $location, partyService, optionsService, netService) {
    $rootScope.topButtons = ["playlist", "search", "options", "exit"];

    //if local partycode is empty, must have joined via link, fetch party from server
    if(!partyService.isInParty()) {
        partyService.setPartyCode($routeParams.partyCode);
        netService.createUser(partyService.getPartyCode())
            .then(function(data) {
                netService.getParty(partyService.getPartyCode())
                    .then(function(data) {
                        $.notify("You've joined the party as "+partyService.getDisplayName(), "success");
                        $location.path('/'+partyService.getPartyCode()+'/playlist');
                    }, function(error) {
                        console.log(error);
                    $.notify("Could not join party.", "error");
                });
            }, function(error) {
                console.log(error);
                $.notify("Could not join party.", "error");
            }); 
    }

    netService.isAdmin().then(function(res) {
        if(res) {
            $scope.showAdminControl = true;
            $scope.adminCode = partyService.getAdminCode();
        }
    }, function(err) {
        $scope.showAdminControl = false;
        $scope.adminCode = "";
    });

    

    $scope.currMaxQueue = optionsService.getMaxQueueSize();
    $scope.currMaxParticipants = optionsService.getNumParticipants();

    $scope.update = function() {
        optionsService.setNumParticipants($scope.maxParticipants);
        optionsService.setMaxQueueSize($scope.maxQueue);
        netService.updatePartySettings()
            .then(function(data) {
                $.notify("Party settings changed!", "success");
                $location.path('/'+partyService.getPartyCode()+'/playlist');
            }, function(error) {
                console.log(error);
                $.notify("Error updating party settings.", "error");
            });
    },
    $scope.promoteUser = function() {
        netService.promoteUser($scope.adminCode)
            .then(function(data) {
                var status = data.data.is_admin;
                if(status)
                    $.notify("User has been promoted to admin.", "success");
                else
                    $.notify("User has not been promoted.", "error");
                partyService.setAdminCode($scope.adminCode);
                $rootScope.isAdmin = status;
                $scope.showAdminControl = status;
                $location.path('/'+partyService.getPartyCode()+'/playlist');
            }, function(error) {
                console.log(error);
                $.notify("Could not promote user.", "error");
            });
    }
});

controllersModule.controller('playlistController', function($scope, $route, $interval, $routeParams, $location, $rootScope, playlistService, partyService, netService) {
	$rootScope.topButtons = ["playlist", "search", "options", "exit"];

    //Check if user is admin
    netService.isAdmin().then(function(res) {
        if(res)
            $rootScope.isAdmin = true;
    }, function(err) {
        $rootScope.isAdmin = false;
    });

    //Refresh occuring every interval, for all types of users, used to keep playlist up to date
    var refresh = $interval(function(){
        fetchPlaylist();
    }, 5000);

    $scope.$on('$destroy', function() {
      $interval.cancel(refresh);
    });

    //If player, load player and define event triggers
    $rootScope.isPlayer = partyService.isPlayer();
    if($rootScope.isPlayer && !playlistService.isPlayerInitialized()) {
        if(swfobject.hasFlashPlayerVersion("10.1")) {

            //Check party player status
            $rootScope.playerPromise = $interval(function(){
                netService.getParty(partyService.getPartyCode())
                    .then(function(res){
                        if(res.player == partyService.getDisplayName()){
                            $rootScope.isPlayer = false;
                            $interval.cancel($rootScope.playerPromise);
                        } 
                        if(res.data.is_playing)
                            DZ.player.play();
                        else
                            DZ.player.pause();
                    }, function(error){
                        console.log(error);
                        $.notify("Could not check play status", "error");
                    });
            }, 2000);

            initializePlayer();
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
                        if(data.player == partyService.getDisplayName()) {
                            initializePlayer();
                            $.notify("You are the player.", "Success");
                        }
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

    function initializePlayer() {
        DZ.init({
            appId  : '174261',
            channelUrl : 'https://www.partyshark.tk/channel.html',
            player : {
            onload : function(){
                    playlistService.setPlayerInitialized();
                    $.notify("Player loaded.", "success");
                    //If loading player, play first song in party playlist
                    var playthrough = playlistService.getTopPlaythrough();
                    if(playthrough) {
                        partyService.setCurrPlaythrough(playthrough.code);
                        DZ.player.playTracks([playthrough.song_code]);
                        $.notify("Playing next song in party.", "info");
                    }
                }
            }
        });
        DZ.Event.subscribe('current_track', function(track) {
            $rootScope.trackTitle = track.track.title;
            $rootScope.trackArtist = track.track.artist.name;
        });
        DZ.Event.subscribe('player_position', function(arg){
            $("#slider_seek").find('.bar').css('width', (100*arg[0]/arg[1]) + '%');
        });
        DZ.Event.subscribe('track_end', function(evt_name){
            //tell server playthrough is done
            netService.updateCurrentPlaythrough(partyService.getPartyCode(), playlistService.getTopPlaythrough().code, null, 9999999)
                .then(function(response) {
                    netService.getPlaylist(partyService.getPartyCode())
                        .then(function(data) {
                            $scope.emptyPlaylist = playlistService.isEmpty();
                            $scope.playlist = playlistService.getPlaylist();
                            populatePlaylist();
                            //$route.reload();
                            //load player with track in position 0
                            var playthrough = playlistService.getTopPlaythrough();
                                if(playthrough) {
                                    partyService.setCurrPlaythrough(playthrough.code);
                                    DZ.player.playTracks([playthrough.song_code]);
                                    $.notify("Playing next song in party.", "info");
                                }
                                else
                                    console.log("no position 0");
                        }, function(error) {
                            console.log(error);
                            $.notify("Could not get playlist.", "error");
                        });
                },
                function(error) {
                    console.log(error);
                    $.notify("Song could not be marked as completed.", "error");
                }); 
        });
    }

    function fetchPlaylist() {
        //fetch existing playlist from server
        netService.getPlaylist(partyService.getPartyCode())
            .then(function(data) {
                $scope.emptyPlaylist = playlistService.isEmpty();
                $scope.playlist = playlistService.getPlaylist();
                populatePlaylist();
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
        netService.updateCurrentPlaythrough(partyService.getPartyCode(), playthroughCode, vote)
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
            },
            function(error) {
                console.log(error);
                $.notify("Vote was not added to the playthrough.", "error");
            });
    }

    /*********************** Player commands available to admins ********************/
    $rootScope.play = function() {
        netService.updateParty(partyService.getPartyCode(), true)
            .then(function(data) {
                $.notify("Sent Play", "success");
            }, function(error) {
                console.log(error);
            $.notify("Could not send play.", "error");
        });
    }

    $rootScope.pause = function() {
        netService.updateParty(partyService.getPartyCode(), false)
            .then(function(data) {
                $.notify("Sent Pause", "success");
            }, function(error) {
                console.log(error);
            $.notify("Could not send pause.", "error");
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

                //If first song being added to the party playlist, add song to player
                if(!playlistService.getPlaylist().length){
                    partyService.setCurrPlaythrough(data.data.code);
                    DZ.player.playTracks([data.data.song_code]);
                }   
            }, function(error) {
                console.log(error);
                $.notify("Error adding song to playlist.", "error");
            });
    }
});











