var jive = require("jive-sdk");
var url = require('url');
var util = require('util');
var sampleOauth = require('./routes/oauth/sampleOauth');
var sfdc_helpers = require(process.cwd() + '/helpers/sfdc_helpers');
var q = require('q');


var metaDataCollection = "sfdcActivityMetadata";
exports.metaDataCollection = function () {
    return metaDataCollection;
};
var metaDataStore = jive.service.persistence();

exports.pullActivity = pullActivity;
exports.pullComments = pullComments;

function pullActivity(extstreamInstance) {

    return getLastDatePulled(extstreamInstance, 'activity').then(function (lastDatePulled) {


        var opportunityID = extstreamInstance.config.opportunityID;
        var ticketID = extstreamInstance.config.ticketID;

        //First query text posts
        var queryTextPosts = util.format("SELECT Id, Type, CreatedDate, CreatedBy.Name, Parent.Name, IsDeleted, Body, (SELECT Id, FieldName, OldValue, NewValue" +
            " FROM FeedTrackedChanges ) FROM OpportunityFeed" +
            " WHERE ParentId = '%s' AND CreatedDate > %s ORDER BY CreatedDate ASC",
            opportunityID,
            getDateString(lastDatePulled));
        var uri1 = util.format("/query?q=%s", encodeURIComponent(queryTextPosts));

        return sfdc_helpers.querySalesforceV27(ticketID, sampleOauth, uri1).then(function (response) {
            var entity = response['entity'];
            return convertToActivities(entity, lastDatePulled, extstreamInstance);
        });

    }).catch(function (err) {
            jive.logger.error('Error querying salesforce', err);
        });

};

function pullComments(extstreamInstance) {
    return getLastDatePulled(extstreamInstance, 'comment').then(function (lastDatePulled) {
        var opportunityID = extstreamInstance.config.opportunityID;
        var query = util.format("SELECT Id, CommentType, CreatedDate, CreatedBy.Name, CreatedBy.Email, FeedItemId, IsDeleted, CommentBody" +
            " FROM FeedComment WHERE ParentId = '%s' AND CreatedDate > %s ORDER BY CreatedDate ASC",
            opportunityID,
            getDateString(lastDatePulled));

        var uri = util.format("/query?q=%s", encodeURIComponent(query));
        var ticketID = extstreamInstance.config.ticketID;

        return sfdc_helpers.querySalesforceV27(ticketID, sampleOauth, uri).then(function (response) {
            var entity = response['entity'];
            return convertToComments(entity, lastDatePulled, extstreamInstance);
        }, function (err) {
            jive.logger.error('Error converting comments', err);
        });
    });
}


function convertToActivities(entity, lastDatePulled, instance) {
    var records = entity['records'];

    var activities = records.map(function (record) {
        var json = getActivityJSON(record);

        if (!isNaN(json['sfdcCreatedDate'])) {
            lastDatePulled = Math.max(lastDatePulled, json['sfdcCreatedDate']);
        }
        return json;
    });

    return updateLastDatePulled(instance, lastDatePulled, 'activity').thenResolve(activities);
}

function convertToComments(entity, lastDatePulled, instance) {
    var records = entity['records'];

    var comments = records.map(function (record) {
        var json = getCommentJSON(record);

        if (!isNaN(json['sfdcCreatedDate'])) {
            lastDatePulled = Math.max(lastDatePulled, json['sfdcCreatedDate']);
        }

        return json;
    });

    return updateLastDatePulled(instance, lastDatePulled, 'comment').thenResolve(comments);

}


function getActivityJSON(record) {

    var actor = record.CreatedBy && record.CreatedBy.Name || 'Anonymous';
    var oppName = record.Parent && record.Parent.Name || 'Some Opportunity';
    var externalID = record.Id;
    var createdDate = new Date(record.CreatedDate).getTime();

    var body = null;
    if (record.Type == 'TextPost') {
        body = record.Body;
    }
    else if (record.Type == 'TrackedChange') {
        var changes = record.FeedTrackedChanges && record.FeedTrackedChanges.records;
        if (changes && changes.length > 0) {
            var lastChange = changes[changes.length - 1];
            body = actor + ' changed ' + lastChange.FieldName.replace('Opportunity\.', '') + ' from '
                + lastChange.OldValue + ' to ' + lastChange.NewValue + '.';
        }
    }

    body = body || 'Empty post';

    return {
        "sfdcCreatedDate": createdDate,
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
};

function getCommentJSON(record) {

    var actor = record.CreatedBy && record.CreatedBy.Name || 'Anonymous';
    var firstLast = actor.split(' ');
    var first = firstLast[0], last = '';
    if (firstLast.length >= 2) {
        last = firstLast[1];
    }
    var email = record.CreatedBy && record.CreatedBy.Email || 'anonymous@example.com';
    var body = record.CommentBody || 'Empty comment';
    var externalID = record.Id;
    var createdDate = new Date(record.CreatedDate).getTime();

    return {
        "sfdcCreatedDate": createdDate,
        "author": {
            "name": {
                "givenName": first,
                "familyName": last
            },
            "email": email
        },
        "content": {"type": "text/html", "text": "<p>" + body + "</p>"},
        "type": "comment",
        "externalID": externalID,
        "externalActivityID": record.FeedItemId //Need this to use /extstreams/{id}/extactivities/{externalActivityID}/comments endpoint
    }
};

function getDateString(time) {
    return new Date(time).toISOString().replace(/Z$/, '+0000');
}

function getMetadataByInstance(instance) {
    return metaDataStore.find(metaDataCollection, {'instanceID': instance['id']}).then(function (results) {
        if (results.length <= 0) {
            return null;
        }
        return results[0];
    });
}

function getLastDatePulled(instance, type) {
    return getMetadataByInstance(instance).then(function (metadata) {

        var lastDatePulled = metadata && metadata.lastDatePulled && metadata.lastDatePulled[type];

        if (!lastDatePulled) {
            lastDatePulled = 1; //start date as 1 ms after the epoch, so that instance pulls all existing data for an opportunity
            return updateLastDatePulled(instance, lastDatePulled, type).thenResolve(lastDatePulled);
        }
        return lastDatePulled;
    });
}

function updateLastDatePulled(instance, lastDatePulled, type) {
    return getMetadataByInstance(instance).then(function (metadata) {
        var changed = false;
        if (!metadata) {
            metadata = { "instanceID": instance['id'] };
        }
        if (!metadata.lastDatePulled) {
            metadata.lastDatePulled = {};
        }
        if (!metadata.lastDatePulled[type]) {
            metadata.lastDatePulled[type] = lastDatePulled;
            changed = true;
        }
        else {
            if (metadata.lastDatePulled[type] < lastDatePulled) {
                changed = true;
                metadata.lastDatePulled[type] = lastDatePulled;
            }
        }
        if (changed) {
            return metaDataStore.save(metaDataCollection, instance['id'], metadata);
        }
        return metadata;
    });
}
