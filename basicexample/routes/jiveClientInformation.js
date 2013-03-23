


//main application for understanding what's running in the jive client
exports.clientinfo = function( req, res ){


    var jiveClientConfiguration = res.app.settings['jiveClientConfiguration'];
    var location =  jiveClientConfiguration.baseUrl + ":" + jiveClientConfiguration.port

    //make this a function
    var templateData = {
        location : location,
        clientName : jiveClientConfiguration.clientName,
        clientDescription : jiveClientConfiguration.clientDescription
    };

    //todo: add error handling
   //Render the request using the template engine, in this case, mustache
    res.render(res.app.settings['views'] + '/clientInformation.html', templateData);
};

