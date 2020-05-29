/**
 * Module dependencies.
 */
var express = require('express')
    , path = require('path')
    , https = require('https')
    , fs = require('fs')
    , cons = require('./app/constraints');

var options = {
    key: fs.readFileSync(cons.privateKeyPath),
    cert: fs.readFileSync(cons.certificatePath)
};

var app = express();

// all environments
app.set('port', process.env.PORT || cons.port);
app.set('view engine', 'ejs');
app.use(express.static(path.join(__dirname, 'public')));

var index = function(req, res) {
    res.render('index', {
        title : "WebRtcServerProject"
    });
};
app.get('/', index);

/**
 * Start server
 */
var server = https.createServer(options, app).listen(cons.port, function () {
    console.log('Https server listening on port ' + cons.port);
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
