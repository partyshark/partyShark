PartyShark.Song = DS.Model.extend({
    title: DS.attr(),
    artist: DS.attr(),
    duration: DS.attr('number', {defaultValue: 0.0}),
    albumArt: DS.attr('string', {defaultValue: 'images/noArt.png'}),
    position: DS.attr('number', {defaultValue: 0.0}),
    feedback: DS.attr('number', {defaultValue: 0.0}),
    hasVoted: DS.attr('boolean', {defaultValue: false})  
});