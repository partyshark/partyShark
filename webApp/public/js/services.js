var serverAddress = 'http://nreid26.xyz:3000';

var servicesModule = angular.module('servicesModule',[]);

servicesModule.service('partyService', function(){
    var _partyCode = "",
    	_adminCode = "",
    	_userName = "",
    	_playerName = "",
    	_displayName = "null",
    	_isPlaying = false,
        _isInParty = false,
        _currPlaythroughCode = "";
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
        setCurrPlaythrough: function(playthroughCode) {
            _currPlaythroughCode = playthroughCode;
            return true;
        },
        getCurrPlaythrough: function() {
            return _currPlaythroughCode;
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
    	}
    }
});

servicesModule.service('optionsService', function() { 
	var _numParticipants = 10,
		_maxQueueSize = 50,
		_virtualDj = false,
		_defaultGenre = "hits",
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
                headers: {'Access-Control-Request-Headers' : 'http://partyshark.tk'}
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
            return $http.get(serverAddress+'/parties/'+partyCode, {headers: {'x-user-code': partyService.getUserName(),
        'Access-Control-Request-Headers' : 'http://partyshark.tk'}})
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
		requestPlayer: function(partyCode, playerTransferCode) {

		},
		getPlaylist: function(partyCode) {
            var resultsArray = [];
			return $http.get(serverAddress+'/parties/'+partyService.getPartyCode()+'/playlist', {
                        headers: {'x-user-code': partyService.getUserName()}})
                .then(function(response) {
                    //Find index of each property
                    var properties = response.data.properties,
                        codeIndex = properties.indexOf("code"),
                        song_codeIndex = properties.indexOf("song_code"),
                        positionIndex = properties.indexOf("position"),
                        upvotesIndex = properties.indexOf("upvotes"),
                        downvotesIndex = properties.indexOf("downvotes"),
                        suggesterIndex = properties.indexOf("suggester"),
                        voteIndex = properties.indexOf("vote"),
                        completed_durationIndex = properties.indexOf("completedDuration"),
                        creationTimeIndex = properties.indexOf("creation_time")

                    //Populate search results array with search objects
                    var values = response.data.values;
                    for (var i = 0; i<values.length; i++) {
                        var item = {
                            "code": values[i][codeIndex],
                            "song_code": values[i][song_codeIndex],
                            "position": values[i][positionIndex],
                            "upvotes": values[i][upvotesIndex],
                            "downvotes": values[i][downvotesIndex],
                            "suggester": values[i][suggesterIndex],
                            "vote": values[i][voteIndex],
                            "completed_duration": values[i][completed_durationIndex],
                            "creation_time": values[i][creationTimeIndex],
                            "year": "",
                            "duration": "",
                            "title": "",
                            "artist": "",
                            "albumSource": ""
                        }
                        resultsArray.push(item);
                    }
                    	playlistService.setPlaylist(resultsArray);
                        return response;
                }, function(response) {
                    return $q.reject(response);
                });
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
		vetoPlaythrough: function(partyCode, playthroughCode) {

		},
		getPlaythrough: function(partyCode, playthroughCode) {

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
		getPartySettings: function(partyCode) {

		},
		updatePartySettings: function() {
			var req = {
				 method: 'PUT',
				 url: serverAddress+'/parties/'+partyService.getPartyCode()+'/settings',
				 headers: {
				   'x-user-code': partyService.getUserName()
				 },
				 data: {
					"virtual_dj": optionsService.getVirtualDj(),
	  				"default_genre": optionsService.getDefaultGenre(),
	  				"user_cap": optionsService.getNumParticipants(),
	  				"playthrough_cap": optionsService.getMaxQueueSize(),
	  				"veto_ratio": optionsService.getVetoRatio()
				}
			}
			return $http(req)
                .then(function(response) {
                        return response;
                }, function(response) {
                    return $q.reject(response);
                });
		},
		getSong: function(songCode) {
            var deferred = $q.defer();
			var song = cacheService.isSongCached(songCode);
			if(song) {
                deferred.resolve(song);
                return deferred.promise;
            }
			else
				return $http.get(serverAddress+'/songs/'+songCode, {
                        headers: {'x-user-code': partyService.getUserName()}})
                .then(function(response) {
                        cacheService.addSongCache(response.data);
                    	return response.data;
                }, function(response) {
                    return $q.reject(response);
                });
		},
		searchSongs: function(query) {
			var resultsArray = [];

			return $http.get(serverAddress+'/songs?search='+query, {
                        headers: {'x-user-code': partyService.getUserName()}})
                .then(function(response) {
                	//Find index of each property
                	var properties = response.data.properties,
                		codeIndex = properties.indexOf("code"),
                		yearIndex = properties.indexOf("year"),
                		titleIndex = properties.indexOf("title"),
                		durationIndex = properties.indexOf("duration"),
                		artistIndex = properties.indexOf("artist");

            		
            		//Populate search results array with search objects
            		var values = response.data.values;
                	for (var i = 0; i<values.length; i++) {
                		var item = {
                			"code": values[i][codeIndex],
                			"title": values[i][titleIndex],
                			"artist": values[i][artistIndex],
                			"year": values[i][yearIndex],
                			"duration": values[i][durationIndex]
                		}
                		//console.log(item);
                		resultsArray.push(item);
                	}
                    	return resultsArray;
                }, function(response) {
                    return $q.reject(response);
                });
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





