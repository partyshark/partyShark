PartyShark.IndexController = Ember.ObjectController.extend({
	init: function() {
		$.get( "/clientCode", function( data ) {
  			//Need to save the client code
  			data.save();
  			alert(this.store.find('clientCode'));
		});
	},
    actions: {
    	startParty: function() {
    		this.transitionToRoute('options');
    	}
    }
});