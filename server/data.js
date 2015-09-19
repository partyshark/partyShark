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

exports.Party = function(voterCode, adminCode) {
    this.voterCode = voterCode;
    this.adminCode = adminCode;

    this.clients = [];
    this.plays = [];

    this.activePlay;
};
exports.Party.prototype = { 
    getPlay: function(instanceId) {
        for(var i = 0; i < this.songs; i++) {
            if(this.songs[i].instanceId == instanceId) { return this.songs; }
        }
        return null;
    }
};

exports.Play = function() {
    this.artist;
    this.length;
    this.position;
    this.id;
    this.globalId;
    this.musicUrl;
    this.artUrl;
    this.vetoed = false;
    this.feedback = 0;
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