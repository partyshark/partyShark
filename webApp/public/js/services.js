var servicesModule = angular.module('servicesModule',[]);

servicesModule.service('partyService',['optionsService', function(){
    var _partyCode = "87654321";
    return {
    	getPartyCode: function() {
    		if(_partyCode == "") {
    			//fetch code from server, injected with options
    		}
    		else
    			return _partyCode;
    	},
    	setPartyCode: function(code) {
    		_partyCode = code;
    		return _partyCode;
    	}
    }
}]);

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
	return {
		isEmpty: function() {
			return _emptyPlaylist;
		},
		toggleEmpty: function() {
			_emptyPlaylist = !_emptyPlaylist;
			return _emptyPlaylist;
		}
	}
});

servicesModule.service('searchResultsService', function() {
	var _searchResults = [];
	return {
		setResults: function(results) {
			_searchResults = results;
		},
		getResults: function() {
			return _searchResults;
		}
	}
});