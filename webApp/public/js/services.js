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
        isPlaying: function() {
            return _isPlaying;
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
		_defaultGenre = 4,
		_vetoRatio = 0.5;

    var genreLabels = Object.freeze(['Classic Rock', '', '', 'Country', 'Top Hits']);

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
        setVirtualDJ: function(status) {
            _virtualDj = status;
            return _virtualDj;
        },
        setGenre: function(genre) {
            _defaultGenre = genre;
        },
        getGenreLabel: function() {
            if(_defaultGenre ==  null || _defaultGenre < 0 || _defaultGenre >= genreLabels.length) { return 'None'; }
            else { return genreLabels[_defaultGenre]; }
        }
	}
});

servicesModule.service('cacheService', function() {
    var _cache = { };
    return {
        isSongCached: function(songCode) {
           return _cache[songCode];
        },
       addSongCache: function(song) {
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

servicesModule.service('netService', function($http, $q, partyService, cacheService, playlistService, optionsService, cacheService) {
    function unpackDataset(dataset) {
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

	return {
		createParty: function() {
			return $http.post(serverAddress+'/parties', {})
                .then(function(response, headers) {
                    partyService.setParty(response.data);
                    partyService.setUserName(response.headers(['x-set-user-code']));
                    return response;
                });
		},
		getParty: function(partyCode) {
            return $http.get(serverAddress+'/parties/'+partyCode, {headers: {'x-user-code': partyService.getUserName()}})
                .then(function(res) { return res.data; })
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
            return $http(req).then(function(response) { return response.data; });
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
		updateCurrentPlaythrough: function(partyCode, playthroughCode, vote, ratio) {
            var data;
            if (vote == -1) {
                data = {
                    "completed_ratio": ratio,
                } 
            }
            else {
               data = {
                    "completed_ratio": ratio,
                    "vote": vote
                } 
            }
            var req = {
                 method: 'PUT',
                 url: serverAddress+'/parties/'+partyService.getPartyCode()+'/playlist/'+playthroughCode,
                 headers: {
                   'x-user-code': partyService.getUserName()
                 },
                 data: data
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
                    optionsService.setGenre(response.data.default_genre);
                    optionsService.setNumParticipants(response.data.user_cap);
                    optionsService.setMaxQueueSize(response.data.playthrough_cap);
                    optionsService.setVirtualDJ(response.data.virtual_dj);
                    return response;
                }, function(response) {
                    return $q.reject(response.data);
                });
		},
		updatePartySettings: function(genre, participants, queue, virtualDJ) {
			var req = {
				 method: 'PUT',
				 url: serverAddress+'/parties/'+partyService.getPartyCode()+'/settings',
				 headers: {
				   'x-user-code': partyService.getUserName()
				 },
				 data: {
					"virtual_dj": virtualDJ,
	  				"default_genre": genre,
	  				"user_cap": participants,
	  				"playthrough_cap": queue,
	  				"veto_ratio": optionsService.getVetoRatio()
				}
			}
            console.log('update'+JSON.stringify(req.data))
			return $http(req)
                .then(function(response) {
                    optionsService.setGenre(response.data.default_genre);
                    optionsService.setNumParticipants(response.data.user_cap);
                    optionsService.setMaxQueueSize(response.data.playthrough_cap);
                    return response;
                }, function(response) {
                    return $q.reject(response);
                });
		},
		getSong: function(songCode) {
           var song = cacheService.isSongCached(songCode);

           function toDataUrl(url, outputFormat){
               var deferrer = $q.defer();
               var img = new Image();
               img.crossOrigin = 'Anonymous';
               img.onload = function(){
                   var canvas = document.createElement('CANVAS');
                   var ctx = canvas.getContext('2d');
                   var dataURL;
                   canvas.height = this.height;
                   canvas.width = this.width;
                   ctx.drawImage(this, 0, 0);
                   dataURL = canvas.toDataURL(outputFormat);
                   deferrer.resolve(dataURL);
                   canvas = null;
               };
               img.src = url;
               return deferrer.promise;
           }

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
                      'year': result.release_date.split('-')[0]
                   };

                   return toDataUrl(result.album.cover, 'image/jpeg').then(
                       function(dataUrl) {
                           song.art = dataUrl;
                           cacheService.addSongCache(song);
                           return song;
                       }
                   );
               },
               function(response) {
                   return $q.reject(response);
               })
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
            console.log(partyService.getPartyCode());
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

    var nowPlayingCode = 1, radioIsQueued = false;
    var stations = Object.freeze([37765, 30901, 31031, 36801, 31061, 30661, 37091, 30851]);
    var trackEnd = createPublisher(), playerPosition = createPublisher(), trackChanged = createPublisher();

    function createPublisher() {
        var subs = [ ];

        return {
            subscribe: function(callback) {
                subs.push(callback);

                return {
                    cancel: function() {
                        subs.splice(subs.indexOf(callback), 1);
                    }
                };
            },
            publish: function(arg) {
                for(var i = 0; i < subs.length; i++) { subs[i](arg); }
            }
        };
    }

    function getRadioStation() {
        var genre = optionsService.getDefaultGenre();
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

        nowPlayingCode: function() { return nowPlayingCode; },

        radioIsQueued: function() { return radioIsQueued; }
    };

    trackChanged.subscribe(function(song) { nowPlayingCode = song.id; })

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





