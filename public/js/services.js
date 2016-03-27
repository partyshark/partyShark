var servicesModule = angular.module('servicesModule',[]);

servicesModule.service('PartyService', function() {
    return {
        code: null,
        admin_code: null,
        player: null,
        is_playing: null,

        isActive: function() { return this.code !== null; },

        applyUpdate: function(update) {
            if (!update) { update = {code: null, admin_code: null, player: null, is_playing: null}; }
            Util.applyUpdate(this, update);
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

        isDefined: function() { return this.code !== null; },

        applyUpdate: function(update) {
            if (!update) { update = {code: null, is_admin: null, username: null}; }
            Util.applyUpdate(this, update);
        }
    };
});

servicesModule.service('OptionsService', function() {
    var service = {
        user_cap: null,
        playthrough_cap: null,
        virtual_dj: null,
        veto_ratio: null,
        default_genre: null,


        applyUpdate: function(update) {
            if (!update) { update = {user_cap: null, playthrough_cap: null, virtual_dj: null, veto_ratio: null, default_genre: null}; }
            Util.applyUpdate(this, update);
        }
    };

    return service;
});

servicesModule.service('SongCacheService', function() {
    var _cache = { };
    return Object.freeze({
        getSong: function(songCode) {
           return _cache[songCode];
        },
        addSong: function(song) {
           _cache[song.code] = song;
        }
    });
});

servicesModule.service('PlaylistService', function() {
    function posPred(a, b) { return a.position - b.position; }

    var service = [ ];

    service.applyUpdate = function(items) {
        if (!items) {
            service.length = 0;
            return;
        }

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
    };

    service.top = function() { return this[0]; };

    return service;
});

servicesModule.service('TransferService', function() {
    var cache = { }, unmarked = { };

    var service = Object.freeze({
        addAll: function(transfers) {
            if (!transfers) { return; }

            transfers.forEach(function(trans) {
                if (!cache[trans.code]) { unmarked[trans.code] = trans; }
                cache[trans.code] = trans;
            });
        },

        mark: function(transfer) {
            delete unmarked[transfer.code];
        },

        unmarked: unmarked
    });

    return service;
})

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
            var conversions = {
                is_playing: Convert.toBoolLax
            };

            var req = {
                 method: 'PUT',
                 url: serverAddress+'/parties/'+PartyService.code,
                 headers: {'x-user-code': UserService.code},
                 data: Util.convertProperties(update, conversions)
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
            var conversions = {
                admin_code: Convert.tooIntLax
            };

            var req = {
                 method: 'PUT',
                 url: serverAddress+'/parties/'+PartyService.code+'/users/self',
                 headers: {'x-user-code': UserService.code},
                 data: Util.convertProperties(update, conversions)
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
                    return Util.reviveDataset(response.data);
                });
        },
		createPlayerTransferRequest: function() {
            return $http.post(serverAddress+'/parties/'+PartyService.code+'/playertransfers', {}, {headers: {'x-user-code': UserService.code}})
                .then(function(response) {
                    return response.data;
                });
		},
        acceptPlayerTransferRequest: function(transferCode) {
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
            var conversions = {
                completed_ratio: Convert.toNumberLax,
                vote: Convert.toIntLax
            };

            var req = {
                 method: 'PUT',
                 url: serverAddress+'/parties/'+PartyService.code+'/playlist/'+playthroughCode,
                 headers: {'x-user-code': UserService.code},
                 data: Util.convertProperties(update, conversions)
            };
            return $http(req).then(function(response) { return response.data; });
		},

		getPartySettings: function() {
            return $http.get(serverAddress+'/parties/'+PartyService.code+'/settings', {headers: {'x-user-code': UserService.code}})
                .then(function(response) { return response.data; });
		},
		updatePartySettings: function(update) {
            var conversions = {
                playthrough_cap: Convert.toIntLax,
                user_cap: Convert.toIntLax,
                virtual_dj: Convert.toBoolLax,
                veto_ratio: Convert.toNumberLax
            };

			var req = {
				 method: 'PUT',
				 url: serverAddress+'/parties/'+PartyService.code+'/settings',
				 headers: {'x-user-code': UserService.code},
				 data: Util.convertProperties(update, conversions)
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
                      'album': result.album.title,
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

    var cuedSongCode = null, shouldPlay = false, pendingStart = false;

    var stations = Object.freeze([37765, 30901, 31031, 36801, 31061, 30661, 37091, 30851]);

    var songStart = new Util.Publisher(), songEnd = new Util.Publisher(), songPosition = new Util.Publisher();


    function getRadioStation() {
        var genre = OptionsService.default_genre;
        if(genre == null || genre < 0 || genre >= stations.length) { return -1; }
        else { return stations[genre]; }
    }

    // Init player (should be deferred)
    DZ.init({
        appId: '174261',
        channelUrl: 'https://www.partyshark.tk/channel.html',
        player: {
            onload : function() {
                $.notify("Player is initialized.", "success");
                DZ.player.playTracks([null], false);

                DZ.Event.subscribe('track_end', function() {
                    $rootScope.$apply(function() {
                        Util.log('Ending');

                        cuedSongCode = null;
                        songEnd.publish();
                    });
                });
                DZ.Event.subscribe('player_position', function(pos) {
                    if (!pos[1]) { return; }

                    if (pos[0] || pos[0] === 0) {
                        $rootScope.$apply(function() {
                            songPosition.publish(pos[0] / pos[1]);
                        });
                    }
                });
            }
        }
    });

    songStart.subscribe(function() { Util.log('Starting: '+cuedSongCode); })

    var service = Object.freeze({

        onStart: songStart.subscribe,

        onEnd: songEnd.subscribe,

        onPosition: songPosition.subscribe,

        allowPlay: function(v) {
            shouldPlay = v;

            if (shouldPlay && cuedSongCode !== null) {
                if (pendingStart) {
                    songStart.publish();
                    pendingStart = false;
                }
                DZ.player.play();
            }
            else { DZ.player.pause(); }
        },

        cueSong: function(songCode, time) {
            cuedSongCode = Convert.toIntLax(songCode);
            DZ.player.playTracks([cuedSongCode], shouldPlay && cuedSongCode !== null, 0, time);

            if(cuedSongCode === null) {
                pendingStart = false;
                DZ.player.pause();
            }
            else {
                if (shouldPlay) {
                    songStart.publish();
                    pendingStart = false;
                }
                else if (!shouldPlay) {
                    pendingStart = true;
                    DZ.player.pause();
                }
            }

        },

        cuedSongCode: function() {
            return cuedSongCode;
        },

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
    });

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

servicesModule.service('PollingService', function($interval, $q, NetService, PartyService, PlayerService, PlaylistService, OptionsService, UserService, TransferService) {

    var pullPaused = false;

    // Pull in data
    $interval(function() {
        if(PartyService.isActive() && UserService.isDefined() && !pullPaused) {
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

            if (UserService.is_admin) {
                NetService.getPlayerTransferRequests().then(function(transList) {
                    TransferService.addAll(transList);
                });
            }
        }
    }, 3000);

    return {
        pausePull: function() { pullPaused = true; },
        resumePull: function() { pullPaused = false; }
    };
});




