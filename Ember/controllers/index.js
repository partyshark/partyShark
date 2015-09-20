PartyShark.IndexController = Ember.ObjectController.extend({
	init: function() {
	    var store = this.store;
		$.get( "/clientCode", function(data) {
  			var code = store.createRecord('client', {
  			    id: 0,
  				code: data.clientCode
			});
			code.save();
		});
	},
    actions: {
    	startParty: function() {
    		this.transitionToRoute('options');
    	}
    }
});