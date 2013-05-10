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

var jive = require("jive-sdk");
var url = require('url');
var sampleOauth = require('../oauth/sampleOauth');

exports.route = function(req, res){
    var conf = jive.service.options;
    var url_parts = url.parse(req.url, true);
    var queryPart = url_parts.query;

    var query = queryPart["query"];
    var ticketID = queryPart["ticketID"];

    var tokenStore = sampleOauth.getTokenStore();

    tokenStore.find('tokens', {'ticket': ticketID }).then( function(found) {
        if ( found ) {
            var accessToken = found[0]['accessToken']['access_token'];
            var host = found[0]['accessToken']['instance_url'];
            var uri = "/services/data/v20.0/sobjects/Opportunity/006i0000002uBbAAAU";

            var headers = {
                'Authorization': 'Bearer ' + accessToken
            };

            jive.util.buildRequest(
                    host + uri,
                    'GET',
                    null,
                    headers
                ).then(
                // success
                function(response) {
                    var body = response['entity'];

                    res.writeHead(200, { 'Content-Type': 'application/json' });
                    res.end(JSON.stringify(body, null, 2) );
                },

                // fail
                function(response) {
                    res.writeHead(response.statusCode, { 'Content-Type': 'application/json' });
                    res.end(JSON.stringify(response['entity']));
                }
            );
        }
    });

};