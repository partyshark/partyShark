var controllersModule = angular.module('controllersModule',['servicesModule']);

controllersModule.controller('mainController', function($scope, $interval, $window, $route,$location, $rootScope, $route, partyService, netService, playerService) {
    $scope.isPlayer = false;
    $scope.isAdmin = false;
    $rootScope.progressValue = 0;
    $rootScope.displayName = "PartyShark";

    if(partyService.getPartyCode())
        $window.location.reload();

    //Cancel interval if not player
    //playerService.stopPlayerInterval();

    $scope.dock = function() {
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
                $scope.topButtons.splice(0,$scope.topButtons.length);
                $('#dz-root').empty();
                $scope.isPlayer = false;
                $scope.isAdmin = false;
                $scope.isPlayingRadio = false;
                $location.path('/');
                playerService.stopPlayerInterval();
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
        $.notify("Message has been sent", "success");
    }
});

controllersModule.controller('joinPartyController', function($scope, $rootScope, $location, netService, partyService) {
    $.notify("PartyShark uses a ton of data, please use on wifi.", "info");
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
                    $.notify("Could not get party.", "error");
                });
            }, function(error) {
                console.log(error);
                $.notify("Could not join party, it may be full.", "error");
            });
    },
    $scope.backHome = function() {
        $location.path('/');
    }
});

controllersModule.controller('startPartyController', function($scope, $rootScope, $location, partyService, optionsService, netService) {
    $.notify("PartyShark uses a ton of data, please use on wifi.", "info");
    $rootScope.topButtons = [];
    $scope.genres = [{
        value: null,
        label: 'None'
      }, {
        value: 0,
        label: 'Classic Rock'
      }, {
        value: 1,
        label: 'Metal'
      }, {
        value: 2,
        label: 'Jazz'
      }, {
        value: 3,
        label: 'Country'
      }, {
        value: 4,
        label: 'Top Hits'
      }, {
        value: 5,
        label: 'Classical'
      }, {
        value: 6,
        label: 'Folk'
      }, {
        value: 7,
        label: 'Electronic'
      }];

    $scope.startParty = function() {
        netService.createParty()
            .then(function(data) {
                    netService.updatePartySettings($scope.genreValue.value, $scope.numParticipants, $scope.maxQueue)
                        .then(function(data) {
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

controllersModule.controller('optionsController', function($scope, $rootScope, $interval, $routeParams, $location, partyService, optionsService, netService) {
    $rootScope.topButtons = ["dock", "search", "options", "exit"];
    $scope.genres = [{
        value: null,
        label: 'None'
      }, {
        value: 0,
        label: 'Classic Rock'
      }, {
        value: 1,
        label: 'Metal'
      }, {
        value: 2,
        label: 'Jazz'
      }, {
        value: 3,
        label: 'Country'
      }, {
        value: 4,
        label: 'Top Hits'
      }, {
        value: 5,
        label: 'Classical'
      }, {
        value: 6,
        label: 'Folk'
      }, {
        value: 7,
        label: 'Electronic'
      }];

    //update party settings
    netService.getPartySettings()
        .then(function(res){
            $scope.partyCode = partyService.getPartyCode();
            var maxQueueSize = optionsService.getMaxQueueSize();
            var maxNumParticipants = optionsService.getNumParticipants();

            if(maxQueueSize != null)
                $scope.currMaxQueue = maxQueueSize;
            else
                $scope.currMaxQueue = "Unlimited";

            if(maxNumParticipants != null)
                $scope.currMaxParticipants = maxNumParticipants;
            else
                $scope.currMaxParticipants = "Unlimited";
            
            $scope.genreValue = optionsService.getDefaultGenreObject();
        }, function(error){
            console.log(error);
        });
    
    //Refresh options while sitting on menu
    //Set an interval here to update options

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

    $scope.update = function() {
        netService.updatePartySettings($scope.genreValue.value, $scope.currMaxParticipants, $scope.currMaxQueue)
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
    $scope.requestPlayer = function() {
        $.notify("You have requested to be the player, now pending acceptance.", "info");
        netService.requestPlayer()
            .then(function(data) {
                //Poll on response
                var playerPoll = $interval(function() {
                    netService.getPlayerTransferRequest(data.data.code).then(function(response){
                        if(response.data.status) {
                            netService.getParty(partyService.getPartyCode()).then(function(response){
                                if (response.data.player == partyService.getDisplayName()) {
                                    $location.path('/'+partyService.getPartyCode()+'/playlist');
                                    $.notify("You have been approved for player", "success");
                                    $interval.cancel(playerPoll);
                                }
                            }, function(error){console.log(error);});
                            $interval.cancel(playerPoll);
                        }
                    }, function(error){
                        console.log(error);
                        $.notify("Could not poll request status.", "error");
                    });
                }, 2000);
                
            }, function(error) {
                console.log(error);
                $.notify("Could not request player.", "error");
            });
    }
});

controllersModule.controller('playlistController', function($scope, $q, $route, $interval, $routeParams, $location, $rootScope, playlistService, partyService, optionsService, netService, playerService) {
	$rootScope.topButtons = ["dock", "search", "options", "exit"];

    // $scope.passSearch = function() {
    //     $rootScope.search();
    // }
    //playerService.setPlayingRadio(false);
    //playerService.setPlayerSeesEmpty(true);
    $rootScope.displayName = "Ahoy, " + partyService.getDisplayName() + "!";
    //Check if user is admin
    netService.isAdmin().then(function(res) {
        if(res)
            $rootScope.isAdmin = true;
    }, function(err) {
        $rootScope.isAdmin = false;
    });

    usersRequestingPlayerIgnoredCodes = [];

    //Refresh occuring every interval, for all types of users, used to keep playlist up to date
    var refresh = $interval(function(){
        //Update playlist
        fetchPlaylist();

        var playthrough = playlistService.getTopPlaythrough();
        if(playthrough) {
            $rootScope.progressValue = playthrough.completed_ratio*100;
        }

        //update party settings
        netService.getPartySettings().then(function(res){}, function(error){console.log(error);});
        //admins poll on player transfer requests
        if($rootScope.isAdmin)
            netService.getPlayerTransferRequests().then(function(response){
                var arr = [ ], names = response.data.properties;
                    response.data.values.forEach(function(valList) {
                        var obj = { };
                        valList.forEach(function(val, index) {
                            obj[names[index]] = val;
                        });
                        arr.push(obj);
                    });
                    var needAlert = true;
                    for (var i=0; i<arr.length; i++) {
                        for (var j=0; j<usersRequestingPlayerIgnoredCodes.length; j++) {
                            if(usersRequestingPlayerIgnoredCodes[j].code == arr[i].code) {
                                needAlert = false;
                            }
                        }
                        if(needAlert) {
                            var r = confirm(arr[i].requester+" would like to become a player.");
                            if (r == true) {
                                //Accept player transfer
                                netService.approvePlayerTransfer(1, arr[i].code).then(function(res){}, function(error){console.log(error);});
                                usersRequestingPlayerIgnoredCodes.push(arr[i]);
                            } else {
                                usersRequestingPlayerIgnoredCodes.push(arr[i]);
                            }
                        }
                    }
            }, function(error){console.log(error);});
    }, 5000);

    $scope.$on('$destroy', function() {
      $interval.cancel(refresh);
    });

    //If player, load player and define event triggers
    $rootScope.isPlayer = partyService.isPlayer();
    if($rootScope.isPlayer) {
        if(swfobject.hasFlashPlayerVersion("10.1")) {
            //Initialize player
            if(!playlistService.isPlayerInitialized()) {
                playerService.initializePlayer(function() {$.notify("Player is loaded.","success");});
                playerService.subscribeEvents();
                DZ.Event.subscribe('track_end', function(arg){
                    netService.updateCurrentPlaythrough(partyService.getPartyCode(), playlistService.getTopPlaythrough().code, -1, 9999999)
                        .then(function(response) {
                            console.log(response);
                            netService.getPlaylist(partyService.getPartyCode())
                                .then(function(data) {
                                    $scope.emptyPlaylist = playlistService.isEmpty();
                                    $scope.playlist = playlistService.getPlaylist();
                                    console.log(playlistService.getPlaylist().length);
                                    populatePlaylist();
                                    playerService.playNextPlaythrough();
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
                playlistService.setPlayerInitialized();
            }
            //Player polling interval
            playerService.startPlayerInterval();
        }
        else {
            $.notify("Flash Player is needed to be the player. Cannot be the player.", "error");
        }
    }

    //if local partycode is empty, must have joined via link, fetch party from server
    if(!partyService.isInParty()) {
        partyService.setPartyCode($routeParams.partyCode);
        netService.createUser(partyService.getPartyCode())
            .then(function(data) {
                netService.getParty($routeParams.partyCode)
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

    function fetchPlaylist() {
        //fetch existing playlist from server
        netService.getPlaylist(partyService.getPartyCode())
            .then(function(data) {
                $scope.emptyPlaylist = playlistService.isEmpty();
                $scope.playlist = playlistService.getPlaylist();
                return populatePlaylist();
            }, function(error) {
                console.log(error);
                //$.notify("Could not get playlist.", "error");
            });
    }  

    function populatePlaylist() {
        var playlist = playlistService.getPlaylist();
        var awaiting = [];

        playlist.forEach(function(item) {
            var promise = netService.getSong(item.song_code)
                .then(function(data) {
                    item.song = data;
                }, function(error) {
                    console.log("Could not get song details for songCode: "+playlist[i].song_code);
                });
            awaiting.push(promise);
        });

        $scope.playlist = playlistService.getPlaylist();
        return $q.all(awaiting);
    }

    $scope.votePlaythrough = function(playthrough, vote) {
        if (playthrough.vote == vote) {
            vote = null;
            playthrough.vote = null;
        }
        
        netService.updateCurrentPlaythrough(partyService.getPartyCode(), playthrough.code, vote)
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
    $rootScope.veto = function(playthroughCode) {
        netService.deletePlaythrough(playthroughCode)
            .then(function(data) {
                $.notify("Playthrough vetoed", "success");
            }, function(error) {
                console.log(error);
            $.notify("Playthrough could not be vetoed.", "error");
        });
    }
    $rootScope.loginPlayer = function() {
        DZ.login(function(response) {
            console.log(response);
            if (response.authResponse) {
            } else {
                console.log('User cancelled login or did not fully authorize.');
            }
        }, {perms: 'basic_access'});
    }
});


controllersModule.controller('searchController', function($scope, $location, $rootScope, partyService, playlistService, netService) {
    $rootScope.topButtons = ["dock", "search", "options", "exit"];
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
    $scope.addSong = function(songCode, songTitle, songArtist) {
        netService.createPlaythrough(songCode)
            .then(function(data) {
                $.notify(songTitle+" by "+songArtist+" was added", "success");
            }, function(error) {
                console.log(error);
                $.notify("Error adding song to playlist.", "error");
            });
    }
});











