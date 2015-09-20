PartyShark.Router.map(function() {
	this.resource('party',{path: '/party/:id'}, function(){
		this.route('search');
		this.route('playlist');
    })
    this.route('options');
    this.route('client');
});
