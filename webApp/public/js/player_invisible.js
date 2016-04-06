$(document).ready(function(){
	$("#controlers button").attr('disabled', true);
	$("#slider_seek").click(function(evt,arg){
		var left = evt.offsetX;
		console.log(evt.offsetX, $(this).width(), evt.offsetX/$(this).width());
		DZ.player.seek((evt.offsetX/$(this).width()) * 100);
	});
});

function onPlayerLoaded() {
	$("#controls button").attr('disabled', false);
	DZ.Event.subscribe('current_track', function(arg){
		/* You can subscribe to events I'm assuming??
		This does something when the current_track changes */
	});
	DZ.Event.subscribe('player_position', function(arg){
		// Doing stuff with the player positions subscription
		// Currently updates slider
		$("#slider_seek").find('.bar').css('width', (100*arg[0]/arg[1]) + '%');
	});
}
DZ.init({
	/* Need to change to reflect our needs I'm guessing */
	appId  : '8',
	channelUrl : 'http://developers.deezer.com/examples/channel.php',
	player : {
		onload : onPlayerLoaded
	}
});