var serverAddress = 'http://nreid26.xyz:3000';

var servicesModule = angular.module('servicesModule',[]);

servicesModule.service('partyService', function(){
    var _partyCode = "",
    	_adminCode = "",
    	_userName = "",
    	_playerName = "",
    	_isPlaying = false;
    return {
    	getUserName: function() {
    		return _userName;
    	},
    	getPartyCode: function() {
    		return _partyCode;
    	},
        getPlayerName: function() {
            return _playerName;
        },
    	setPartyCode: function(partyCode) {
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
			var result = $.grep(myArray, function(e){ return e.code == songCode; });
			if(result.length)
				return result
			return false;
		}
	}
});

servicesModule.service('playlistService', function() {
	var _emptyPlaylist = true;
	var _playlist = [];
	return {
		isEmpty: function() {
			return _emptyPlaylist;
		},
		getPlaylist: function() {
			return _playlist;
		},
		setPlaylist: function(playlist) {
			_playlist = playlist;
		}
	}
});

servicesModule.service('netService', function($http, $q, partyService, playlistService, optionsService, cacheService) {
	return {
		createParty: function() {
			return $http.post(serverAddress+'/parties', {
			})
                .then(function(response, headers) {
                	alert(JSON.stringify(response));
                	alert(response.headers(['x-set-user-code']));
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
                }, function(response) {
                    return $q.reject(response.data);
                });
        },
		requestPlayer: function(partyCode, playerTransferCode) {

		},
		handlePlayerRequest: function(status) {

		},
		getPlaylist: function(partyCode) {
			return $http.get(serverAddress+'/parties/'+partyService.getPartyCode()+'/playlist', {
                        headers: {'x-user-code': partyService.getUserName()}})
                .then(function(response) {
                    	playlistService.setPlaylist(response.data.values);
                        return response;
                }, function(response) {
                    return $q.reject(response);
                });
		},
		createPlaythrough: function(songId) {
			return $http.post(serverAddress+'/parties', {
				"song": songId
			}, {
                        headers: {'X-User-Code': partyService.getUserName()}})
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
		updateCurrentPlaythrough: function(partyCode, playthroughCode) {

		},
		getPartySettings: function(partyCode) {

		},
		updatePartySettings: function() {
			var req = {
				 method: 'PUT',
				 url: serverAddress+'/parties/'+partyService.getPartyCode()+'/settings',
				 headers: {
				   'X-User-Code': partyService.getUserName()
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
			var song = isSongCached(songCode);
			if(song)
				return song;
			else
				return $http.get(serverAddress+'/songs/'+songCode, {
                        headers: {'X-User-Code': partyService.getUserName()}})
                .then(function(response) {
                    	return response;
                }, function(response) {
                    return $q.reject(response);
                });
		},
		searchSongs: function(query) {
			return $http.get(serverAddress+'/songs?'+query, {
                        headers: {'X-User-Code': partyService.getUserName()}})
                .then(function(response) {
                    	return response;
                }, function(response) {
                    return $q.reject(response);
                });
		},
		sendContact: function(contactObject) {
			return true;
		}	
	}
});





