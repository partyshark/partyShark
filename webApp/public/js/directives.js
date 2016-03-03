var directivesModule = angular.module('directivesModule', ['servicesModule']);

directivesModule.directive('fetchPlaylist', ['playlistService', function(playlistService){
	alert("You joined the party from a link");
	
    return {
        
    }
 }]);