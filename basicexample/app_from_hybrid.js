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
 * EXAMPLE: Demonstates how to mix and match manual service wiring, with framework autowiring.
 */

///////////////////////////////////////////////////////////////////////////////////////////////////
// Setup express

var express = require('express'),
    routes = require('./routes'),
    http = require('http');

var app = express();

///////////////////////////////////////////////////////////////////////////////////////////////////
// Setup your service

var q = require('q');
var jive = require('jive-sdk');

var startServer = function () {
    // start a task immediately after server startup
    var start = new Date().getTime();

    jive.tiles.definitions.addTasks( new jive.tasks.build( function() {
        console.log( ( (new Date().getTime() - start ) / 1000 ) + " seconds since start...");
    }, 5000));

    var server = http.createServer(app).listen( app.get('port') || 8090, function () {
        console.log("Express server listening on port " + server.address().port);
    });
};


var definition = {
    "sampleData" : {
        "title" : "Manually wired defintion",
        "contents" : [ {
            "text" : "Initial data"
        } ],
        "config" : {
            "listStyle" : "contentList"
        }
    },
    "config": "/sampleroutesonly/configure",
    "register": "/registration",
    "displayName" : "Manually wired defintion",
    "name" : "sampleroutesonly",
    "description" : "Manually wired defintion",
    "style" : "LIST",
    "icons" : {
        "16" : "http://i.cdn.turner.com/cnn/.e/img/3.0/global/header/hdr-main.gif",
        "48" : "http://i.cdn.turner.com/cnn/.e/img/3.0/global/header/hdr-main.gif",
        "128" : "http://i.cdn.turner.com/cnn/.e/img/3.0/global/header/hdr-main.gif"
    }
};

var definitionName = definition['name'];

// save your tile
jive.tiles.definitions.save(definition)
    // initialize the service with startup parameters from default [app dir]/jiveclientconfiguration.json
    .then( function() { return jive.service.init(app); } )
    // autowire shared services to the definition
    .then( function() { return jive.service.autowireDefinitionServices( definitionName, 'services' ); } )
    // autowire shared routes to the definition
    .then( function() { return jive.service.autowireDefinitionRoutes( definitionName, 'routes' ); } )
    // start the service
    .then( function() { return jive.service.start(); } )
    // on success, start the http server; exit on fail
    .then( startServer, function(e) {
        console.log("Failed to start!", e );
        process.exit();
    });

