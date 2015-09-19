var express = require('express');
var path = require('path');
var favicon = require('serve-favicon');
var logger = require('morgan');
var cookieParser = require('cookie-parser');
var bodyParser = require('body-parser');
var data = require('./data.js');

var routes = require('./routes/index');

var app = express();
var model = new data.Model();

// uncomment after placing your favicon in /public
//app.use(favicon(path.join(__dirname, 'public', 'favicon.ico')));
app.use(logger('dev'));
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: false }));
app.use(cookieParser());
app.use('/', express.static(__dirname + '/../Ember')); //Serve static files as '/' from local + '/../Ember'

//Attatch party to req
app.use(function(req, res, next) {
    req.model = model;
    req.party = model.getParty(req.query.partyCode);
    req.client = model.getClient(req.query.clientCode);
    next();
});

app.use('/', routes);

// catch 404 and forward to error handler
app.use(function(req, res, next) {
  var err = new Error('Not Found');
  err.status = 404;
  next(err);
});

// production error handler
// no stacktraces leaked to user
app.use(function(err, req, res, next) {
  res.status(err.status || 500);
  res.send(err.toString());
});


module.exports = app;
