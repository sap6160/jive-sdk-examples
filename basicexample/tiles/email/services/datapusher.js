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

var POP3Client = require('poplib');
var MultipartParser = require('multipart-parser');
var http = require('http');
var util = require('util');
var jive = require("jive-sdk");

var doPush = function( jiveApi, clientId, instance, userName, userEmail, subject, body, retried ) {
    body = body.substring( 0, Math.min(400, body.length ) );

    var dataToPush = {
        "activity":
        {
            "action":{
                "name":"posted",
                "description":"Activity"
            },
            "actor":{
                "name":userName,
                "email":userEmail
            },
            "object":{
                "type":"website",
                "url":"http://www.google.com",
                "image":"http://www.emailmeform.com/builder/images/mail-pic.png",
                "title": 'From ' + userName + ' (' + userEmail  + '): ' + subject,
                "description":body
            },
            "externalID": '' + new Date().getTime()
        }
    };

    // todo -- make this event driven
    jiveApi.extstreams.pushActivity( clientId, instance, dataToPush);
};

exports.task = new jive.tasks.build(

    // runnable
    function(context) {
    var app = context.app;
    var settings = jive.config.fetch();
    var debug = false;


    jive.extstreams.findByDefinitionName( 'email' ).execute( function(instances) {
        if ( instances ) {

            instances.forEach( function( instance ) {
                var config = instance['config'];
                if ( config && config['configured'] !== 'true' ) {
                    return;
                }

                var totalmsgcount = 0, currentmsg = 0;

                var username = config['username'], password = config['password'], host = config['pop3host'],
                    port = config['pop3port'];

                console.log('Running pusher for ', instance.name, 'instance', instance.id );

                var client = new POP3Client(port, host, {
                    tlserrs: false,
                    enabletls: config['pop3tls'] === "true",
                    debug: debug
                });

                client.on("error", function(err) {
                    console.log("Unable to connect to server, failed");
                    console.log(err);
                });

                client.on("connect", function() {
                    client.login(username, password);
                });

                client.on("login", function() {
                    client.list();
                });

                client.on("retr", function(status, msgnumber, data, rawdata) {

                    if (status === true) {

                        if ( debug ) console.log("RETR success " + msgnumber);
                        currentmsg += 1;

                        client.dele(msgnumber);

                        var match = /boundary="(.+)"/.exec(data);
                        if ( !match ) {
                            match = /boundary=(.+)/.exec(data);
                        }
                        if ( match ) {
                            var boundary = match[1];

                            match = /From:\s(.+)\s\<(.+)\>/.exec(data);
                            var fromUser = match[1];
                            var fromEmail = match[2];

                            match = /Subject:\s(.+)/.exec(data);
                            var subject = '';
                            if ( match ) {
                                subject = match[1];
                            }

                            var parser = new MultipartParser();
                            parser.boundary(boundary);

                            var partHandler = function(part) {
                                part.data = '';
                                part.on('data', function (chunk) {
                                    part.data += chunk;
                                }).on('end', function () {
                                    part.ended = true;
                                    doPush(jive, settings['clientId'], instance,
                                        fromUser, fromEmail, subject, part.data );
                                });
                            };

                            parser.on('part', partHandler )
                                .on('end', function() {
                                    console.log("end");
                                }).on('error', function() {
                                    console.log("end");
                                });

                            parser.write(new Buffer(data));
                        }
                    } else {
                        if ( debug ) console.log("RETR failed for msgnumber " + msgnumber);
                        client.rset();
                    }
                });

                client.on("dele", function(status, msgnumber, data, rawdata) {
                    if (status === true) {
                        if ( debug ) console.log("DELE success for msgnumber " + msgnumber);
                        if (currentmsg > totalmsgcount)
                            client.quit();
                        else
                            client.retr(currentmsg);
                    } else {
                        if ( debug ) console.log("DELE failed for msgnumber " + msgnumber);
                        client.rset();
                    }
                });

                client.on("rset", function(status,rawdata) {
                    client.quit();
                });

                client.on("quit", function(status, rawdata) {
                    if (status === true) {
                        if ( debug ) console.log("QUIT success");
                    }
                    else {
                        if ( debug ) console.log("QUIT failed");
                    }
                });

                client.on("list", function(status, msgcount, msgnumber, data, rawdata) {
                    if (status === false) {
                        if ( debug ) console.log("LIST failed");
                        client.quit();
                    } else if (msgcount > 0) {
                        totalmsgcount = msgcount;
                        currentmsg = 1;
                        if ( debug ) console.log("LIST success with " + msgcount + " message(s)");
                        client.retr(1);
                    } else {
                        if ( debug ) console.log("LIST success with 0 message(s)");
                        client.quit();
                    }
                });
            });
        }

    });
});
