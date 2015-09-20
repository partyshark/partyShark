PartyShark.Client = DS.Model.extend({
   code: DS.attr(),
   votes: DS.hasMany('vote'),
   party: DS.belongsTo('party')
});

PartyShark.Play = DS.Model.extend({
   title: DS.attr(),
   artist: DS.attr(),
   duration: DS.attr(),
   artUrl: DS.attr(),
   postion: DS.attr(),
   localId: DS.attr(),
   globalId: DS.attr(),
   suggestor: DS.attr(),
   vetoed: DS.attr('boolean'),
   feedback: DS.attr('number'),
   hasPlayed: DS.attr('boolean'),
   party: DS.belongsTo('party')
});

PartyShark.Party = DS.Model.extend({
   voterCode: DS.attr(),
   adminCode: DS.attr(),
   plays: DS.hasMany('play'),
   activePlay: DS.attr(),
   paused: DS.attr('boolean'),
   client: DS.belongsTo('client')
});

PartyShark.Vote = DS.Model.extend({
   client: DS.belongsTo('client'),
   play: DS.belongsTo('play'),
   value: DS.attr()
});

PartyShark.Client.reopenClass({ FIXTURES: [] });
PartyShark.Play.reopenClass({ FIXTURES: [] });
PartyShark.Party.reopenClass({ FIXTURES: [] });
PartyShark.Vote.reopenClass({ FIXTURES: [] });