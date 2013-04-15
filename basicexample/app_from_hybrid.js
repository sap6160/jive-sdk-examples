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
 * Demonstates how to mix and match manual service wiring, with framework autowiring.
 * In this usecase we manually define the definition, but rely on autowiring
 * to set up the tile routes.
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

var startServer = function () {
    var server = http.createServer(app).listen( app.get('port') || 8090, function () {
        console.log("Express server listening on port " + server.address().port);
    });
};

var q = require('q');

var definition = {
    "sampleData" : {
        "title" : "Sample tile with no autowired defintion",
        "contents" : [ {
            "text" : "Initial data"
        } ],
        "config" : {
            "listStyle" : "contentList"
        }
    },
    "config": "/samplenodef/configure",
    "register": "/registration",
    "displayName" : "Sample Manual Definition",
    "name" : "samplenodef",
    "description" : "Sample tile with no autowired defintion.",
    "style" : "LIST",
    "icons" : {
        "16" : "http://i.cdn.turner.com/cnn/.e/img/3.0/global/header/hdr-main.gif",
        "48" : "http://i.cdn.turner.com/cnn/.e/img/3.0/global/header/hdr-main.gif",
        "128" : "http://i.cdn.turner.com/cnn/.e/img/3.0/global/header/hdr-main.gif"
    }
};

// save your tile
jive.tiles.definitions.save(definition)
    .then( jive.autowire.one( app, __dirname, __dirname + '/tiles/samplenodef') )
    .then( startServer );

