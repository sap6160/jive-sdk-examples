var opportunities = require('./opportunities'),
    jive = require('jive-sdk'),
    q = require('q');

exports.task = new jive.tasks.build(
    // runnable
    function () {
        jive.extstreams.findByDefinitionName('sfdc_opportunity_activity').then(function (instances) {
            if (instances) {
                instances.forEach(function (instance) {
                    opportunities.pullActivity(instance).then(function (data) {
                        var proms = data.map(function (activity) {
                            return jive.extstreams.pushActivity(instance, activity);
                        });

                        return q.all(proms);

                    }).catch(function (err) {
                            jive.logger.error('Error pushing salesforce activity to Jive', err);
                        });

                    opportunities.pullComments(instance).then(function(comments) {
                        var proms = comments.map(function (comment) {
                            var externalActivityID = comment['externalActivityID'];
                            delete comment['externalActivityID'];
                            return jive.extstreams.commentOnActivityByExternalID(instance, externalActivityID, comment);
                        });

                        return q.all(proms);
                    });
                });
            }
        });
    },

    // interval (optional)
    10000
);

