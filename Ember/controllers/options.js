PartyShark.OptionsController = Ember.ObjectController.extend({
    actions: {
    	submit: function() {
    		var options = {
    			numParticipants: $('#numParticipants').val(),
    			maxQueue: $('#maxQueue').val()
    		}
    		$.ajax({
  				type: 'POST',
  				url: 'http://nreid26.xyz/create',
  				data: options,
  				success: function(data) {
  					alert(data);
  				},
  				dataType: 'json'
});
    		this.transitionToRoute('client');
    	}
    }
});