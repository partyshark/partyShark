var directivesModule = angular.module('directivesModule', ['servicesModule']);

directivesModule.directive('fetchPlaylist', ['playlistService', function(playlistService){
	alert("You joined the party from a link");
	
    return {
        
    }
 }]);

directivesModule.directive('initNotifications', function() {
	//Initialize Notifications
	$.notify.defaults({
	  // whether to hide the notification on click
	  clickToHide: true,
	  // whether to auto-hide the notification
	  autoHide: true,
	  // if autoHide, hide after milliseconds
	  autoHideDelay: 5000,
	  // show the arrow pointing at the element
	  arrowShow: true,
	  // arrow size in pixels
	  arrowSize: 5,
	  // position defines the notification position though uses the defaults below
	  position: '...',
	  // default positions
	  elementPosition: 'top center',
	  globalPosition: 'top center',
	  // default style
	  style: 'bootstrap',
	  // default class (string or [string])
	  className: 'error',
	  // show animation
	  showAnimation: 'slideDown',
	  // show animation duration
	  showDuration: 400,
	  // hide animation
	  hideAnimation: 'slideUp',
	  // hide animation duration
	  hideDuration: 200,
	  // padding between element and notification
	  gap: 5
	});
	return {

	}
});