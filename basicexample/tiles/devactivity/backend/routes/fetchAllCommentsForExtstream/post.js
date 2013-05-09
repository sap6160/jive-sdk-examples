var jive = require("jive-sdk");
var q = require('q');

exports.route = function (req, res) {
    var conf = jive.service.options;
    var extstream = null;
    var activity = null;


    jive.extstreams.findAll().then(function (allExtstreams) {
        extstream = allExtstreams[0];
        console.log('Found: ' + JSON.stringify(extstream));

        var url = extstream['url'];

        return jive.extstreams.pushActivity(extstream, sampleActivity);

    }).then(function (res) {
            activity = res.entity;
            var promises = [];

            for (var i = 0; i < 5; i++) {
                promises.push(jive.extstreams.commentOnActivity(activity, sampleComment()));
            }

            return q.all(promises);

        }).then(function () { //After creating 5 comments...

            var opts = {
                "fieldList": ['resources', 'content', 'type'],
                "commentSourceType": "EXTERNAL",
                "publishedAfter": new Date().getTime() - 100000 //should return some comments unless it took > 100 seconds!
            };

            return jive.extstreams.fetchAllCommentsForExtstream(extstream, opts);

        }).then(function (response) {
            var commentsList = response.entity;

            res.writeHead(201, {'Content-Type': 'application/json'});

            res.end(JSON.stringify({'Success': true, 'list of comments': commentsList}, null, '  '));

        }).catch(function (err) {
            res.writeHead(500, {'Content-Type': 'application/json'});
            res.end(JSON.stringify({'Success': false, 'error': err, 'stacktrace': err.stack },
                null, '\t'));
        });


};

function actOnComments(commentsList, commentFunc, deferred) {
    if (!deferred) {
        deferred = q.defer();
    }
   var list = commentsList.list;
   list.forEach(commentFunc);
   if (commentsList.next) {
       commentsList.next().then(function(response) {
           actOnComments(response.entity, commentFunc, deferred);
       });
   }
    else {
       deferred.resolve(commentsList);
    }
    return deferred.promise;

}




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

function sampleComment() {
    return {
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
    }
};