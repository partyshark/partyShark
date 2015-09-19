PartyShark.ClientController = Ember.ObjectController.extend({
    actions: {
    	trackSearch: function() {
    	debugger;
    		var searchParam = $('#trackSearch').val();
    		alert(searchParam);
    		$.get( "/search?q="+searchParam, function(data) {
  				alert(data);
			});
    	}
    }
});