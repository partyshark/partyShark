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
		_maxQueueSize = 50;
	return {
		getNumParticipants: function() {
			return _numParticipants;
		},
		getMaxQueueSize: function() {
			return _maxQueueSize;
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

servicesModule.service('netService', function($http, partyService, playlistService) {
	return {
		createParty: function() {
			return $http.post('https://api.partyshark.tk/parties', {
			})
                .then(function(response) {
                    if (typeof response.data === 'object') {
                    	partyService.setParty(response.data);
                        return true;
                    } else {
                        return false;
                    }

                }, function(response) {
                    return false;
                });
		},
		getParty: function(partyCode) {
            return $http.get('https://api.partyshark.tk/parties/'+partyCode)
                .then(function(response) {
                    if (typeof response.data === 'object') {
                    	partyService.setParty(response.data);
                        return true;
                    } else {
                        return false;
                    }

                }, function(response) {
                    return false;
                });
        },
		requestPlayer: function(partyCode, playerTransferCode) {

		},
		handlePlayerRequest: function(status) {

		},
		getPlaylist: function(partyCode) {
			return $http.get('https://api.partyshark.tk/parties/'+partyService.getPartyCode()+'/playlist')
                .then(function(response) {
                    if (typeof response.data === 'object') {
                    	playlistService.setPlaylist(response.data.values);
                        return true;
                    } else {
                        return false;
                    }

                }, function(response) {
                    return false;
                });
		},
		createPlaythrough: function(songId) {
			return $http.post('https://api.partyshark.tk/parties', {
				"song": songId
			})
                .then(function(response) {
                    if (typeof response.data === 'object') {
                        return true;
                    } else {
                        return false;
                    }

                }, function(response) {
                    return false;
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
		updatePartySettings: function(partyCode) {

		},
		sendContact: function(contactObject) {
			return true;
		}	
	}
});





