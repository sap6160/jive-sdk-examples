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

var count = 0;
var task = require("jive-sdk/tile/task");
var tileRegistry = require("jive-sdk/tile/registry");

var thisTask = new task();

exports.task = thisTask;
exports.interval = 5000;

function processTileInstance(instance) {
    console.log('running pusher for ', instance.name, 'instance', instance.id);

    count++;

    var dataToPush = {
        data: {
            "title": "Simple Counter",
            "contents": [
                {
                    "text": "Current count: " + count,
                    "icon": "http://farm4.staticflickr.com/3136/5870956230_2d272d31fd_z.jpg",
                    "linkDescription": "Current counter."
                }
            ],
            "config": {
                "listStyle": "contentList"
            },
            "action": {
                "text": "Add a Todo",
                "context": {
                    "mode": "add"
                }
            }
        }
    };

    tileRegistry.emit("pushDataInstance." + instance.name, instance, dataToPush, function () { } );
}

thisTask.runnable = function(context) {
    var app = context.app;
    var jiveApi = app.settings['jiveApi'];
    var jiveClient = app.settings['jiveClient'];

    jiveApi.TileInstance.findByDefinitionName( 'samplelist' ).execute( function(instances) {
        if ( instances ) {
            instances.forEach( function( instance ) {
                processTileInstance(instance);
            });
        }
    });
};
