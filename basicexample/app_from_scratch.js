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

var tileRoutes = require("jive-sdk/routes/tiles");
var jive = require('jive-sdk');

var configuration = {
    'port' : 8090,
    'baseUrl' : 'http://lt-a7-120000',
    'clientId' : '766t8osmgixp87ypdbbvmu637k98fzvc',
    'persistence' : new jive.persistence.file()
};

jive.config.save( configuration );

// configuration UI route
app.get( '/configure', function( req, res ) {
    res.writeHead(200, { 'Content-Type': 'text/html' });
    res.end( "<script>jive.tile.onOpen(function() { jive.tile.close({'config':'value'});});</script>" );
} );

// registration route -- defer to built in one
app.post( '/registration', tileRoutes.registration );

// setup a useful endpoint to show what tiles are available on your service
app.get( '/tiles', tileRoutes.tiles );
app.get( '/tilesInstall', tileRoutes.installTiles );

// configure your tile
jive.tiles.definitions.configure(
    {
        "sampleData": {"title": "Account Details",
            "contents": [
                {
                    "name": "Name",
                    "value": "Edge Communications",
                    "url": ""
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
            "48": "http://i.cdn.turner.com/cnn/.e/img/3.0/global/header/hdr-main.gif"
        }
    },
    // event listeners
    [
        {
            'event':'pushedUpdateInstance',
            'handler' : function(instance) { console.log( instance, "pushed data"); }
        }
    ]
);

// simple data pusher task
jive.tasks.schedule( function() {
    jive.tiles.findByDefinitionName('sampletable').execute( function(instances) {
        instances.forEach( function( instance ) {
            var dataToPush = {
                "data":
                {
                    "title": "Account Details",
                    "contents": [
                        {
                            "name": "Name",
                            "value": "Edge Communications " + new Date().getTime()
                        },
                        {
                            "name": "Name2",
                            "value": "Edge Communications2 " + new Date().getTime()
                        }
                    ]
                }
            };

            jive.tiles.pushData( instance, dataToPush );
        } );
    });
});

