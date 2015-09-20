PartyShark.OptionsRoute = Ember.Route.extend({
    model: function() {
      return this.store.find('client', 0);
  }
});