PartyShark.ClientController = Ember.ObjectController.extend({
    actions: {
    	trackSearch: function() {
    		var searchParam = $('#trackSearch').val();
    		$.get( "/search?q="+searchParam, function(data) {
  				alert(data);
			});
    	}
    }
});