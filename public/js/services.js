var servicesModule = angular.module('servicesModule',[]);

servicesModule.service('PartyService', function() {
    var publisher = new Util.Publisher();

    return {
        code: null,
        admin_code: null,
        player: null,
        is_playing: null,

        isActive: function() { return this.code !== null; },

        subscribeToUpdate: publisher.subscribe,

        applyUpdate: function(update) {
            if (!update) { update = {code: null, admin_code: null, player: null, is_playing: null}; }
            Util.applyUpdate(this, update);
            publisher.publish(this);
        }
    };
});

servicesModule.service('UserService', function(PartyService) {
    var publisher = new Util.Publisher();

    return {
        code: null,
        username: null,
        is_admin: null,

        isPlayer: function() { return (this.username !== null) && (this.username == PartyService.player); },

        subscribeToUpdate: publisher.subscribe,

        applyUpdate: function(update) {
            if (!update) { update = {code: null, is_admin: null, username: null}; }
            Util.applyUpdate(this, update);
            publisher.publish(this);
        }
    };
});

servicesModule.service('OptionsService', function() {
    var genreLabels = Object.freeze(['Classic Rock', '', '', 'Country', 'Top Hits']);
    var publisher = new Util.Publisher();

    var service = {
        user_cap: null,
        playthrough_cap: null,
        virtual_dj: null,
        veto_ratio: null,
        default_genre: null,

        subscribeToUpdate: publisher.subscribe,

        applyUpdate: function(update) {
            if (!update) { update = {user_cap: null, playthrough_cap: null, virtual_dj: null, veto_ratio: null, default_genre: null}; }
            Util.applyUpdate(this, update);
            publisher.publish(this);
        }
    };

    function getGenreLabel() {
        var dg = service.default_genre;
        if(dg ==  null || dg < 0 || dg >= genreLabels.length) { return 'None'; }
        else { return genreLabels[dg]; }
    }

    return service;
});

servicesModule.service('SongCacheService', function() {
    var _cache = { };
    return {
        getSong: function(songCode) {
           return _cache[songCode];
        },
       addSong: function(song) {
           _cache[song.code] = song;
       }
    };
});

servicesModule.service('PlaylistService', function() {
    function posPred(a, b) { a.position - b.position; }

    var service = [ ];
    var publisher = new Util.Publisher();

    service.applyUpdate = function(items) {
        var mapOld = { }, mapNew = { };
        this.forEach(function(item) { mapOld[item.code] = item; });
        items.forEach(function(item) { mapNew[item.code] = item; });

        // Remove old entries absent in update
        for(var code in mapOld) {
            if (!mapNew[code]) { delete mapOld[code]; }
        }

        // Add or update old entries based on update
        for(var code in mapNew) {
            if (!mapOld[code]) { mapOld[code] = mapNew[code]; }
            else { Util.applyUpdate(mapOld[code], mapNew[code]); }
        }

        this.length = 0;
        for(var code in mapOld) {
            this.push(mapOld[code]);
        }
        this.sort(posPred);

        publisher.publish(this);
    };

    service.commit = function(play) {
        for (var i = 0; i < this.length; i++) {
            if (this[i].code == play.code) {
                Util.applyUpdate(this[i], play);
                break
            }
        }
        if (i == this.length) {
            this.push(play);
        }
        this.sort(posPred);

        publisher.publish(this);
    };

    service.top = function() { return this[0]; };

    service.subscribeToUpdate = publisher.subscribe;

    return service;
});

servicesModule.service('NetService', function($http, $q, PartyService, UserService, SongCacheService) {
    var serverAddress = 'https://api.partyshark.tk';

	return {
		createParty: function() {
			return $http.post(serverAddress+'/parties', {})
                .then(function(response, headers) {
                    return {
                        party: response.data,
                        userCode: 0 + response.headers(['x-set-user-code'])
                    };
                });
		},
		getParty: function() {
            return $http.get(serverAddress+'/parties/'+PartyService.code, {headers: {'x-user-code': UserService.code}})
                .then(function(res) { return res.data; })
        },
        updateParty: function(update) {
            var req = {
                 method: 'PUT',
                 url: serverAddress+'/parties/'+PartyService.code,
                 headers: {'x-user-code': UserService.code},
                 data: update
            }
            return $http(req).then(function(response) { return response.data; });
        },

        createSelf: function() {
            return $http.post(serverAddress+'/parties/'+PartyService.code+'/users', { })
                .then(function(response) {
                    return {
                        self: response.data,
                        userCode: 0 + response.headers(['x-set-user-code'])
                    };
                });
        },
        getSelf: function() {
            return $http.get(serverAddress+'/parties/'+PartyService.code+'/users/self', {headers: {'x-user-code': UserService.code}})
                .then(function(response) {
                    return response.data;
                });
        },
        updateSelf: function(update) {
            var req = {
                 method: 'PUT',
                 url: serverAddress+'/parties/'+PartyService.code+'/users/self',
                 headers: {'x-user-code': UserService.code},
                 data: update
            };
            return $http(req).then(function(response) { return response.data; });
        },
        deleteSelf: function() {
            var req = {
                 method: 'DELETE',
                 url: serverAddress+'/parties/'+PartyService.code+'/users/self',
                 headers: {'x-user-code': UserService.code},
                 data: {}
            };
            return $http(req).then(function(response) { return null; });
        },

        getPlayerTransferRequest: function(transferCode) {
            return $http.get(serverAddress+'/parties/'+PartyService.code+'/playertransfers/'+transferCode, {headers: {'x-user-code': UserService.code}})
                .then(function(response) {
                    return response.data;
                });
        },
        getPlayerTransferRequests: function() {
            return $http.get(serverAddress+'/parties/'+PartyService.code+'/playertransfers', {headers: {'x-user-code': UserService.code}})
                .then(function(response) {
                    return response.data;
                });
        },
		createPlayerTransferRequest: function() {
            return $http.post(serverAddress+'/parties/'+PartyService.code+'/playertransfers', {}, {headers: {'x-user-code': UserService.code}})
                .then(function(response) {
                        return response.data;
                });
		},
        approvePlayerTransfer: function(transferCode) {
            var req = {
                 method: 'PUT',
                 url: serverAddress+'/parties/'+PartyService.code+'/playertransfers/'+transferCode,
                 headers: {'x-user-code': UserService.code},
                 data: {'status': 1}
            };
            return $http(req)
                .then(function(response) {
                    return response.data;
                });
        },

		getPlaylist: function() {
            return $http.get(
                serverAddress+'/parties/'+PartyService.code+'/playlist',
                { headers: {'x-user-code': UserService.code} }
            )
            .then(function(response) {
                return Util.reviveDataset(response.data);
            });
        },

		createPlaythrough: function(songCode) {
			return $http.post(
			    serverAddress+'/parties/'+PartyService.code+'/playlist',
				{"song_code": songCode},
			    {headers: {'x-user-code': UserService.code}}
            )
            .then(function(response) {
                return response.data;
            });
		},
        deletePlaythrough: function(playthroughCode) {
            var req = {
                 method: 'DELETE',
                 url: serverAddress+'/parties/'+PartyService.code+'/playlist/'+playthroughCode,
                 headers: {'x-user-code': UserService.code},
                 data: {}
            };
            return $http(req).then(function(response) { return null; });
        },
		updatePlaythrough: function(playthroughCode, update) {
            var req = {
                 method: 'PUT',
                 url: serverAddress+'/parties/'+PartyService.code+'/playlist/'+playthroughCode,
                 headers: {'x-user-code': UserService.code},
                 data: update
            };
            return $http(req).then(function(response) { return response.data; });
		},

		getPartySettings: function() {
            return $http.get(serverAddress+'/parties/'+PartyService.code+'/settings', {headers: {'x-user-code': UserService.code}})
                .then(function(response) { return response.data; });
		},
		updatePartySettings: function(update) {
			var req = {
				 method: 'PUT',
				 url: serverAddress+'/parties/'+PartyService.code+'/settings',
				 headers: {'x-user-code': UserService.code},
				 data: update
			};
			return $http(req).then(function(response) { return response.data; });
		},

		getSong: function(songCode) {
           var song = SongCacheService.getSong(songCode);

           if(song) {
               var deferred = $q.defer();
               deferred.resolve(song);
               return deferred.promise;
           }
           else {
               return $http.jsonp(
                   'https://api.deezer.com/track/'+songCode+'&output=jsonp&callback=JSON_CALLBACK',
                   { headers: {'x-user-code': UserService.username} }
               )
               .then(function(response) {
                   var result = response.data;
                   var song = {
                      'code': result.id,
                      'title': result.title_short,
                      'duration': result.duration * 1000,
                      'artist': result.artist.name,
                      'art': result.album.cover,
                      'year': result.release_date.split('-')[0]
                   };
                   SongCacheService.addSong(song);
                   return song;
               });
           }
        },
		searchSongs: function(query) {
            return $http.jsonp('https://api.deezer.com/search?q='+query+'&output=jsonp&callback=JSON_CALLBACK')
                .then(function(response) {
                        var arr = [ ];

                        response.data.data.forEach(function(result) {
                            arr.push({
                                'code': result.id,
                                'title': result.title_short,
                                'duration': result.duration * 1000,
                                'artist': result.artist.name,
                                'art': result.album.cover
                            });
                        });

                        return arr;
                    });
        }
	}
});

servicesModule.service('PlayerService', function($rootScope, $interval, $q, PlaylistService, OptionsService, NetService, PartyService) {

    var nowPlayingCode = 1, radioIsQueued = false;
    var stations = Object.freeze([37765, 30901, 31031, 36801, 31061, 30661, 37091, 30851]);
    var trackEnd = new Util.Publisher(), playerPosition = new Util.Publisher(), trackChanged = new Util.Publisher();
    var shouldPlay = false, hasContent = false;

    function getRadioStation() {
        var genre = OptionsService.default_genre;
        if(genre == null || genre < 0 || genre >= stations.length) { return -1; }
        else { return stations[genre]; }
    }

    // Init player (should be deferred)
    DZ.init({
        appId  : '174261',
        channelUrl : 'https://www.partyshark.tk/channel.html',
        player : {
            onload : function() {
                $.notify("Player is initialized.", "success");

                DZ.Event.subscribe('track_end', function(song) {
                    $rootScope.$apply(function() { trackEnd.publish(song); });
                });
                DZ.Event.subscribe('current_track',function(song) {
                    $rootScope.$apply(function() { trackChanged.publish(song.track); });
                });
                DZ.Event.subscribe('player_position', function(pos) {
                    if (!pos[1]) { return; }

                    if (pos[0] || pos[0] === 0) {
                        $rootScope.$apply(function() { playerPosition.publish(pos[0] / pos[1]); });
                    }
                });
            }
        }
    });

    function pausePlay() {
        if (shouldPlay && hasContent) {
            DZ.player.play();
        }
        else {
            DZ.player.pause();
        }
    }

    var service = {
        subscribeToTrackEnd: trackEnd.subscribe,

        subscribeToPlayerPosition: playerPosition.subscribe,

        pause: function() {
            shouldPlay = false;
            pausePlay();
        },

        play: function() {
            shouldPlay = true;
            pausePlay();
        },

        queueSong: function(songCode) {
            DZ.player.playTracks([songCode]);

            if (songCode || songCode === 0) {
                hasContent = true;
                radioIsQueued = false;
            }
            else {
                hasContent = false;
            }

            pausePlay();
        },

        queueStation: function(stationCode) { 
            DZ.player.playRadio(getRadioStation(stationCode));
            radioIsQueued = true;
            hasContent = true;
            pausePlay();
        },

        nowPlayingCode: function() {
            var track = DZ.player.getCurrentTrack()
            return (!track) ? null : track.id;
        },

        radioIsQueued: function() { return radioIsQueued; },

        availableGenres: Object.freeze({
            'None': null,
            'Classic Rock': 0,
            'Metal': 1,
            'Jazz': 2,
            'Country': 3,
            'Top Hits': 4,
            'Classical': 5,
            'Folk': 6,
            'Electronic': 7
        })
    };

    return service;
});

servicesModule.service('SoundsService', function($interval) {
    // Load sounds
    ion.sound({
        sounds: [
            {name: "rap_horn"},
        ],

        // main config
        path: "./sounds/",
        preload: true,
        multiplay: true,
        volume: 1.0
    });

    var service = {
        playRapHorn: function() { 
           ion.sound.play('rap_horn');
           $interval(function() {
               $interval(function() {ion.sound.play('rap_horn');}, 150, 5, false);
           }, 200, 1, false);
        }
    };

    return service;
});

servicesModule.service('PollingService', function($interval, $q, NetService, PartyService, PlayerService, PlaylistService, OptionsService, UserService) {

    var pullPaused = false;

    // Pull in data
    $interval(function() {
        if(PartyService.isActive() && !pullPaused) {
            NetService.getParty().then(function(partyUpdate) {
                PartyService.applyUpdate(partyUpdate);
            });

            NetService.getPartySettings().then(function(partySettingsUpdate) {
                OptionsService.applyUpdate(partySettingsUpdate);
            });

            NetService.getPlaylist().then(function(playlistUpdate) {
                var songPromises = [ ];

                playlistUpdate.forEach(function(play) {
                    songPromises.push(
                        NetService.getSong(play.song_code).then(
                            function(song) { play.song = song;}
                        )
                    );
                });

                // Update the playlist when all song promises have completed
                $q.all(songPromises).then(function() {
                    PlaylistService.applyUpdate(playlistUpdate);
                })
            });
        }
    }, 3000);

    return {
        pausePull: function() { pullPaused = true; },
        resumePull: function() { pullPaused = false; }
    };
});




