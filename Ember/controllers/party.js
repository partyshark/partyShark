PartyShark.PartyController = Ember.ObjectController.extend({
    partyCode: function() {
    	if(!this.get('adminCode'))
    		return this.get('voterCode');
    	else
    		return this.get('adminCode');
    }.property('voterCode', 'adminCode')
    
});