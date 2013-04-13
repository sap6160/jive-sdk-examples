/*
 * Copyright 2013 Jive Software
 *
 *    Licensed under the Apache License, Version 2.0 (the "License");
 *    you may not use this file except in compliance with the License.
 *    You may obtain a copy of the License at
 *
 *       http://www.apache.org/licenses/LICENSE-2.0
 *
 *    Unless required by applicable law or agreed to in writing, software
 *    distributed under the License is distributed on an "AS IS" BASIS,
 *    WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 *    See the License for the specific language governing permissions and
 *    limitations under the License.
 */

/**
 * Demonstates how to kick off service autowiring just one tile directory.
 */

///////////////////////////////////////////////////////////////////////////////////////////////////
// Setup express

var express = require('express'),
    routes = require('./routes'),
    http = require('http');

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
// Setup your service

var jive = require('jive-sdk');

jive.config.save( {
    'port' : 8090,
    'baseUrl' : 'http://lt-a7-120000',
    'clientId' : '766t8osmgixp87ypdbbvmu637k98fzvc'
} );

// setup a useful endpoint to show what tiles are available on your service
app.get( '/tiles', jive.routes.tiles );
app.get( '/tilesInstall', jive.routes.installTiles );

jive.autowire.one( app, __dirname + '/tiles/samplelist', function() {
    http.createServer(app).listen(8090, function () {
        console.log("Express server listening on port 8090");
    } );
});