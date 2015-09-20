PartyShark.PartyRoute = Ember.Route.extend({
	model: function() {
		return this.store.find('party', 0);
	}
});