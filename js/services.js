var servicesModule = angular.module('servicesModule',[]);

function applyUpdate(update) {
    for (var key in update) {
        if (this.hasOwnProperty(key)) {
            this[key] = update[key];
        }
    }
}

function resonstructDataset(dataset) {
    var ret = [ ];
    dataset.values.forEach(function(valList) {
        var obj = { };
        valList.forEach(function(item, index) {
            obj[dataset.properties[index]] = item;
        });
        ret.push(obj);
    });
    return ret;
}

servicesModule.service('ModelService', function($interval, netService) {
    var party = {
        code: null,
        is_playing: null,
        player: null,
        admin_code: null,

        meta: {
            hasCode: false,
            isDefined: false
        }
    };

    var user = {
       code: null,
       username: null,
       is_admin: null,

       meta: {
           hasCode: false,
           isDefined: false
       }
    };

    var options = {
        user_cap: null,
    	playthrough_cap: null,
    	virtul_dj: null,
    	defualt_genre: null,
        veto_ratio = null,

        meta: {
            isDefined: false
        }
    };

    return Object.freeze({
       party: party,
       user: user,
       playlist: playlist,
       options: options,
       songs = { },
       transfers = { },
       playlist = [ ]
    });
});

servicesModule.service('NavService', function() {
    return {
        activeButtonIds: [ ]
    };
});

servicesModule.service('NetService', function($http, $q, ModelService) {
    function defaultHeaders() {
        if (!ModelService.user.meta.hasCode) { return null; }
        return {'x-user-code': ModelService.user.code};
    }
    
    var apiBaseUrl = 'https://api.partyshark.tk';
    
	var NetService = {
		createParty: function() {
			return $http.post(apiBaseUrl+'/parties', {})
                .then(
                    function(response, headers) {
                        applyUpdate.call(ModelService.party, response.data);
                        ModelService.party.meta.isDefined = true;
                        ModelService.party.meta.hasCode = true;

                        ModelService.user.code = response.headers(['x-set-user-code']);
                        ModelService.user.meta.hasCode = true;

                        return $http.get(apiBaseUrl+'/parties/'+ModelService.party.code+'/users/self', {headers: defaultHeaders()})
                            .then(function(response) {
                                applyUpdate.call(ModelService.user, response.data);
                                ModelService.user.meta.isDefined = true;

                                return ModelService.party;
                            });
                    },
                    function(response) {
                        return $q.reject(response.data);
                    }
                );
		},
		
		getParty: function() {
			return $http.get(apiBaseUrl+'/parties/'+ModelService.party.code, defaultHeaders())
                .then(
                    function(response, headers) {
                        applyUpdate.call(ModelService.party, response.data);

                        return ModelService.party
                    },
                    function(response) {
                        return $q.reject(response.data);
                    }
                );
        },

        updateParty: function() {
            var req = defaultHeaders();
            req.method: 'PUT',
            req.url: apiBaseUrl+'/parties/'+ModelService.party.code,
            req.data: {"is_playing": ModelService.party.is_playing}

            return $http(req)
                .then(function(response) {
                    applyUpdate(ModelService.party, response.data);

                    return ModelService.party;
                });
        },

        getPlayerTransferRequest: function(transfer) {
            return $http.get(apiBaseUrl+'/parties/'+ModelService.party.code+'/playertransfers/'+transfer.code, defaultHeaders())
                .then(function(response) {
                    applyUpdate.call(transfer, response.data);

                    return transfer;
                });
        },

        getPlayerTransferRequests: function() {
            return $http.get(apiBaseUrl+'/parties/'+ModelService.party.code+'/playertransfers', defaultHeaders())
                .then(function(response) {
                    var list = reconstructDataset(response.data);

                    list.forEach(function(item) {
                        var existing = ModelService.transfers[item.code];

                        if (existing) { applyUpdate.call(existing, item); }
                        else {
                            ModelService.transfers[item.code] = item;
                            item.meta = {wasSeen: false};
                        }
                    });

                    return ModelService.transfers;
                });
        },

		requestPlayer: function() {
            return $http.post(apiBaseUrl+'/parties/'+ModelService.party.code+'/playertransfers', defaultHeaders())
                .then(function(response) {
                    var existing = ModelService.transfers[response.data.code]
                    if (existing) {
                        applyUpdate.call(existing, response.data);
                        return existing;
                    }
                    else {
                        response.data.meta = { wasSeen: false; }
                        ModelService.transfers[response.data.code] = response.data;
                        return response.data.
                    }
                });
		},

        approvePlayerTransfer: function(tranfer) {
            var req = defaultHeaders();
            req.method = 'PUT';
            req.url = apiBaseUrl+'/parties/'+ModelService.party.code+'/playertransfers/'+transfer.code;
            data = {'status': 1};

            return $http(req)
                .then(function(response) {
                    var existing = ModelService.transfers[response.data.code]
                    applyUpdate.call(existing, response.data);
                    return existing;
                }):
        },

		getPlaylist: function() {
            return $http.get(apiBaseUrl+'/parties/'+ModelService.party.code+'/playlist', defaultHeaders())
                .then(
                    function(response) {
                        var responseList = reconstructDataset(response);

                        var existingMap = { };
                        ModelService.playlist.forEach(function(play) {
                            existingMap[play.code] = play;
                        });

                        var resultList = [ ];
                        var futureSongs = [ ];
                        responseList.forEach(function(responsePlay) {
                            var existing = existingMap[responsePlay.code];
                            if (existing) {
                                applyUpdate.call(exists, responsePlay);
                                resultList.push(existing);
                            }
                            else {
                                var futureSong = NetService.getSong(responsePlay.song_code);
                                futureSongs.push(futureSong);
                                resultList.push(responsePlay);

                                futureSong.then(function(song) {
                                    responsePlay.song = song;
                                });
                            }
                        });

                        resultList.sort(function(a, b) { return a.position - b.position; });

                        return $q.all(futureSongs).then(function() {
                            ModelService.playlist = resultList;
                            return resultList;
                        });
                    },
                    function(response) {
                        return $q.reject(response);
                    }
                );
        },
		createPlaythrough: function(songId) {
			return $http.post(apiBaseUrl+'/parties/'+partyService.getPartyCode()+'/playlist', {
				"song_code": songId
			}, {
                        headers: {'x-user-code': partyService.getUserName()}})
                .then(function(response) {
                        return response;
                }, function(response) {
                    return $q.reject(response);
                });
		},
        deletePlaythrough: function(playthroughCode) {
            var req = {
                 method: 'DELETE',
                 url: apiBaseUrl+'/parties/'+partyService.getPartyCode()+'/playlist/'+playthroughCode,
                 headers: {
                   'x-user-code': partyService.getUserName()
                 },
                 data: {}
            }
            return $http(req)
                .then(function(response) {
                        return response.data;
                }, function(error) {
                    return $q.reject(error);
                });
        },
		updateCurrentPlaythrough: function(partyCode, playthroughCode, vote, duration) {
            var req = {
                 method: 'PUT',
                 url: apiBaseUrl+'/parties/'+partyService.getPartyCode()+'/playlist/'+playthroughCode,
                 headers: {
                   'x-user-code': partyService.getUserName()
                 },
                 data: {
                    "completed_duration": duration,
                    "vote": vote
                }
            }
            return $http(req)
                .then(function(response) {
                        return response.data;
                }, function(error) {
                    return $q.reject(error);
                });
		},
		getPartySettings: function() {
            return $http.get(apiBaseUrl+'/parties/'+partyService.getPartyCode()+'/settings', {headers: {'x-user-code': partyService.getUserName()}})
                .then(function(response) {
                    optionsService.setDefaultGenre(response.data.default_genre);
                    optionsService.setNumParticipants(response.data.user_cap);
                    optionsService.setMaxQueueSize(response.data.playthrough_cap);
                    return response;
                }, function(response) {
                    return $q.reject(response.data);
                });
		},
		updatePartySettings: function(genre, participants, queue) {
			var req = {
				 method: 'PUT',
				 url: apiBaseUrl+'/parties/'+partyService.getPartyCode()+'/settings',
				 headers: {
				   'x-user-code': partyService.getUserName()
				 },
				 data: {
					"virtual_dj": optionsService.getVirtualDj(),
	  				"default_genre": genre,
	  				"user_cap": participants,
	  				"playthrough_cap": queue,
	  				"veto_ratio": optionsService.getVetoRatio()
				}
			}
			return $http(req)
                .then(function(response) {
                    optionsService.setDefaultGenre(response.data.default_genre);
                    optionsService.setNumParticipants(response.data.user_cap);
                    optionsService.setMaxQueueSize(response.data.playthrough_cap);
                    console.log(optionsService.getDefaultGenre());
                    return response;
                }, function(response) {
                    return $q.reject(response);
                });
		},
		getSong: function(songCode) {
            var song = cacheService.isSongCached(songCode);
            if(song) {
                var deferred = $q.defer();
                deferred.resolve(song);
                return deferred.promise;
            }
            else {
                return $http.jsonp(
                    'https://api.deezer.com/track/'+songCode+'&output=jsonp&callback=JSON_CALLBACK',
                    { headers: {'x-user-code': partyService.getUserName()} }
                )
                .then(function(response) {
                    var result = response.data;

                    var song = {
                       'code': result.id,
                       'title': result.title_short,
                       'duration': result.duration * 1000,
                       'artist': result.artist.name,
                       'art': result.album.cover_small,
                       'year': result.release_date.split('-')[0]
                    };

                    cacheService.addSongCache(song);
                    return song;
                },
                function(response) {
                    return $q.reject(response);
                });
            }
        },
		searchSongs: function(query) {
            return $http.jsonp('https://api.deezer.com/search?q='+query+'&output=jsonp&callback=JSON_CALLBACK')
                .then(
                    function(response) {
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
                    },
                    function(response) {
                        return $q.reject(response);
                    }
                );
        },
		sendContact: function(contactObject) {
			return true;
		},
		createUser: function() {
			return $http.post(apiBaseUrl+'/parties/'+partyService.getPartyCode()+'/users', {})
			.then(function(response) {
				partyService.setUserName(response.headers(['x-set-user-code']));
				partyService.setDisplayName(response.data.username);
                return response;
            }, function(response) {
            	return $q.reject(response);
            });
		},
        getDisplayName: function() {
            return $http.get(apiBaseUrl+'/parties/'+partyService.getPartyCode()+'/users/self', {
                        headers: {'x-user-code': partyService.getUserName()}})
                .then(function(response) {
                    partyService.setDisplayName(response.data.username);
                    return response.data;
                }, function(response) {
                    return $q.reject(response);
                });
        },
        leaveParty: function() {
            return $http.delete(apiBaseUrl+'/parties/'+partyService.getPartyCode()+'/users/self', {
                        headers: {'x-user-code': partyService.getUserName()}})
                .then(function(response) {
                    return response;
                }, function(response) {
                    return $q.reject(response);
                });
        },
        promoteUser: function(adminCode) {
            var req = {
                 method: 'PUT',
                 url: apiBaseUrl+'/parties/'+partyService.getPartyCode()+'/users/self',
                 headers: {
                   'x-user-code': partyService.getUserName()
                 },
                 data: {
                    "admin_code": adminCode
                }
            }
            return $http(req)
                .then(function(response) {
                        return response;
                }, function(response) {
                    return $q.reject(response);
                });
        }, 
        isAdmin: function() {
            return $http.get(apiBaseUrl+'/parties/'+partyService.getPartyCode()+'/users/self', {
                        headers: {'x-user-code': partyService.getUserName()}})
                .then(function(response) {
                    return response.data.is_admin;
                }, function(response) {
                    return $q.reject(response);
                });
        }
	};

	return NetService;
});

servicesModule.service('playerService', function($rootScope, $interval, $q, playlistService, optionsService, netService, partyService) {
    var _playerInterval = null,
        _player,
        _playerSeesEmpty = true,
        _playingRadio = false,
        _currPlayingCode,
        _currDurationPercent;

    function getRadioStation() {
        var genre = optionsService.getDefaultGenre();
        if(!genre === null)
            return -1;

        switch(genre) {
            case 0:
                return 37765;
                break;
            case 1:
                break;
            case 2:
                break;
            case 3:
                return 36801;
            case 4:
                return 31061;
                break;
            case 5:
                break;
            case 6:
                break;
            case 7:
                break;
            default:
                return -1;
        }
    }

    return {
        //Player interval is used to poll events player needs
        startPlayerInterval: function() {
            var self = this;
            if(_playerInterval) {
                $interval.cancel(_playerInterval);
            }
            _playerInterval = $interval(function() {
                //Check to see if still player, pause or play
                netService.getParty(partyService.getPartyCode())
                    .then(function(res){
                        netService.getPlaylist(partyService.getPartyCode())
                            .then(function(data) {
                                //Check to make sure current playing is still at pos 0
                                var play = playlistService.getTopPlaythrough();
                                if(play.code !== _currPlayingCode) {
                                    self.playNextPlaythrough();
                                }

                                //If playing and last song is vetoed, play next
                                if(!_playerSeesEmpty && !playlistService.getPlaylist().length) {
                                    self.playNextPlaythrough();
                                }

                            }, function(error) {
                                console.log(error);
                                $.notify("Could not get playlist.", "error");
                            });

                        //If no longer player, remove player functionality
                        if(res.data.player != partyService.getDisplayName()){
                            $rootScope.isPlayer = false;
                            $('#dz-root').empty();
                            $.notify("You are no longer the player.", "info");
                            self.stopPlayerInterval();
                        }
                        //If still player, check playing status
                        else {
                            if(res.data.is_playing)
                                DZ.player.play();
                            else
                                DZ.player.pause();
                        }

                        //update completed duration
                        netService.updateCurrentPlaythrough(partyService.getPartyCode(), _currPlayingCode, null, _currDurationPercent)
                            .then(function(success){
                                console.log("duration updated");
                            }, function(error){
                                console.log(error);
                            });
                    }, function(error){
                        console.log(error);
                        $.notify("Could not check play status", "error");
                    });

                //Check if playingRadio, if so, check for available playthroughs
                if (_playerSeesEmpty && playlistService.getPlaylist().length) {
                    self.playNextPlaythrough();
                }
            }, 5000);
        },
        stopPlayerInterval: function() {
            $interval.cancel(_playerInterval);
            _playerInterval = null;
        },
        playerSeesEmpty: function() {
            return _playerSeesEmpty;
        },
        setPlayerSeesEmpty: function(status) {
            _playerSeesEmpty = status;
        },
        isPlayingRadio: function() {
            return _playingRadio;
        },
        setPlayingRadio: function(status) {
            _playingRadio = status;
        },
        initializePlayer: function(callback) {
            var self = this;
            var deferred = $q.defer();
            deferred.resolve("Success");
            DZ.init({
                appId  : '174261',
                channelUrl : 'https://www.partyshark.tk/channel.html',
                player : {
                onload : function(){
                        playlistService.setPlayerInitialized();
                        self.playNextPlaythrough();
                        callback();
                    }
                }
            });
        },
        subscribeEvents: function() {
            DZ.Event.subscribe('current_track', function(track) {
                $rootScope.trackTitle = track.track.title;
                $rootScope.trackArtist = track.track.artist.name;
            });
            DZ.Event.subscribe('player_position', function(arg){
                _currDurationPercent = arg[0]/arg[1];
            });
        },
        playNextPlaythrough: function() {
            var playthrough = playlistService.getTopPlaythrough();
            if(playthrough) {
                _currPlayingCode = playthrough.code;
                _playerSeesEmpty = false;
                _playingRadio = false;
                $rootScope.isPlayingRadio = _playingRadio;
                DZ.player.playTracks([playthrough.song_code]);
                $.notify("Playing next song in party.", "info");
            }
            else {
                _playerSeesEmpty = true;
                if(!_playingRadio) {
                    var station = getRadioStation();
                    if(station != -1) {
                        $.notify("No more playthroughs in playlist, playing radio.", "info");
                        DZ.player.playRadio(station);
                        _playingRadio = true;
                        $rootScope.isPlayingRadio = _playingRadio;
                    }
                } 
            }
        }
    }
});





