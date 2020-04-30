/**
 * Module dependencies.
 */
var express = require('express')
,	path = require('path')
, https = require('https'
, fs = require('fs'));

var options = {
    key: fs.readFileSync('./privatekey.pem'),
    cert: fs.readFileSync('./certificate.pem')
};

var app = express();
//
// all environments
app.set('port', process.env.PORT || 3000);
app.set('view engine', 'ejs');
app.use(express.static(path.join(__dirname, 'public')));

var index = function(req, res) {
    res.render('index', {
      title : "WebRtcServerProject"
    });
};
app.get('/', index);
//
// var server = app.listen(app.get('port'), function(){
//   console.log('Express server listening on port ' + app.get('port'));
// });

var server = https.createServer(options, app).listen(3000, function () {
    console.log('Https server listening on port ' + 3000);
});

var io = require('socket.io').listen(server);

/**
 * Database
 */
var db = require('./app/database.js');
/**
 * Socket.io event handling
 */
require('./app/socketHandler.js')(io, db);
