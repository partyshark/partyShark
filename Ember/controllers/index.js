PartyShark.IndexController = Ember.ObjectController.extend({
	init: function() {
		$.get( "http://nreid26.xyz/clientCode", function( data ) {
  			alert(data);
		});
	},
    actions: {
    	startParty: function() {
    		this.transitionToRoute('options');
    	}
    }
});