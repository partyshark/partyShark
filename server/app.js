var express = require('express');
var path = require('path');
var favicon = require('serve-favicon');
var logger = require('morgan');
var cookieParser = require('cookie-parser');
var bodyParser = require('body-parser');
var data = require('./data.js');

var app = express();
var model = new data.Model();

// uncomment after placing your favicon in /public
//app.use(favicon(path.join(__dirname, 'public', 'favicon.ico')));
app.use(logger('dev'));
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: false }));
app.use(cookieParser());
app.use('/', express.static(__dirname + '/../Ember')); //Serve static files as '/' from local + '/../Ember'


//Routing
app.use('/', function(req, res, next) {
    req.model = model;
    next();
});
app.use('/', require('./routes/index.js'));

app.use('/party/:partyCode', function(req, res, next) {
    req.model = model;
    req.party = model.getParty(req.params.partyCode);
    req.client = model.getClient(req.query.clientCode);

    if(!req.party) { res.status(400).send('Party does not exist'); }
    else if(!req.client) { res.status(400).send('Client does not exist'); }
    else { next(); }
});
app.use('/party/:partyCode', require('./routes/party.js'));

app.use(function(req, res, next) {
    res.status(404).send('Route not found');
});


module.exports = app;
