PartyShark.OptionsController = Ember.ObjectController.extend({
	running: false,
	
    actions: {
    	submit: function() {
    		if(this.get('running')) { return; }
    		this.set('running', true);
    		
    		var code = this.get('code');
    		var store = this.store;
    		var client = this.get('model');
    		var controller = this;
    		var message = {
    			numParticipants: $('#numParticipants').val(),
    			maxQueue: $('#maxQueue').val()
    		};
    		
    		$.ajax({
  				type: 'POST',
  				url: '/create?client='+code,
  				data: message,
  				success: function(data) {
  					var party = store.createRecord('party', {
  						id: 0,
  			    		voterCode: data.voterCode,
  			    		adminCode: data.adminCode,
  			    		client: client
					});
					
					party.save();
					client.set('party', party);
					client.save();
					
					controller.set('running', false);
					controller.transitionToRoute('/party/'+data.adminCode+'/search');
  				},
  				dataType: 'json'
			});
    	}
    }
});