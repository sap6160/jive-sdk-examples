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
 * EXAMPLE: Demonstates how to manually configure a tile (no autowiring).
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
var httpPort = 8090;
http.createServer(app).listen(httpPort, function () {
    console.log("Express server listening on port " + httpPort);
} );

///////////////////////////////////////////////////////////////////////////////////////////////////
// Setup your service

// Require the Jive SDK API
var jive = require('jive-sdk');

// Specify service setup parameters
jive.service.options = {
    // the service needs to know what http port node is listening on
    'port' : httpPort,
    // this should be the publically available base URL for your service
    'clientUrl' : 'http://lt-a7-120000',
    // acquire a clientID and secret from Jive Software
    "clientId": "4mkgdszjkbzfjwgwsjnj0r5q1db9n0fh",
    "clientSecret": "rm93mbrpr8an2eajq439625vzg3xqp.MyvfefMHZlEv4E49WH6AC90cw2U.1.s"
};

//
// TILE ROUTE CONFIGURATION
// A purposeful places integration using Tiles requires at minimum 2 publically available endpoints, for
// (1) serving the configuration UI for your tile, visible on the Jive instance, and
// (2) accepting tile instance registrations on your service.

// Setup the tile configuration UI route at [clientUrl]:[port]/configure (eg. http://yoursite:8090/configure):
app.get( '/configure', function( req, res ) {
    res.writeHead(200, { 'Content-Type': 'text/html' });
    res.end( "<script>jive.tile.onOpen(function() { jive.tile.close({'config':'value'});});</script>" );
} );

// Setup the tile registration route at [clientUrl]:[port]/registration (eg. http://yoursite:8090/registration):
app.post( '/registration', jive.routes.registration );

// For development, you may also setup useful dev endpoints to show what tiles are available on your service;
// for installing tiles on a jive instance
app.get( '/tiles', jive.routes.tiles );
app.get( '/tilesInstall', jive.routes.installTiles );

//
// Your tile must also declare metadata about itself, permitting the Jive instance to discover
// what type of type style it is, icons, and also the aforementioned required endpoints (configuration
// and registration).
//
var definition = {
    "sampleData": {"title": "Account Details",
        "contents": [
            {
                "name": "Value",
                "value": "Initial data"
            }
        ]},
    "config": "/configure",
    "register": "/registration",
    "displayName": "Table Example",
    "name": "sampletable",
    "description": "Table example.",
    "style": "TABLE",
    "icons": {
        "16": "http://i.cdn.turner.com/cnn/.e/img/3.0/global/header/hdr-main.gif",
        "48": "http://i.cdn.turner.com/cnn/.e/img/3.0/global/header/hdr-main.gif",
        "128": "http://i.cdn.turner.com/cnn/.e/img/3.0/global/header/hdr-main.gif"
    }
};

// Make this definition known to your service by calling the .save function as demonstrated below:
jive.tiles.definitions.save(definition);

// If your service must periodically push data to a Jive instance, you may schedule a task,
// and use it to periodically scan any registered tile instances, and push data into them.
jive.tasks.schedule( function() {
    jive.tiles.findByDefinitionName( definition['name'] ).then( function(instances) {
        instances.forEach( function( instance ) {
            var dataToPush = {
                "data":
                {
                    "title": "Account Details",
                    "contents": [
                        {
                            "name": "Value",
                            "value": "Updated " + new Date().getTime()
                        }
                    ]
                }
            };

            jive.tiles.pushData( instance, dataToPush );
        } );
    });
});


// If your service needs special handling for events such as data push back into Jive, you
// may register callbacks for specific definitions.
jive.tiles.definitions.addEventHandler( definition['name'], 'dataPushed', function(instance) {
    console.log( instance, "pushed data");
} );