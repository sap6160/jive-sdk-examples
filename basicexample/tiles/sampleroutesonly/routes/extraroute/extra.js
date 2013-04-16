var jive = require("jive-sdk");

exports.randomRoute = {
    'verb' : 'get',
    'route': function(req,res) {
        var conf = jive.service.options;
        res.render('samplelist/configuration.html', { host: conf.clientUrl + ':' + conf.port  });
    }
};
exports.explicitPathRoute = {
    'path' : 'blahblahblah',
    'verb' : 'get',
    'route': function(req,res) {
        var conf = jive.service.options;
        res.render('samplelist/configuration.html', { host: conf.clientUrl + ':' + conf.port  });
    }
};