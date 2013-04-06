/*
 read config file emit the "configurationReady" event

 on the configuration event do "initialize"
 initialize, when done, will emit the "initializeComplete" event

 on "initialilzeComplete" start the server
*/

///////////////////////////////////////////////////////////////////////////////////////////////////
// Setup module depdendencies

var express = require('express')
    , routes = require('./routes')
    , http = require('http')
    , bootstrap = require('jive-sdk/app/bootstrap')
;

var app = express();
app.use(express.bodyParser());
app.use(express.logger('dev'));
app.use(express.methodOverride());
app.use(app.router);
app.configure('development', function () {
    app.use(express.errorHandler());
});
app.get('/', routes.index);

///////////////////////////////////////////////////////////////////////////////////////////////////
// Setup the event handlers

// start server
app.on('event:clientAppConfigurationComplete', function () {
    http.createServer(app).listen(app.get('port'), function () {
        console.log("Express server listening on port " + app.get('port'));
    });
});

// fail server startup
app.on('event:clientAppConfigurationFailed', function(reason) {
    throw reason ? reason : "Startup aborted.";
} );

///////////////////////////////////////////////////////////////////////////////////////////////////
// Kick off server start sequence
bootstrap.start(app, __dirname);
