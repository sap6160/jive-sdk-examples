$(window).ready( function() {

    function doConfigured(config) {
        $("#j-card-configure").hide();
        $("#j-card-configured").show();

        $("#val_username").text( config['username'] );
        $("#val_password").text( config['password'] );
        $("#val_pop3host").text( config['pop3host'] );
        $("#val_pop3port").text( config['pop3port'] );
        $("#val_pop3tls").text( config['pop3tls'] );

        gadgets.window.adjustHeight();

        $("#btn_change").click( function() {
            doConfigure(config)
        });
    }

    function doConfigure(config) {
        $("#j-card-configure").show();
        $("#j-card-configured").hide();

        $("#txt_username").val( config['username'] || 'jivetiletest@gmail.com' );
        $("#txt_password").val( config['password'] || 'jivetilet3st' );
        $("#txt_pop3host").val( config['pop3host'] || 'pop.gmail.com' );
        $("#txt_pop3port").val( config['pop3port'] || '995' );
        $("#tx_pop3tls").val( config['pop3tls'] || 'true' );

        gadgets.window.adjustHeight(380);

        $("#btn_configure").click( function() {
            var configuration = {
                "username"  :   $("#txt_username").val(),
                "password"  :   $("#txt_password").val(),
                "pop3host"  :   $("#txt_pop3host").val(),
                "pop3port"  :   $("#txt_pop3port").val(),
                "pop3tls"   :   $("#txt_pop3tls").val(),
                "configured":   'true'
            };

            jive.tile.close(configuration, {});
        });

    }

    jive.tile.onOpen(function(config, options ) {
        if ( typeof config === "string" ) {
            config = JSON.parse(config);
        }

        config = config || {};

        // initially hide the UI
        $(".j-card").hide();

        debugger;
        if ( config['configured'] === 'true' ) {
            doConfigured(config);
        } else {
            doConfigure(config);
        }

        gadgets.window.adjustHeight(380);
    });

});

