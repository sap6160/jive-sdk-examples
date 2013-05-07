var jive = require("jive-sdk");

exports.route = function (req, res) {
    var conf = jive.service.options;
    var extstream = null;

    jive.extstreams.findAll().then(function (allExtstreams) {
        extstream = allExtstreams[0];
        console.log('Found: ' + JSON.stringify(extstream));

        var url = extstream['url'];

        return jive.extstreams.pushActivity(extstream, sampleActivity);

    }).then(function (res) {
            var activity = res.entity;

            return jive.extstreams.commentOnActivity(activity, sampleComment);

        }).then(function (response) {
            var comment = response.entity;

            res.writeHead(201, {'Content-Type': 'application/json'});
            res.end(JSON.stringify({'Success': true, 'Comment': comment}, null, '  '));


        }).catch(function (err) {
            res.writeHead(500, {'Content-Type': 'application/json'});
            res.end(JSON.stringify({'Success': false, 'error': err, 'stacktrace': (err.stack ? err.stack : undefined)}, null, '\t'));
        });


};


var sampleActivity = {
    "activity": {
        "action": {
            "name": "posted"
        },
        "object": {
            "type": "jive:test",
            "url": "http://www.jivesoftware.com",
            "image": "https://jivesoftware.jiveon.com/images/theming/presets/winter/winter_logo.png",
            "title": "jivesoftware.jiveon.com"
        }
    }
};

var sampleComment = {
    "type": "comment",
    "author": {
        "name": {
            "givenName": "Bob",
            "familyName": "Jimbo"
        },
        "email": "aron.racho@jivesoftware.com"
    },
    "content": {
        "type": "text/html",
        "text": "Mock dealroom external comment"
    }
};