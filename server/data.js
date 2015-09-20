exports.Model = function() {
    this.parties = [];
    this.clients = [];
};
exports.Model.prototype = {
    getParty: function(code) {
        for(var i = 0; i < this.parties.length; i++) {
            var p = this.parties[i];
            if(p.voterCode == code || p.adminCode == code) { return p; }
        }
        return null;
    },

    isPartyCodeUsed: function(code) { return this.getParty(code) != null; },

    getClient: function(code) {
        for(var i = 0; i < this.clients.length; i++) {
            var c = this.clients[i];
            if(c.code == code) { return c; }
        }
        return null;
    },

    isClientCodeUsed: function(code) { return this.getClient(code) != null; },
};

exports.Play = function(suggestor) {
    this.title;
    this.artist;
    this.duration;
    this.artUrl;

    this.position;
    this.localId;
    this.globalId;
    this.suggestor = suggestor;

    this.vetoed = false;
    this.feedback = 0;
};

exports.Party = function(voterCode, adminCode) {
    this.voterCode = voterCode;
    this.adminCode = adminCode;

    this.clients = [];
    this.plays = [];

    this.activePlay = 0;
    this.paused = false;
};
exports.Party.prototype = { 
    getPlay: function(localId) {
        for(var i = 0; i < this.plays.length; i++) {
            if(this.plays[i].localId == localId) { return this.plays[i]; }
        }
        return null;
    },

    addPlay: function(globalId, suggestor) {
        var p = new exports.Play();
        p.globalId = globalId;
        p.suggestor = suggestor;
        p.localId = this.plays.length;
        p.position = p.localId;
        this.plays.push(p);
        return p;
    },

    getClient: function(clientCode) {
        for(var i = 0; i < this.clients.length; i++) {
            if(this.clients[i].code == clientCode) { return this.clients[i]; }
        }
        return null;
    }
};



exports.Client = function(code) {
    this.code = code;
    this.votes = [];
};

exports.Vote = function(play, client, direction) {
    this.play = play;
    this.client = client;
    this.direction = direction;
};
exports.Vote.prototype = Object.freeze({ 
    Up: 1,
    Down: -1
});