var jive = require("jive-sdk");

exports.info = {
    'verb' : 'get',
    'route': function(req,res) {
        res.writeHead(200, { 'Content-Type': 'html/text' });
        res.end("Info 1");
    }
};
exports.info2 = {
    'verb' : 'get',
    'route': function(req,res) {
        res.writeHead(200, { 'Content-Type': 'html/text' });
        res.end("Info 2");
    }
};