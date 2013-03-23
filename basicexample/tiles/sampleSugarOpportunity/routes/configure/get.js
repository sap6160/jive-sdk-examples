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

/*
 Create a form that captures user name & password.
 Use this to login and exchange a session key.
 Should also take the URL of the sugar instance
 */
var fs = require('fs');




var loginToSugar = function(app){
    console.log("Trying to login to sugar...");
    var password = 'Sugar1';
    var md5Password = crypto.createHash('md5').update(password).digest("hex");
    console.log("The encrypted password is: " + md5Password);
    var sugarRequestData = {user_auth :
    {user_name : "Ethan",
        password : md5Password}
    };
    var postData = querystring.stringify({
        'method' : 'login',
        'input_type': 'JSON',
        'response_type': 'JSON',
        'rest_data' :  JSON.stringify(sugarRequestData)
    });
    console.log('POSTDATA: ' + postData);

    //The sugar rest endpoint
    //https://demo.sugarondemand.com/jmertic_vert/seed1/jivedemo/service/v4_1/rest.php
    var reqHeaders =  {'Content-Type': 'application/x-www-form-urlencoded'};
    var options = {
        hostname: 'demo.sugarondemand.com',
        path: '/jmertic_vert/seed1/jivedemo/service/v4_1/rest.php',
        method: 'POST',
        headers: reqHeaders
    };

    var https = require('https');
    var req = https.request(options, loginToSugarCallback);

    req.on('error', function(e) {
        console.log('problem with request: ' + e.message);
    });

// write data to request body
    req.write(postData);
    req.end();

};

/*
 Once we have a session id, store it in the app for use with other commands
 */
var loginToSugarCallback = function(res){

    console.log('STATUS: ' + res.statusCode);
    console.log('HEADERS: ' + JSON.stringify(res.headers));
    res.setEncoding('utf8');
    res.on('data', function (chunk) {
        console.log('BODY: ' + chunk);
        var response = JSON.parse(chunk);
        console.log('Your session ID is "' + response.id + '"');
        app.set("sugarSessionId", response.id);
    });
};








//// EXPORTS
exports.route = function(req, res){
    var conf = res.app.settings['jiveClientConfiguration'];
    res.render('sampleSugarOpportunity/configuration.html', { host: conf.baseUrl + ':' + conf.port  });
};