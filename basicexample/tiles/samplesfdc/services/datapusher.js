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
var task = require("jive-sdk/task");

var thisTask = new task();

exports.task = thisTask;
exports.interval = 5000;

function processTileInstance(instance) {
    console.log('running pusher for ', instance.name, 'instance', instance.id);
    // todo
}

thisTask.runnable = function(context) {
    var app = context.app;
    var jiveApi = app.settings['jiveApi'];
    var jiveClient = app.settings['jiveClient'];

    jiveApi.TileInstance.findByDefinitionName( 'samplesfdc' ).execute( function(instances) {
        if ( instances ) {
            instances.forEach( function( instance ) {
                processTileInstance(instance);
            });
        }
    });
};
