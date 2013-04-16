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
jive.service.init(app,
    // manually supply service startup parameters
    {
        'port'          : 8090,
        'clientUrl'     : 'http://lt-a7-120000',
        'clientId'      : '4mkgdszjkbzfjwgwsjnj0r5q1db9n0fh',
        'clientSecret'  : 'rm93mbrpr8an2eajq439625vzg3xqp.MyvfefMHZlEv4E49WH6AC90cw2U.1.s'
    },
    // autowire 3 definitions
    [ 'samplelist', 'samplegauge', 'sampleactivity' ] )
    .then( function() { return jive.service.start() } )
    // if successful service start, start the http server; otherwise fail
    .then( startServer, failServer);
