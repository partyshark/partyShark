PartyShark.IndexController = Ember.ObjectController.extend({
	init: function() {
	    var store = this.store;
		$.get( "/clientCode", function( data ) {
  			var code = store.createRecord('codePack', {
  				clientCode: data.clientCode,
  				partyCode: "0000"
			});
			code.save();
  			alert(this.store.find('codePack'));
		});
	},
    actions: {
    	startParty: function() {
    		this.transitionToRoute('options');
    	}
    }
});