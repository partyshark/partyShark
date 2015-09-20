PartyShark.OptionsController = Ember.ObjectController.extend({
    actions: {
    	submit: function() {
    		var code = this.get('model').get('code');
    		var options = {
    			numParticipants: $('#numParticipants').val(),
    			maxQueue: $('#maxQueue').val()
    		}
    		$.ajax({
  				type: 'POST',
  				url: '/create?client='+code,
  				data: options,
  				success: function(data) {
  					alert(data);
  				},
  				dataType: 'json'
});
    		this.transitionToRoute('/party/AAAA/search');
    	}
    }
});