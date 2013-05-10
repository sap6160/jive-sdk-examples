
var jive = require("../../../jive-sdk/api");
var util = require('util');

var SFDC_PREFIX = '/services/data/v27.0';

exports.querySalesforceV27 = querySalesforceV27;


function querySalesforceV27(ticketID, myOauth, uri){

    var tokenStore = myOauth.getTokenStore();

    return tokenStore.find('tokens', {'ticket': ticketID }).then( function(found) {
        if ( found ) {
            var accessToken = found[0]['accessToken']['access_token'];
            var host = found[0]['accessToken']['instance_url'];

            var headers = {
                'Authorization': 'Bearer ' + accessToken
            };

            return jive.util.buildRequest(host + SFDC_PREFIX + uri, 'GET', null, headers, null);
        }

        throw Error('No token record found for ticket ID');
    }).then(
        // success
        function(response) {
            return response;
        },

        // fail
        function(err) {
            jive.logger.error('Error querying salesforce', err);
        }
    );
};

