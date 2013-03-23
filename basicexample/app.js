/**
 * Module dependencies.
 */

/*
 read config file emit the "configurationReady" event

 on the configuration event do "initialize"
 initialize, when done, will emit the "initializeComplete" event

 on "initialilzeComplete" start the server

 */

//Setup the base configuration for the app
var express = require('express')
    , fs = require('fs')
    , routes = require('./routes')
    , http = require('http')
    , path = require('path')
    , jive = require('jive-sdk')
    , jiveApi = require('jive-sdk/api')
    , jiveClient = require('jive-sdk/client')
    , tileConfigurator = require('jive-sdk/tileConfigurator')
    ;

var consolidate = require('consolidate');

var app = express();

var readConfiguration = function () {
    //todo: rather than have a separate file, should we simply add these values to package.json?
    fs.readFile(__dirname + '/jiveclientconfiguration.json', 'utf8', function (err, data) {
        if (err) throw err;
        console.log(data);

        //Parse the json file and make an object.
        var jiveClientConfiguration = JSON.parse(data);
        app.emit('event:configurationReady', jiveClientConfiguration);
    });

};

var configureApp = function (data) {

    app.configure(function () {
        app.engine('html', consolidate.mustache);
        app.set('view engine', 'html');
        app.set('views', __dirname + '/public/tiles');
        app.use(express.favicon());
        app.use(express.logger('dev'));
        app.use(express.bodyParser());
        app.use(express.methodOverride());
        app.use(app.router);
        app.use(express.static(path.join(__dirname, 'public')));


        app.set('jiveClientConfiguration', data);
        app.set('port', data.port || 8070);
        app.set('jiveClientPath', __dirname + '/jiveClient');
        app.set('publicDir', __dirname + '/public');
        app.set('rootDir', __dirname);
        app.set('jiveClient', jiveClient);
        app.set('jiveApi', jiveApi);
    });

    app.configure('development', function () {
        app.use(express.errorHandler());
    });

    // configure global routes
    app.get('/', routes.index);
    app.get('/tiles', require('./routes/tiles').tiles);
    app.get('/tilesInstall', require('./routes/tiles').installTiles);
    app.post('/registration', require('./routes/tiles').registration);

    app.emit('event:initialConfigurationComplete', app);
};

var startServer = function () {
    console.log("in startServer");
    http.createServer(app).listen(app.get('port'), function () {
        console.log("Express server listening on port " + app.get('port'));
    });
};

//Setup the event handlers
app.on('event:configurationReady', configureApp);
app.on('event:initialConfigurationComplete', tileConfigurator.configureTiles);
app.on('event:clientConfigurationComplete', startServer);

//Time to get things going...
readConfiguration();
