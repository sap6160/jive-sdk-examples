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
 * EXAMPLE: Demonstates how to kick off service autowiring a directory of tiles.
 */

///////////////////////////////////////////////////////////////////////////////////////////////////
// Setup express

var express = require('express'),
    routes = require('./routes'),
    http = require('http'),
    jive = require('jive-sdk');

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
// Setup jive

var failServer = function(reason) {
    console.log('FATAL -', reason );
    process.exit(-1);
};

var startServer = function () {
    var server = http.createServer(app).listen( app.get('port') || 8090, function () {
        console.log("Express server listening on port " + server.address().port);
    });
};

///////////////////////////////////////////////////////////////////////////////////////////////////
// Setting up your service

//
// Service startup sequence:
//

// 1. initialize service setup -- optionally pass in a JSON configuration object or path to a configuration object;
// if one is not provided, it assumes that [app root]/jiveclientconfiguration.json file exists.
jive.service.init(app)

    // 2. autowire all available definitions in /tiles; see explanation below.
    .then( function() { return jive.service.autowire() } )

    // 3. start the service, which performs sanity checks such as clientId, clientSecret, and clientUrl defined.
    .then( function() { return jive.service.start() } )

    // 4. if successful service start, call the start the http server function defined by you; otherwise call the
    // fail one
    .then( startServer, failServer );

//
// Below is an explanation of what you need in place to make the above sequence successful.
//
// ==========
// AUTOWIRING
// ==========
//
// The .autowire() assumes the following diretory structure exists:
// [app root]/tiles
//              /tile1
//                  /routes (optional)
//                  /services (optional)
//                  definition.json (optional)
//
// ================================
// Regarding the /routes directory:
// ================================
// The system will recursively search for .js files exporting either (1) a function(req, res), or
// (2) a data routes datastructure, and construct a route based on the path in the directory, for the
// associated tile.
//
// If the .js file's name corresponds to one of the http verbs (get.js, put.js, delete.js, post.js),
// and the exported function is called 'route' specifically, a node JS express route will be created
// based on the directory path. For example:
//
//              /tile1
//                  /routes
//                      /prod
//                          /config
//                              get.js
//
// Assuming that get.js contains the following:
//
//              exports.route = function(req, res) { ..  };
//
// The following route will be automatically created:
//              /tile1/prod/config
//
// You may then reference this route in your definition.json:
//      {
//          ..
//              "config": "/tile1/prod/configure",
//          ..
//      }
//
// =================================
// Regarding the services directory:
// =================================
// The system will search for .js files in this directory, and look for event handler and task exports.
//
// (1) Event Handlers
// If you have a file that exports an .eventHandlers array property, the system will call jive.definitions.addEventHandler()
// on each of the object elements.
// For example:
//
// If in /tile1/services/lifecycle.js this existed:
//
//      exports.eventHandlers = [
//          { 'event': 'destroyingInstance',
//            'handler' : function(theInstance){
//                  // override
//              }
//          }
//      ];
//
//  This will add the event listener 'destroyingInstance' to the definition tile1, which will be called
//  whenever an instance of tile1 is destroyed.
//
// (2) Task exports
// If you have a file that exports a .task property, the system will call jive.definitions.addTasks( .. ) on that
// object, which can be either a task object (see jive-sdk/lib/task.js) or a function.
//
// If in /tile1/services/datapusher.js this existed:
//
//      exports.task = function() { .. }
//
//              or
//      exports.task = jive.tasks.build( function() { ..} , 5000 )
//
//  This will schedule a task based on the function in either statement to execute either every 15 seconds
// (default for a plain function), or the interval specified in the task (5 seconds in the provided example).
//
// =========================
// Regarding definition.json:
// =========================
// If a definition.json file is located in a tile directory (for example /tile1/definition.json), the system
// will call either jive.tile.definitions or jive.extstreams.definitions .save(), based on the "style" attribute
// in this json structure. If style is "ACTIVITY", jive.extstreams.definitions.save() will be called; otherwise
// its assumed to be a tile, and jive.tiles.definitions.save() will be called.
//
// When the /tiles or /tilesInstall development endpoints are called, it will return all the tiles and external stream definitions
// defined in your system through the aforementioned .save() command. The tile definitions output via this
// endpoint is in the format expected by the jivelinks API.
//
// (1) If "configure" or "registration" attributes are not specified, the value will be interpreted as
//      [clientUrl]/[tile name]/configure and [clientUrl]/[tile name]/register respectively. Please make sure these endpoints
//      are available either through manual configuration, or route autowiring (see above).
// (2) If "registration" attribute is not specified, the value will be interpreted as
//      http[your service url]/registration (this is the shared, framework provided registration endpoint).
// (3) Any paths containing {{{host}}} will have that value substituted with the value of clientUrl from your
//     configuration file

