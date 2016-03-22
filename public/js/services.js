var servicesModule = angular.module('servicesModule',[]);

servicesModule.service('PartyService', function() {
    return {
        code: null,
        admin_code: null,
        player: null,
        is_playing: null,

        isActive: function() { return this.code !== null; }
    };
});

servicesModule.service('UserService', function(PartyService) {
    return {
        code: null,
        username: null,

        isPlayer: function() { return this.username && (this.username == PartyService.player); }
    };
});

servicesModule.service('OptionsService', function() {
    var genreLabels = Object.freeze(['Classic Rock', '', '', 'Country', 'Top Hits']);

    var service = {
        user_cap: null,
        playthrough_cap: null,
        virtual_dj: null,
        veto_ratio: null,
        default_genre: null
    };

    function getGenreLabel() {
        var dg = service.default_genre;
        if(dg ==  null || dg < 0 || dg >= genreLabels.length) { return 'None'; }
        else { return genreLabels[dg]; }
    }
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

servicesModule.service('playlistService', function() {
	var _emptyPlaylist = true;
	var _playlist = [];
    var _playerInitialized = false;
	return {
		isEmpty: function() {
			return _emptyPlaylist;
		},
		getPlaylist: function() {
			return _playlist;
		},
        getTopPlaythrough: function() {
            for (var i=0; i<_playlist.length; i++) {
                if(_playlist[i].position == 0)
                    return _playlist[i];
            }
            return false;
        },
		setPlaylist: function(playlist) {
			_playlist = playlist;
            if(playlist.length) {
               _emptyPlaylist = false;
                return true; 
            }
            return false;
		},
	}
});

servicesModule.service('NetService', function($http, $q, PartyService, UserService) {
    var serverAddress = 'https://api.partyshark.tk';

	return {
		createParty: function() {
			return $http.post(serverAddress+'/parties', {})
                .then(function(response, headers) {
                    return {
                        party: response.data,
                        UserService.code = response.headers(['x-set-user-code']);
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
            return $http.post(serverAddress+'/parties/'+PartyService.code+'/users')
                .then(function(response) {
                    return {
                        party: response.data,
                        UserService.code = response.headers(['x-set-user-code']);
                    };
                });
        },
        deleteSelf: function() {
            return $http.delete(serverAddress+'/parties/'+PartyService.code+'/users/self', {headers: {'x-user-code': UserService.code}})
                .then(function(response) {
                    return response.data;
                });
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
            }
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
            }
            return $http(req).then(function(response) { return null; });
        },
		updatePlaythrough: function(playthroughCode, update) {
            var req = {
                 method: 'PUT',
                 url: serverAddress+'/parties/'+PartyService.code+'/playlist/'+playthroughCode,
                 headers: {'x-user-code': UserService.code},
                 data: update
            }
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
			}
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

servicesModule.service('playerService', function($rootScope, $interval, $q, playlistService, OptionsService, NetService, PartyService) {

    var nowPlayingCode = 1, radioIsQueued = false;
    var stations = Object.freeze([37765, 30901, 31031, 36801, 31061, 30661, 37091, 30851]);
    var trackEnd = new Util.Publisher(), playerPosition = new Util.Publisher(), trackChanged = new Util.Publisher();

    function getRadioStation() {
        var genre = OptionsService.getDefaultGenre();
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
                    $rootScope.$apply(function() { playerPosition.publish(pos); });
                });
            }
        }
    });


    var service = {
        subscribeToTrackEnd: trackEnd.subscribe,

        subscribeToPlayerPosition: playerPosition.subscribe,

        queueSong: function(songCode) { 
            DZ.player.playTracks([songCode]);
            radioIsQueued = false;
        },

        pause: function() { DZ.player.pause(); },

        play: function() { DZ.player.play(); },

        queueStation: function(stationCode) { 
            DZ.player.playRadio(getRadioStation(stationCode));
            radioIsQueued = true;
        },

        nowPlayingCode: function() {
            var track = DZ.player.getCurrentTrack()
            return (!track) ? null : track.id;
        },

        radioIsQueued: function() { return radioIsQueued; }
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





