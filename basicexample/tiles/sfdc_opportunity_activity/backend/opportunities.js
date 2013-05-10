var jive = require("jive-sdk");
var url = require('url');
var util = require('util');
var sampleOauth = require('./routes/oauth/sampleOauth');
var sfdc_helpers = require(process.cwd() + '/helpers/sfdc_helpers');


var metaDataCollection = "sfdcActivityMetadata";
exports.metaDataCollection = function () {
    return metaDataCollection;
};
var metaDataStore = jive.service.persistence();

exports.pullActivity = pullActivity;
exports.pullComments = pullComments;

function pullActivity(extstreamInstance) {

    return getLastDatePulled(extstreamInstance).then(function (lastDatePulled) {


        var opportunityID = extstreamInstance.config.opportunityID;
        var query = util.format("SELECT Id, Type, CreatedDate, CreatedBy.Name, Parent.Name, IsDeleted, Body FROM OpportunityFeed" +
            " WHERE ParentId = '%s' AND Type = 'TextPost' AND CreatedDate > %s ORDER BY CreatedDate DESC",
            opportunityID,
            getDateString(lastDatePulled));
        var uri = util.format("/query?q=%s", encodeURIComponent(query));
        var ticketID = extstreamInstance.config.ticketID;

        return sfdc_helpers.querySalesforceV27(ticketID, sampleOauth, uri).then(function (response) {
            var entity = response['entity'];
            return convertToActivities(entity, lastDatePulled, extstreamInstance);
        });

    }).catch(function(err) {
            jive.logger.error('Error querying salesforce', err);
        });

};

function pullComments(extstreamInstance) {
    return getLastDatePulled(extstreamInstance).then(function(lastDatePulled) {
        var opportunityID = extstreamInstance.config.opportunityID;
        var query = util.format("SELECT Id, CommentType, CreatedDate, CreatedBy.Name, FeedItemId, IsDeleted, CommentBody" +
            " FROM FeedComment WHERE ParentId = '%s' AND CreatedDate > %s ORDER BY CreatedDate DESC",
            opportunityID,
            getDateString(lastDatePulled));

        var uri = util.format("/query?q=%s", encodeURIComponent(query));
        var ticketID = extstreamInstance.config.ticketID;

        return sfdc_helpers.querySalesforceV27(ticketID, sampleOauth, uri).then(function (response) {
            var entity = response['entity'];
            return convertToComments(entity, lastDatePulled, extstreamInstance);
        });
    });
}


function convertToActivities(entity, lastDatePulled, instance) {
    var records = entity['records'];

    var activities = records.map(function(record) {
        var json = getActivityJSON(record);

        if (!isNaN(json['createdDate'])) {
            lastDatePulled = Math.max(lastDatePulled, json['createdDate']);
        }
        return json['jiveactivity'];
    });

    return updateLastDatePulled(instance, lastDatePulled).thenResolve(activities);
}

function convertToComments(entity, lastDatePulled, instance) {
    var records = entity['records'];

    var comments = records.map(function(record) {
        var json = getCommentJSON(record);

        if (!isNaN(json['createdDate'])) {
            lastDatePulled = Math.max(lastDatePulled, json['createdDate']);
        }

        return json['jivecomment'];
    });

    return updateLastDatePulled(instance, lastDatePulled).thenResolve(comments);

}


function getActivityJSON(record) {

    var actor = record.CreatedBy && record.CreatedBy.Name || 'Anonymous';
    var body = record.Body || 'Empty post';
    var oppName = record.Parent && record.Parent.Name || 'Some Opportunity';
    var externalID = record.Id;
    var createdDate = new Date(record.CreatedDate).getTime();

    return {
        "createdDate": createdDate,
        "jiveactivity": {
            "activity": {
                "action": {
                    "name": "posted",
                    "description": body
                },
                "actor": {
                    "name": actor,
                    "email": "actor@email.com"
                },
                "object": {
                    "type": "website",
                    "url": "http://www.salesforce.com",
                    "image": "http://farm6.staticflickr.com/5106/5678094118_a78e6ff4e7.jpg",
                    "title": oppName,
                    "description": body
                },
                "externalID": externalID
            }
        }
    }
};

function getCommentJSON(record) {

    var actor = record.CreatedBy && record.CreatedBy.Name || 'Anonymous';
    var firstLast = actor.split(' ');
    var first = firstList[0], last = '';
    if (firstLast.length >= 2) {
        last = firstLast[1];
    }
    var body = record.Body || 'Empty post';
    var externalID = record.Id;
    var createdDate = new Date(record.CreatedDate).getTime();

    return {
        "createdDate": createdDate,
        "jivecomment":  {
            "author" : {
              "name": {
                  "givenName": first,
                  "familyName": last
              }
            },
            "content": {"type": "text/html", "text": "<p>" + body + "</p>"},
            "type": "comment",
            externalID: externalID
        }
    }
};

function getDateString(time) {
    return new Date(time).toISOString().replace(/Z$/, '+0000');
}

function getMetadataByInstance(instance) {
    return metaDataStore.find(metaDataCollection, {'instanceID': instance['id']}).then(function(results) {
        if (results.length <= 0) {
            return null;
        }
        return results[0];
    });
}

function getLastDatePulled(instance) {
    return getMetadataByInstance(instance).then(function (metadata) {

        var lastDatePulled = metadata && metadata.lastDatePulled;

        if (!lastDatePulled) {
            lastDatePulled = new Date().getTime();
            return updateLastDatePulled(instance, lastDatePulled).thenResolve(lastDatePulled);
        }
        return lastDatePulled;
    });
}

function updateLastDatePulled(instance, lastDatePulled) {
    return getMetadataByInstance(instance).then(function(metadata){
        if (!metadata) {
            metadata = { "instanceID": instance['id'] };
        }
        if (!metadata.lastDatePulled) {
            metadata.lastDatePulled = lastDatePulled;
        }
        else {
            metadata.lastDatePulled = Math.max(lastDatePulled, metadata.lastDatePulled);
        }
        return metaDataStore.save(metaDataCollection, instance['id'], metadata);
    });
}
