PartyShark.IndexController = Ember.ObjectController.extend({
	init: function() {
		$.get( "/clientCode", function( data ) {
  			//Need to save the client code
		});
	},
    actions: {
    	startParty: function() {
    		this.transitionToRoute('options');
    	}
    }
});