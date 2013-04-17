var jive = require("jive-sdk");

exports.route = function(req, res){
    var conf = jive.service.options;
    res.render('samplelist/configuration.html', { host: conf.clientUrl + ':' + conf.port  });
};