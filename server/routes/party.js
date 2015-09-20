var express = require('express');
var router = express.Router();
var data = require('../data.js');
var gen = require('../generate.js');
var request = require('request');

router.post('/join', function(req, res, next) {
    req.party.clients.push(req.clients);

    var ret = JSON.parse(JSON.stringify(preq.party));
    if(ret.adminCode != req.params.partyCode) { ret.adminCode = null; }
    res.status(200).json(ret);
});

router.get('/playlist', function(req, res, next) {
    res.status(200).json({
        activePlay: req.party.activePlay,
        plays: req.party.plays
    });
});

router.post('/vote', function(req, res, next) {
    var direction = req.query.direction;
    if(direction != data.Vote.Up || direction != data.Vote.Down) {
        res.status(400).send('Unrecognised vote value');
        return;
    }

    var play = req.party.plays.getPlay(req.query.play)
    if(!play) {
        res.status(400).send('Unrecognised play');
        return;
    }

    if(!req.client.getVote(play)) {
        play.feedback += direction;
        req.client.votes.push(new data.Vote(play, req.client, direction));
    }

    res.status(200).json({feedback: play.feedback, direction: direction});
    return;
});

router.post('/suggest', function(req, res, next) {
    var suggestionId = req.query.suggestion;
    for(var i = req.party.activePlay; i < req.party.plays; i++) {
        var p = req.party.plays[i];
        if(p.globalId == suggestionId) { 
            res.status(200).json({accepted: false, cause: 'This song is waiting in the queue'});
            return;
        }
    }

    request('http://api.deezer.com/search/track/' + req.query.q, function(error, response, body) {
        if(error) {
            res.status(200).json({accepted: false, cause: 'Deezer is unavailable'}); 
            return;
        }
        else if(body.error) {
            res.status(200).json({accepted: false, cause: 'Track does not exist'}); 
            return;
        }
        
        var p = req.party.addPlay(suggestionId, req.client);
        p.title = body.title;
        p.artist = body.artist.name;
        p.duration = body.duration;
        p.artUrl = body.album.cover_big;

        res.status(200).json({accepted: true});
    });
});

router.post('/pause', function(req, res) {
    if(req.party.adminCode == req.params.partyCode) {
        req.party.pause = (req.query.value == true);
        res.status(200).end();
    }
    else {
        res.status(404).end();
    }
});

router.post('/veto', function(req, res) {
    if(req.party.adminCode == req.params.partyCode) {
        var play = req.party.plays.getPlay(req.query.play)
        if(!play) {
            res.status(400).send('Unrecognised play');
            return;
        }

        req.party.vetoed = (req.query.value == true);
        res.status(200).end();
    }
    else {
        res.status(404).end();
    }
});

router.post('/options', function(req, res) {
    req.party.options = req.body;
    res.status(200).json(req.party);
    return;
});


module.exports = router;