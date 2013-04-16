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
 * Demonstates how to manually configure a tile (no autowiring).
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

http.createServer(app).listen(8090, function () {
    console.log("Express server listening on port 8090");
} );

///////////////////////////////////////////////////////////////////////////////////////////////////
// Setup your service

var jive = require('jive-sdk');

jive.service.options = {
    'port' : 8090,
    'clientUrl' : 'http://lt-a7-120000',
    "clientId": "4mkgdszjkbzfjwgwsjnj0r5q1db9n0fh",
    "clientSecret": "rm93mbrpr8an2eajq439625vzg3xqp.MyvfefMHZlEv4E49WH6AC90cw2U.1.s"
};

// configuration UI route
app.get( '/configure', function( req, res ) {
    res.writeHead(200, { 'Content-Type': 'text/html' });
    res.end( "<script>jive.tile.onOpen(function() { jive.tile.close({'config':'value'});});</script>" );
} );

// registration route -- defer to built in one
app.post( '/registration', jive.routes.registration );

// setup useful dev endpoints to show what tiles are available on your service; for installing tiles on a jive instance
app.get( '/tiles', jive.routes.tiles );
app.get( '/tilesInstall', jive.routes.installTiles );

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

var pushedDataEventHandler = function(instance) {
    console.log( instance, "pushed data");
};

// save your tile
jive.tiles.definitions.save(definition);

// add event handlers
jive.tiles.definitions.addEventHandler( definition['name'], 'dataPushed', pushedDataEventHandler );

// schedule a simple data pusher task
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