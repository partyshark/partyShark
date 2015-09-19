PartyShark.IndexController = Ember.ObjectController.extend({
	init: function() {
		$.get( '/clientCode', function( data ) {
  			alert(data);
		});
	},
    actions: {
    	startParty: function() {
    		this.transitionToRoute('options');
    	}
    }
});