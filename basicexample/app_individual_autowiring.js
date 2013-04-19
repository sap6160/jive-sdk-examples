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
 * EXAMPLE: Demonstates how to kick off service autowiring just one or two tile definitions.
 */

///////////////////////////////////////////////////////////////////////////////////////////////////
// Setup express

var express = require('express'),
    http = require('http');

var app = express();

///////////////////////////////////////////////////////////////////////////////////////////////////
// Setup your service

var jive = require('jive-sdk');

var failServer = function(reason) {
    console.log("Error", reason );
    process.exit(-1);
};

var startServer = function () {
    var server = http.createServer(app).listen( app.get('port') || 8090, function () {
        console.log("Express server listening on port " + server.address().port);
    });
};

///////////////////////////////////////////////////////////////////////////////////////////////////
// Kick off service start sequence

// initialize service setup
jive.service.init(app )
    // autowire 2 definitions in /tiles
    .then( function() { return jive.service.autowire( [ 'samplesfdc'] ) } )
    // try to start up service
    .then( function() { return jive.service.start() } )
    // if successful service start, start the http server; otherwise fail
    .then( startServer, failServer);
