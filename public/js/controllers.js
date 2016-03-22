var controllersModule = angular.module('controllersModule',['servicesModule']);

controllersModule.controller('MainController', function($scope, $q, $interval, $rootScope, PartyService, UserService, PlayerService, OptionsService, NetService, SoundsService, PlaylistService) {
    PlayerService.subscribeToTrackEnd(updatePlayer);
    PartyService.subscribeToUpdate(updatePlayer);
    PlaylistService.subscribeToUpdate(updatePlayer);

    function updatePlayer() {
        if (!UserService.isPlayer() || !PartyService.is_playing) {
            PlayerService.pause();
        }
        else {
            PlayerService.play();
        }

        //Check to make sure current playing is still at pos 0
        var nowPlaying = PlaylistService.top();
        if(nowPlaying) {
            if(nowPlaying.song_code != PlayerService.nowPlayingCode()) {
                PlayerService.queueSong(nowPlaying.song_code);
                Util.log('queued track');
            }
        }
        else if(OptionsService.default_genre !== null) {
            if(!PlayerService.radioIsQueued()) {
                PlayerService.queueStation(OptionsService.default_genre);
                Util.log('queued radio');
             }
        }
        else {
            PlayerService.queueSong(null);
        }
    }

    PlayerService.subscribeToTrackEnd(function() {
        if (OptionsService.vitrual_dj) {
            SoundsService.playRapHorn();
        }
    });

    $scope.user = UserService;
    $scope.party = PartyService;
});

controllersModule.controller('NavController', function($scope, $interval, $window, $route, $location, $rootScope, $route, PartyService, NetService, PlayerService, UserService) {
    $scope.displayName = "Ahoy, " + PartyService.username + "!";

    $scope.dock = function() {
        $location.path('/'+PartyService.code+'/playlist');
    }

    $scope.search = function() {
        $location.path('/'+PartyService.code+'/search');
    }

    $scope.exit = function() {
        //replace with exit party net service call
        NetService.leaveParty()
            .then(function(data) {
                $scope.isPlayer = false;
                $scope.topButtons.splice(0,$scope.topButtons.length);
                $('#dz-root').empty();
                $scope.isPlayer = false;
                $scope.isAdmin = false;
                $scope.isPlayingRadio = false;
                $location.path('/');
                PlayerService.stopPlayerInterval();
                $.notify("Left party sucessfully!", "success");
            }, function(error) {
                console.log(error);
                $.notify("Error leaving party, server will fix this eventually...", "error");
            });
    }

    $scope.options = function() {
        $location.path('/'+PartyService.code+'/options');
    }

    $scope.setPlaying = function(value) {
        var keyWord = value ? 'Play' : 'Pause';
        NetService.updateParty({is_playing: value}).then(
            function(data) {
                $.notify('Sent '+keyWord, "success");
                PartyService.applyUpdate(data);
            },
            function(error) {
                Util.log(error);
                $.notify("Could not send "+keyWord, "error");
            }
        );
    }

    $scope.loginPlayer = function() {
        DZ.login(function(response) {
            console.log(response);
            if (response.authResponse) {
            } else {
                console.log('User cancelled login or did not fully authorize.');
            }
        }, {perms: 'basic_access'});
    }
});

controllersModule.controller('joinPartyController', function($scope, $rootScope, $location, NetService, PartyService) {
    $.notify("PartyShark uses a ton of data, please use on wifi.", "info");
    $scope.joinParty = function() {
        PartyService.setPartyCode($scope.partyCode);
        NetService.createUser(PartyService.code)
            .then(function(data) {
                NetService.getParty(PartyService.code)
                    .then(function(data) {
                        $.notify("You've joined the party as "+PartyService.username, "success");
                        $location.path('/'+PartyService.code+'/playlist');
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

controllersModule.controller('startPartyController', function($q, $scope, $rootScope, $location, PartyService, OptionsService, NetService, UserService, PollingService) {
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
        NetService.createParty().then(
            function(createPartyObj) {
                PollingService.pause();
                PartyService.applyUpdate(createPartyObj.party);
                UserService.applyUpdate({code: createPartyObj.userCode});

                var settingsUpdate = {
                    default_genre: $scope.genreValue.value,
                    user_cap: $scope.numParticipants,
                    playthrough_cap: $scope.maxQueue,
                    virtualdj: $scope.virtualDJ
                };

                var settingsPromise = NetService.updatePartySettings(settingsUpdate).then(
                    function(updatedSettings) {
                        OptionsService.applyUpdate(settingsUpdate);
                    },
                    function(error) {
                        $.notify("Error setting party settings.", "error");
                    }
                );

                var selfPromise = NetService.getSelf().then(
                    function(selfUpdate) {
                        UserService.applyUpdate(selfUpdate);
                    },
                    function(error) {
                        $.notify("Error retrieving user name.", "error");
                    }
                );

                return $q.all([settingsPromise, selfPromise]).then(function() {
                    $.notify("You've joined the party as "+UserService.username, "success");
                    $location.path('/'+PartyService.code+'/playlist');
                })
                .finally(function() {
                    PollingService.resume();
                });
            },
            function(error) {
                Util.log(error);
                $.notify("Error creating party.", "error");
            }
        );
    }

    $scope.backHome = function() {
        $location.path('/');
    }
});

controllersModule.controller('optionsController', function($scope, $rootScope, $interval, $routeParams, $location, PartyService, OptionsService, NetService) {
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
    NetService.getPartySettings()
        .then(function(res){
            var maxQueueSize = OptionsService.playthrough_cap;
            var maxNumParticipants = OptionsService.user_cap;

            if(maxQueueSize != null)
                $scope.currMaxQueue = maxQueueSize;
            else
                $scope.currMaxQueue = "Unlimited";

            if(maxNumParticipants != null)
                $scope.currMaxParticipants = maxNumParticipants;
            else
                $scope.currMaxParticipants = "Unlimited";
        }, function(error){
            console.log(error);
        });
    
    //Refresh options while sitting on menu
    //Set an interval here to update options

    //if local partycode is empty, must have joined via link, fetch party from server
    if(!PartyService.isInParty()) {
        PartyService.setPartyCode($routeParams.partyCode);
        NetService.createUser(PartyService.code)
            .then(function(data) {
                NetService.getParty(PartyService.code)
                    .then(function(data) {
                        $.notify("You've joined the party as "+PartyService.username, "success");
                        $location.path('/'+PartyService.code+'/playlist');
                    }, function(error) {
                        console.log(error);
                    $.notify("Could not join party.", "error");
                });
            }, function(error) {
                console.log(error);
                $.notify("Could not join party.", "error");
            }); 
    }

    NetService.isAdmin().then(function(res) {
        if(res) {
            $scope.showAdminControl = true;
            $scope.adminCode = PartyService.getAdminCode();
        }
    }, function(err) {
        $scope.showAdminControl = false;
        $scope.adminCode = "";
    });

    $scope.update = function() {
        NetService.updatePartySettings($scope.genreValue.value, $scope.maxParticipants, $scope.maxQueue)
            .then(function(data) {
                $.notify("Party settings changed!", "success");
                $location.path('/'+PartyService.code+'/playlist');
            }, function(error) {
                console.log(error);
                $.notify("Error updating party settings.", "error");
            });
    },
    $scope.promoteUser = function() {
        NetService.promoteUser($scope.adminCode)
            .then(function(data) {
                var status = data.data.is_admin;
                if(status)
                    $.notify("User has been promoted to admin.", "success");
                else
                    $.notify("User has not been promoted.", "error");
                PartyService.setAdminCode($scope.adminCode);
                $rootScope.isAdmin = status;
                $scope.showAdminControl = status;
                $location.path('/'+PartyService.code+'/playlist');
            }, function(error) {
                console.log(error);
                $.notify("Could not promote user.", "error");
            });
    }
    $scope.requestPlayer = function() {
        $.notify("You have requested to be the player, now pending acceptance.", "info");
        if(PartyService.getPlayerName() == PartyService.username) {
            $.notify("You are already the player.", "info");
            return;
        }
        NetService.requestPlayer()
            .then(function(data) {
                //Poll on response
                var playerPoll = $interval(function() {
                    NetService.getPlayerTransferRequest(data.data.code).then(function(response){
                        if(response.data.status) {
                            NetService.getParty(PartyService.code).then(function(response){
                                if (response.data.player == PartyService.username) {
                                    $location.path('/'+PartyService.code+'/playlist');
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

controllersModule.controller('playlistController', function($scope, $q, $route, $interval, $routeParams, $location, $rootScope, UserService, PlaylistService, PartyService, OptionsService, NetService, PlayerService, PollingService) {
	$rootScope.topButtons = ["dock", "search", "options", "exit"];

    var usersRequestingPlayerIgnoredCodes = [];

    //Refresh occuring every interval, for all types of users, used to keep playlist up to date
   /* var refresh = $interval(function(){
        //Update playlist
        fetchPlaylist();

        var playthrough = PlaylistService.top();
        if(playthrough) {
            $rootScope.progressValue = playthrough.completed_ratio*100;
        }

        //update party settings
        NetService.getPartySettings().then(function(res){}, function(error){console.log(error);});
        //admins poll on player transfer requests
        if($rootScope.isAdmin)
            NetService.getPlayerTransferRequests().then(function(response){
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
                                NetService.approvePlayerTransfer(1, arr[i].code).then(function(res){}, function(error){console.log(error);});
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
    });*/

    $scope.playlist = PlaylistService;

    $scope.votePlaythrough = function(playthrough, vote) {
        if (playthrough.vote == vote) {
            vote = null;
            playthrough.vote = null;
        }
        
        NetService.updatePlaythrough(playthrough.code, {vote: vote}).then(
            function(playUpdate) {
                $.notify("Vote was added!", "success");
                PollingService.pause();

                NetService.getPlaylist()
                    .then(function(playlistUpdate) {
                        PlaylistService.applyUpdate(playlistUpdate)
                    })
                    .finally(function() {
                        PollingService.resume();
                    });
            },
            function(error) {
                Util.log(error);
                $.notify("Vote was not added to the playthrough.", "error");
            }
        );
    }

    $scope.veto = function(playthroughCode) {
        NetService.deletePlaythrough(playthroughCode).then(
            function(data) {
                $.notify("Playthrough vetoed", "success");
            },
            function(error) {
                Util.log(error);
                $.notify("Playthrough could not be vetoed.", "error");
            }
        );
    }
});


controllersModule.controller('searchController', function($scope, $location, $rootScope, PartyService, PlaylistService, NetService) {
    $rootScope.topButtons = ["dock", "search", "options", "exit"];
    $scope.submitSearch = function() {
        NetService.searchSongs($scope.searchParams)
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
        NetService.createPlaythrough(songCode)
            .then(function(data) {
                $.notify(songTitle+" by "+songArtist+" was added", "success");
            }, function(error) {
                console.log(error);
                $.notify("Error adding song to playlist.", "error");
            });
    }
});











