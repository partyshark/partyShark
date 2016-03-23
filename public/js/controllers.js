var controllersModule = angular.module('controllersModule',['servicesModule']);

controllersModule.controller('MainController', function($scope, $q, $interval, $rootScope, PartyService, UserService, PlayerService, OptionsService, NetService, SoundsService, PlaylistService) {
    PlayerService.subscribeToTrackEnd(updatePlayer);
    PartyService.subscribeToUpdate(updatePlayer);
    PlaylistService.subscribeToUpdate(updatePlayer);

    var lastPush = Date.now();
    PlayerService.subscribeToPlayerPosition(function(pos) {
        var top = PlaylistService.top();
        if (Date.now() - lastPush > 1500 && top) {
            lastPush = Date.now();
            NetService.updatePlaythrough(top.code, {completed_ratio: pos});
        }
    });

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
        var top = PlaylistService.top()
        if (top) {
            NetService.updatePlaythrough(top.code, {completed_ratio: 1.1});
        }
    });

    $scope.user = UserService;
    $scope.party = PartyService;
});

controllersModule.controller('NavController', function($scope, $interval, $window, $route, $location, $rootScope, $route, PartyService, NetService, PlayerService, UserService, OptionsService) {
    $scope.displayName = "Ahoy, " + PartyService.username + "!";

    $scope.dock = function() {
        $location.path('/'+PartyService.code+'/playlist');
    }

    $scope.search = function() {
        $location.path('/'+PartyService.code+'/search');
    }

    $scope.exit = function() {
        //replace with exit party net service call
        NetService.deleteSelf().finally(function(data) {
            UserService.applyUpdate(null);
            PartyService.applyUpdate(null);
            OptionsService.applyUpdate(null);

            $location.path('/');
            $.notify("Left party sucessfully!", "success");
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

controllersModule.controller('joinPartyController', function($scope, $rootScope, $location, NetService, PartyService, UserService) {
    $.notify("PartyShark uses a ton of data, please use on Wi-Fi.", "info");

    $scope.joinParty = function() {
        NetService.createSelf().then(
            function(userCreation) {
                userCreation.self.code = userCreation.userCode;
                UserService.applyUpdate(userCreation.self);

                return NetService.getParty().then(
                    function(party) {
                        PartyService.applyUpdate(party);
                        $.notify("You've joined the party as "+PartyService.username, "success");
                        $location.path('/'+PartyService.code+'/playlist');
                    },
                    function(error) {
                        UserService.applyUpdate(null);
                        Util.log(error);
                        $.notify("Could not get party.", "error");
                    }
                );
            },
            function(error) {
                Util.log(error);
                $.notify("Could not join party, it may be full.", "error");
            }
        );
    };

    $scope.backHome = function() {
        $location.path('/');
    }
});

controllersModule.controller('startPartyController', function($q, $scope, $rootScope, $location, PartyService, OptionsService, NetService, UserService, PollingService, PlayerService) {
    $.notify("PartyShark uses a ton of data, please use on wifi.", "info");
    $rootScope.topButtons = [];

    $scope.genres = PlayerService.availableGenres;

    $scope.tempModel = {
        user_cap: OptionsService.user_cap,
        playthrough_cap: OptionsService.playthrough_cap,
        virtual_dj: OptionsService.virtual_dj,
        admin_code: PartyService.admin_code,
        default_genre: OptionsService.default_genre
    };

    $scope.startParty = function() {
        NetService.createParty().then(
            function(createPartyObj) {
                PollingService.pausePull();
                PartyService.applyUpdate(createPartyObj.party);
                UserService.applyUpdate({code: createPartyObj.userCode});

                var settingsPromise = NetService.updatePartySettings($scope.tempModel).then(
                    function(updatedSettings) {
                        OptionsService.applyUpdate(updatedSettings);
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
                    PollingService.resumePull();
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

controllersModule.controller('optionsController', function($scope, $rootScope, $interval, $routeParams, $location, PartyService, OptionsService, NetService, PlaylistService, PlayerService, UserService) {
    $rootScope.topButtons = ["dock", "search", "options", "exit"];

    $scope.tempModel = {
        user_cap: OptionsService.user_cap,
        playthrough_cap: OptionsService.playthrough_cap,
        virtual_dj: OptionsService.virtual_dj,
        admin_code: PartyService.admin_code,
        default_genre: OptionsService.default_genre
    };

    $scope.user = UserService;

    $scope.genres = PlayerService.availableGenres;

    $scope.update = function() {;
        NetService.updatePartySettings($scope.tempModel).then(
            function(data) {
                $.notify("Party settings changed!", "success");
                $location.path('/'+PartyService.code+'/playlist');
            },
            function(error) {
                Util.log(error);
                $.notify("Error updating party settings.", "error");
            }
        );
    };

    $scope.promoteUser = function() {
        if (UserService.is_admin) { return; }

        NetService.updateSelf($scope.tempModel).then(
            function(self) {
                UserService.applyUpdate(self);
                if(self.is_admin) {
                    $.notify("User has been promoted to admin.", "success");
                }
                else {
                    $.notify("User has not been promoted. Likely incorrect code.", "error");
                    $location.path('/'+PartyService.code+'/playlist');
                }
            },
            function(error) {
                Util.log(error);
                $.notify("Could not promote user.", "error");
            }
        );
    };

    $scope.requestPlayer = function() {
        if(PartyService.player == UserService.username) {
            $.notify("You are already the player.", "info");
            return;
        }

        $.notify("You have requested to be the player, now pending acceptance.", "info");

        var poll;
        function pollRequest(transCode) {
            NetService.getPlayerTransferRequest(transCode).then(
                function(trans) {
                    if(trans.status == 1) {
                        $interval.cancel(poll);
                        NetService.getParty().then(
                            function(response) {
                                if (response.player == UserService.username) {
                                    PartyService.applyUpdate(response);
                                    $location.path('/'+PartyService.code+'/playlist');
                                    $.notify("You have been approved for player", "success");
                                }
                            },
                            function(error) { Util.log(error); }
                        );
                    }
                },
                function(error){
                    $interval.cancel(poll);
                    Util.log(error);
                    $.notify("Player request timed out.", "error");
                }
            );
        }

        NetService.createPlayerTransferRequest().then(
            function(trans) {
                poll = $interval(pollRequest, 2000, 0, false, trans.code);
            },
            function(error) {
                Util.log(error);
                $.notify("Could not request player.", "error");
            }
        );
    }
});

controllersModule.controller('playlistController', function($scope, $q, $route, $interval, $routeParams, $location, $rootScope, UserService, PlaylistService, PartyService, OptionsService, NetService, PlayerService, PollingService) {
	$rootScope.topButtons = ["dock", "search", "options", "exit"];

    var usersRequestingPlayerIgnoredCodes = [];

    $scope.playlist = PlaylistService;

    $scope.votePlaythrough = function(playthrough, vote) {
        if (playthrough.vote == vote) {
            vote = null;
            playthrough.vote = null;
        }
        
        NetService.updatePlaythrough(playthrough.code, {vote: vote}).then(
            function(playUpdate) {
                $.notify("Vote was added!", "success");
                PollingService.pausePull();

                NetService.getPlaylist()
                    .then(function(playlistUpdate) {
                        PlaylistService.applyUpdate(playlistUpdate)
                    })
                    .finally(function() {
                        PollingService.resumePull();
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

    var interpolatePromise = $interval(function() {
        var top = PlaylistService.top();
        if (top && PartyService.is_playing) {
            top.completed_ratio += 200 / top.song.duration;
        }
    }, 200);

    $scope.$on('$destroy', function() {
        $interval.cancel(interpolatePromise);
    });
});


controllersModule.controller('searchController', function($scope, $location, $rootScope, PartyService, PlaylistService, NetService) {
    $rootScope.topButtons = ["dock", "search", "options", "exit"];

    $scope.submitSearch = function() {
        NetService.searchSongs($scope.searchParams).then(
            function(results) {
                if (results.length == 0) {
                    $.notify("Search returned no results.", "info");
                }

                $scope.searchResults = results;
            },
            function(error) {
                Util.log(error);
                $.notify("Could not complete search.", "error");
            }
        );
    };

    $scope.addSong = function(songCode, songTitle, songArtist) {
        NetService.createPlaythrough(songCode).then(
            function(play) {

                NetService.getSong(songCode).then(
                    function(song) {
                        play.song = song;
                    }
                ).finally(function() {
                    PlaylistService.commit(play);
                    $.notify(songTitle+" by "+songArtist+" was added.", "success");
                });

            },
            function(error) {
                Util.log(error);
                $.notify("Error adding song to playlist.", "error");
            }
        );

    };

    $scope.isScheduled = function(songCode) {
        return PlaylistService.some(
            function(play) { return play.song_code == songCode; }
        );
    }
});











