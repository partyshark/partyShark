//Packages
var express = require('express'),
    app = express(),
    constants = require('constants'),
    http = require('http'),
    https = require('https'),
    fs = require('fs');
    helmet = require('helmet'),
    bodyParser = require('body-parser'),
    compression = require('compression');

var ONE_DAY = 86400000,
    ONE_YEAR = 31536000000;

app.all('*', function(req, res, next) {
    console.log(req.params);
    next();
});

app.use(function(req, res, next) {
  if(!req.secure) {
    return res.redirect(['https://', req.get('Host'), req.url].join(''));
  }
  next();
});

app.use(compression());

app.use(express.static(__dirname + '/public'));

app.use(helmet.hsts({
    maxAge: ONE_YEAR,
    includeSubdomains: true,
    force: true
}));

app.use(bodyParser.urlencoded({extended: true}));

app.use(bodyParser.json());

app.get('/', function(req, res) {
  res.redirect('/index.html');
});

var ciphers = [
    "ECDHE-RSA-AES256-SHA384",
    "DHE-RSA-AES256-SHA384",
    "ECDHE-RSA-AES256-SHA256",
    "DHE-RSA-AES256-SHA256",
    "ECDHE-RSA-AES128-SHA256",
    "DHE-RSA-AES128-SHA256",
    "HIGH",
    "!aNULL",
    "!eNULL",
    "!EXPORT",
    "!DES",
    "!RC4",
    "!MD5",
    "!PSK",
    "!SRP",
    "!CAMELLIA"
].join(':');

var options = {
  key: fs.readFileSync('keys/privkey.pem'),
  cert: fs.readFileSync('keys/fullchain.pem'),
  ca: fs.readFileSync('keys/chain.pem'),
  ciphers: ciphers,
  secureOptions: constants.SSL_OP_NO_SSLv3 | constants.SSL_OP_NO_SSLv2 | constants.SSL_OP_CIPHER_SERVER_PREFERENCE,
  honorCipherOrder: true
};

http.createServer(app).listen(80);

https.createServer(options, app).listen(443, function(err) {
  if(err)
    console.log(err);
  var uid = parseInt(process.env.SUDO_UID);
  if (uid) 
    process.setuid(uid);
  console.log('Server\'s UID has changed to ' + process.getuid());
});

