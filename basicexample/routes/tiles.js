var mustache = require('mustache');
var http = require('http');
var url = require('url');
var tileRegistry = require('jive-sdk/tile/registry');
var events = require('events');

function getProcessed(conf, all) {
    var host = conf.baseUrl + ':' + conf.port;
    var processed = [];

    all.forEach( function( tile ) {
        var name = tile.name;
        var stringified = JSON.stringify(tile);
        stringified =  mustache.render(stringified, {
            host: host,
            tile_public: host + '/tiles/' + name,
            tile_route: host + '/' + name,
            clientId: conf.clientId
        });

        var processedTile = JSON.parse(stringified);
        processedTile.description += ' for ' + conf.clientId;
        processed.push( processedTile );
    });
    return processed;
}

/**
 * List all the tiles
 * @param req
 * @param res
 */
exports.tiles = function(req, res){
    var app = req.app;
    var jiveApi = app.settings['jiveApi'];

    jiveApi.TileDefinition.findAll().execute( function( all ) {

        // todo -- maybe delegate to jiveclient_tools

        var conf = res.app.settings['jiveClientConfiguration'];

        var processed = getProcessed(conf, all);
        var body = JSON.stringify(processed, null, 4);

        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(body);

    } );

    // todo -- what if bad things happen
};

exports.registration = function( req, res ) {
    var conf = res.app.settings['jiveClientConfiguration'];
    var clientId = conf.clientId;
    var jiveApi = res.app.settings['jiveApi'];
    var url = req.body['url'];
    var config = req.body['config'];
    var name = req.body['name'];
    var code = req.body['code'];

    jiveApi.TileInstance.register(clientId, url, config, name, code).execute(
        function( tileInstance ) {
            console.log("registered tile instance", tileInstance );
            jiveApi.TileInstance.save(tileInstance).execute(function() {
                console.log( "persisted", tileInstance );
                tileRegistry.emit("newInstance." + name, tileInstance);
            });
        }
    );

    // todo -- what if it isn't? err???
    res.status(204);
    res.set({'Content-Type': 'application/json'});
    res.send();
};

// todo -- this is for jive development only?
exports.installTiles = function( req, res ) {
    var app = req.app;
    var conf = res.app.settings['jiveClientConfiguration'];

    var jiveApi = app.settings['jiveApi'];

    var url_parts = url.parse(req.url, true);
    var query = url_parts.query;

    var jiveHost = query['jiveHost'];
    var jivePort = query['jivePort'];

    jiveApi.TileDefinition.findAll().execute( function( all ) {
        var processed = getProcessed(conf, all);

        var requestCount = processed.length;
        var requestProgress = new events.EventEmitter();
        var responses = {};

        processed.forEach( function(tile) {
            var postBody = JSON.stringify(tile);
            console.log("Making request to jive instance for " + tile.name + ":\n", postBody);

            var requestParams = {
                host    : jiveHost,
                port    : jivePort,
                method  : 'POST',
                path    : '/api/jivelinks/v1/tiles/definitions',
                headers : { 'Authorization' : 'Basic YWRtaW46YWRtaW4='}
            };
            requestParams['headers']['Content-Length'] = Buffer.byteLength(postBody, 'utf8');

            var jiveRequest =  http.request( requestParams, function(jiveResponse) {
                var strBuf = [];
                jiveResponse.on('data', function (chunk) {
                    strBuf.push(chunk);
                }).on('end', function () {
                    var str = strBuf.join("");
                    responses[tile.name] = str;
                    console.log("Jive response for " + tile.name + ".  Status: " + jiveResponse.statusCode);
                    console.log("Headers: ", jiveResponse.headers);
                    console.log("Body: \n", str);
                    --requestCount;
                    requestProgress.emit("check");
                });
            });
            jiveRequest.on('error', function(e) {
                console.log("error on request to jive instance: ", e);
            });

            jiveRequest.write(postBody, 'utf8');
            jiveRequest.end();
        });

        requestProgress.on("check", function(){
            if(requestCount == 0){
                Object.keys(responses).forEach(function(jiveResp){
                    res.write("\n//");
                    res.write(jiveResp);
                    res.write(" response\n");
                    res.write(responses[jiveResp]);
                });
                res.end();
            }
        });
    });

    // todo -- what if bad things happen
};