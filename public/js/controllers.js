var controllersModule = angular.module('controllersModule',['servicesModule']);

controllersModule.controller('MainController', function($scope, $q, $interval, $rootScope, PartyService, UserService, PlayerService, OptionsService, NetService, SoundsService, PlaylistService) {
    $scope.user = UserService;
    $scope.party = PartyService;
    $scope.playlist = PlaylistService;

    var playerReg;
    var lastPush = Date.now();
    $scope.$watch('user.isPlayer()', function(cur, old) {
        if (cur && !old) {
            PlayerService.allowPlay(PartyService.is_playing);

            playerReg = {
                cue: $scope.$watch('playlist.top()', function(cur, old) {
                    var code = (cur) ? cur.song_code : null;
                    PlayerService.cueSong(code);
                }),

                end: PlayerService.onEnd(function() {
                    var top = PlaylistService.top()
                    if (top) {
                        NetService.updatePlaythrough(top.code, {completed_ratio: 1.1});
                    }
                }),

                start: PlayerService.onStart(function() {
                    if(OptionsService.virtual_dj) {
                       SoundsService.playRapHorn();
                    }
                }),

                pos: PlayerService.onPosition(function(pos) {
                    var top = PlaylistService.top();
                    if (Date.now() - lastPush > 1500 && top && pos > top.completed_ratio) {
                        lastPush = Date.now();
                        NetService.updatePlaythrough(top.code, {completed_ratio: pos});
                    }
                })
            };
        }
        else if (playerReg) {
            PlayerService.allowPlay(false);

            playerReg.cue();
            playerReg.end.cancel();
            playerReg.start.cancel();
            playerReg.pos.cancel();
            playerReg = null;
        }
    });

    $scope.$watch('party.is_playing', function(cur, old) {
        PlayerService.allowPlay(cur && UserService.isPlayer());
    });
});

controllersModule.controller('ModalController', function($scope, NetService, TransferService) {
    $scope.transfers = TransferService.unmarked;

    $scope.$watchCollection('transfers', function(cur) {
        if(!cur) { return; }

        for(var prop in cur) {
            var trans = cur[prop];
            if (!trans) { return; }

            TransferService.mark(trans);
            if (confirm(trans.requester+' would like to be player.')) {
                NetService.approvePlayerTransfer(trans.code);
            }

            break;
        }
    });
})

controllersModule.controller('NavController', function($scope, $interval, $window, $route, $location, $rootScope, $route, PlaylistService, PartyService, NetService, PlayerService, UserService, OptionsService) {
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
            PlaylistService.applyUpdate(null);

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

        NetService.updateSelf(update).then(
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
        if(UserService.isPlayer()) {
            $.notify("You are already the player.", "info");
            return;
        }

        var poll, watch;
        NetService.createPlayerTransferRequest().then(
            function(trans) {
                poll = $interval(pollRequest.bind(null, trans.code), 2000);
                watch = $scope.$watch('user.isPlayer()', watchPlayer);
                $.notify("You have requested to be the player, now pending acceptance.", "info");
            },
            function(error) {
                Util.log(error);
                $.notify("Could not request player.", "error");
            }
        );

        function pollRequest(transCode) {
            NetService.getPlayerTransferRequest(transCode).then(
                function transSuccess(trans) {
                    if(trans.status === 1) {
                        $interval.cancel(poll);
                        NetService.getParty().then(PartyService.applyUpdate);
                    }
                },
                function(error){
                    $interval.cancel(poll);
                    watch();
                    $.notify("Player request timed out.", "error");
                }
            );
        }

        function watchPlayer(cur, old) {
            if (cur && !old) {
                $interval.cancel(poll);
                watch();
                $.notify('You have become player.', 'success');
            }
        }
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











