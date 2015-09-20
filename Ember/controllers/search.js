PartyShark.PartySearchController = Ember.ObjectController.extend({	
	needs: ['party'],
		
	results: [],
	
    actions: {
    	trackSearch: function() {
    		var searchParam = $('#trackSearch').val();
    		var controller = this;
    		
    		$.ajax({
  				type: 'GET',
  				url: '/search?q='+searchParam,
  				success: function(data) {
  					controller.set('results', data.data);
				},
  				dataType: 'json'
			});
    	},
    	
    	suggestTrack: function(track) {
    		var searchParam = $('#trackSearch').val();
    		var controller = this;
    		var party = this.get('controllers.party');
    		var partyCode = party.get('partyCode');
    		var clientCode = party.get('client.code');
    		
    		$.ajax({
  				type: 'POST',
  				url: 'party/'+partyCode+'/suggest'
  					  +'?client='+clientCode+'&suggestion='+track.id,
  				success: function(data) {
  					if(!data.accepted) { alert(data.cause); }
  					controller.transitionToRoute('/party/'+partyCode+'/playlist');
				},
  				dataType: 'json'
			});
    	}
    }
});