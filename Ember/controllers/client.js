PartyShark.ClientController = Ember.ObjectController.extend({
    actions: {
    	trackSearch: function() {
    		var searchParam = $('#trackSearch').val();
    		$.get( "http://api.deezer.com/search/track?q=eminem", function( data ) {
  				alert(data);
			});
    	}
    }
});