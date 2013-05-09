

var jive = require("jive-sdk");
var url = require('url');
var util = require('util');
var sampleOauth = require('./routes/oauth/sampleOauth');


exports.pullOpportunity = pullOpportunity;

function pullOpportunity(tileInstance){

    var opportunityID = tileInstance.config.opportunityID;
    var uri = util.format("/services/data/v20.0/sobjects/Opportunity/%s", opportunityID);

    var ticketID = tileInstance.config.ticketID;

    var tokenStore = sampleOauth.getTokenStore();

    return tokenStore.find('tokens', {'ticket': ticketID }).then( function(found) {
        if ( found ) {
            var accessToken = found[0]['accessToken']['access_token'];
            var host = found[0]['accessToken']['instance_url'];


            var headers = {
                'Authorization': 'Bearer ' + accessToken
            };

            return jive.util.buildRequest(host + uri, 'GET', null, headers);
        }
    }).then(
        // success
        function(response) {
            return handleResponse(response);
        },

        // fail
        function(response) {
            return response;
        }
    );
};

function handleResponse(response) {
    if (200 <= response.statusCode && response.statusCode <= 299 && response['entity']) {
        return convertToListTileData(response['entity']);
    }
    return response;
}

function convertToListTileData(opportunity) {
    var dataToPush = {
        data: {
            "title": opportunity['Name'],
            "contents": [

                {
                    "text": util.format("Stage Name: %s", opportunity['StageName']),
                    "icon": "http://farm6.staticflickr.com/5106/5678094118_a78e6ff4e7.jpg",
                    "linkDescription": "Stage Name"
                },
                {
                    "text": util.format("Type: %s", opportunity['Type']),
                    "icon": "http://farm6.staticflickr.com/5106/5678094118_a78e6ff4e7.jpg",
                    "linkDescription": "Type"
                },
                {
                    "text": util.format("Probability: %s", opportunity['Probability']) + "%",
                    "icon": "http://farm6.staticflickr.com/5106/5678094118_a78e6ff4e7.jpg",
                    "linkDescription": "Close Date"
                },
                {
                    "text": util.format("Amount: $%d", opportunity['Amount']),
                    "icon": "http://farm6.staticflickr.com/5106/5678094118_a78e6ff4e7.jpg",
                    "linkDescription": "Amount"
                },
                {
                    "text": util.format("Expected Revenue: $%d", opportunity['ExpectedRevenue']),
                    "icon": "http://farm6.staticflickr.com/5106/5678094118_a78e6ff4e7.jpg",
                    "linkDescription": "Expected Revenue"
                },
                {
                    "text": util.format("Close Date: %s", opportunity['CloseDate']),
                    "icon": "http://farm6.staticflickr.com/5106/5678094118_a78e6ff4e7.jpg",
                    "linkDescription": "Close Date"
                }
            ],
            "config": {
                "listStyle": "contentList"
            }
        }
    };

    return dataToPush;
}