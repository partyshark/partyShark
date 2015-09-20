PartyShark.IndexController = Ember.ObjectController.extend({
	init: function() {
	    var store = this.store;
		$.get( "/clientCode", function(data) {
  			var code = store.createRecord('client', {
  				code: data.clientCode
			});
			code.save();
  			alert(this.store.find('client'));
		});
	},
    actions: {
    	startParty: function() {
    		this.transitionToRoute('options');
    	}
    }
});