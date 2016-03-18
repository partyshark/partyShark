var serverAddress = 'https://api.partyshark.tk';

var servicesModule = angular.module('servicesModule',[]);

servicesModule.service('partyService', function(){
    var _partyCode = "",
    	_adminCode = "",
    	_userName = "",
    	_playerName = "",
    	_displayName = "null",
    	_isPlaying = false,
        _isInParty = false,
        _refreshInterval = null;
    return {
        isPlayer: function() {
            return (_displayName == _playerName);
        },
        isInParty: function() {
            return _isInParty;
        },
    	getUserName: function() {
    		return _userName;
    	},
    	getPartyCode: function() {
    		return _partyCode;
    	},
        getPlayerName: function() {
            return _playerName;
        },
        getDisplayName: function() {
        	return _displayName;
        },
        getAdminCode: function() {
            return _adminCode;
        },
        setDisplayName: function(displayName) {
        	_displayName = displayName;
        	return true;
        },
    	setPartyCode: function(partyCode) {
            _isInParty = true;
    		_partyCode = partyCode;
    		return true;
    	},
    	setAdminCode: function(adminCode) {
    		_adminCode = adminCode;
    		return true;
    	},
    	setUserName: function(userName) {
    		_userName = userName;
    		return true;
    	},
    	setPlayerName: function(playerName) {
    		_playerName = playerName;
    		return true;
    	},
    	setPlaying: function(status) {
    		_isPlaying = status;
    		return true;
    	},
    	setParty: function(partyObject) {
    		_partyCode = partyObject.code;
            _adminCode = partyObject.admin_code;
            _playerName = partyObject.player;
            _isPlaying = partyObject.is_playing;
            _isInParty = true;
    	},
        startRefresh: function() {

        },
        stopRefresh: function() {
            
        }
    }
});

servicesModule.service('optionsService', function() { 
	var _numParticipants = 10,
		_maxQueueSize = 50,
		_virtualDj = false,
		_defaultGenre = 4,
		_vetoRatio = 0.5;

	return {
		getNumParticipants: function() {
			return _numParticipants;
		},
		getMaxQueueSize: function() {
			return _maxQueueSize;
		},
		getVirtualDj: function() {
			return _virtualDj;
		},
		getDefaultGenre: function() {
			return _defaultGenre;
		},
		getVetoRatio: function() {
			return _vetoRatio;
		},
		setNumParticipants: function(num) {
			_numParticipants = num;
			return _numParticipants;
		},
		setMaxQueueSize: function(size) {
			_maxQueueSize = size;
			return _maxQueueSize;
		},
        setDefaultGenre: function(genre) {
            _defaultGenre = genre;
        }
	}
});

servicesModule.service('cacheService', function() {
	_songCache = [];
	return {
		isSongCached: function(songCode) {
			for(var i=0; i<_songCache.length; i++) {
                if(_songCache[i].code == songCode)
                    return _songCache[i];
            }
            return false;
		},
        addSongCache: function(song) {
            _songCache.push(song);
        }
	}
});

servicesModule.service('playlistService', function() {
	var _emptyPlaylist = true;
	var _playlist = [];
    var _playerInitialized = false;
	return {
        setPlayerInitialized: function() {
            _playerInitialized = true;
            return true;
        },
        isPlayerInitialized: function() {
            return _playerInitialized;
        },
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
		}
	}
});

servicesModule.service('netService', function($http, $q, partyService, cacheService, playlistService, optionsService, cacheService) {
	return {
		createParty: function() {
			return $http.post(serverAddress+'/parties', {
                
			})
                .then(function(response, headers) {
                    partyService.setParty(response.data);
                    partyService.setUserName(response.headers(['x-set-user-code']));
                    return response;
                }, function(response) {
                    return $q.reject(response.data);
                });
		},
		getParty: function(partyCode) {
            return $http.get(serverAddress+'/parties/'+partyCode, {headers: {'x-user-code': partyService.getUserName()}})
                .then(function(response) {
                    partyService.setParty(response.data);
                    return response;
                }, function(response) {
                    return $q.reject(response.data);
                });
        },
        updateParty: function(partyCode, status) {
            var req = {
                 method: 'PUT',
                 url: serverAddress+'/parties/'+partyCode,
                 headers: {
                   'x-user-code': partyService.getUserName()
                 },
                 data: {
                    "is_playing": status
                }
            }
            return $http(req)
                .then(function(response) {
                        return response.data;
                }, function(error) {
                    return $q.reject(error);
                });
        },
        getPlayerTransferRequest: function(playerTransferCode) {
            return $http.get(serverAddress+'/parties/'+partyService.getPartyCode()+'/playertransfers/'+playerTransferCode, {headers: {'x-user-code': partyService.getUserName()}})
                .then(function(response) {
                    return response;
                }, function(response) {
                    return $q.reject(response);
                });
        },
        getPlayerTransferRequests: function() {
            return $http.get(serverAddress+'/parties/'+partyService.getPartyCode()+'/playertransfers', {headers: {'x-user-code': partyService.getUserName()}})
                .then(function(response) {
                    return response;
                }, function(response) {
                    return $q.reject(response);
                });
        },
		requestPlayer: function() {
            return $http.post(serverAddress+'/parties/'+partyService.getPartyCode()+'/playertransfers', {}, {
                        headers: {'x-user-code': partyService.getUserName()}})
                .then(function(response) {
                        return response;
                }, function(response) {
                    return $q.reject(response);
                });
		},
        approvePlayerTransfer: function(status, requestCode) {
            var req = {
                 method: 'PUT',
                 url: serverAddress+'/parties/'+partyService.getPartyCode()+'/playertransfers/'+requestCode,
                 headers: {
                   'x-user-code': partyService.getUserName()
                 },
                 data: {
                   'status': status
                }
            }
            return $http(req)
                .then(function(response) {
                        return response.data;
                }, function(error) {
                    return $q.reject(error);
                });
        },
		getPlaylist: function(partyCode) {
            return $http.get(
                serverAddress+'/parties/'+partyService.getPartyCode()+'/playlist',
                { headers: {'x-user-code': partyService.getUserName()} }
            )
            .then(
                function(response) {
                    var arr = [ ], names = response.data.properties;

                    response.data.values.forEach(function(valList) {
                        var obj = { };
                        valList.forEach(function(val, index) {
                            obj[names[index]] = val;
                        });
                        arr.push(obj);
                    });

                    playlistService.setPlaylist(arr);
                    return response;
                },
                function(response) {
                    return $q.reject(response);
                }
            );
        },
		createPlaythrough: function(songId) {
			return $http.post(serverAddress+'/parties/'+partyService.getPartyCode()+'/playlist', {
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
                 url: serverAddress+'/parties/'+partyService.getPartyCode()+'/playlist/'+playthroughCode,
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
                 url: serverAddress+'/parties/'+partyService.getPartyCode()+'/playlist/'+playthroughCode,
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
            return $http.get(serverAddress+'/parties/'+partyService.getPartyCode()+'/settings', {headers: {'x-user-code': partyService.getUserName()}})
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
				 url: serverAddress+'/parties/'+partyService.getPartyCode()+'/settings',
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
                       'art': result.album.cover,
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
			return $http.post(serverAddress+'/parties/'+partyService.getPartyCode()+'/users', {})
			.then(function(response) {
				partyService.setUserName(response.headers(['x-set-user-code']));
				partyService.setDisplayName(response.data.username);
                return response;
            }, function(response) {
            	return $q.reject(response);
            });
		},
        getDisplayName: function() {
            return $http.get(serverAddress+'/parties/'+partyService.getPartyCode()+'/users/self', {
                        headers: {'x-user-code': partyService.getUserName()}})
                .then(function(response) {
                    partyService.setDisplayName(response.data.username);
                    return response.data;
                }, function(response) {
                    return $q.reject(response);
                });
        },
        leaveParty: function() {
            return $http.delete(serverAddress+'/parties/'+partyService.getPartyCode()+'/users/self', {
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
                 url: serverAddress+'/parties/'+partyService.getPartyCode()+'/users/self',
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
            return $http.get(serverAddress+'/parties/'+partyService.getPartyCode()+'/users/self', {
                        headers: {'x-user-code': partyService.getUserName()}})
                .then(function(response) {
                    return response.data.is_admin;
                }, function(response) {
                    return $q.reject(response);
                });
        }
	}
});

servicesModule.service('playerService', function($rootScope, $interval, $q, playlistService, optionsService, netService, partyService) {
    var _playerInterval = null,
        _player,
        _playerSeesEmpty = true,
        _playingRadio = false,
        _currPlayingCode;

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
            DZ.Event.subscribe('player_position', function(arg){
                $("#slider_seek").find('.bar').css('width', (100*arg[0]/arg[1]) + '%');
            });

            DZ.Event.subscribe('current_track', function(track) {
                $rootScope.trackTitle = track.track.title;
                $rootScope.trackArtist = track.track.artist.name;
            });
        },
        playNextPlaythrough: function() {
            var playthrough = playlistService.getTopPlaythrough();
            if(playthrough) {
                _currPlayingCode = playthrough.code;
                _playerSeesEmpty = false;
                _playingRadio = false;
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
                    }
                } 
            }
        }
    }
});





