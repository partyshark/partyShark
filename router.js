PartyShark.Router.map(function() {
    this.resource('party', {path: '/:party_id'}, function() {
    	this.route('options');
    	this.route('playlist');
    	this.route('search');
    });
});
