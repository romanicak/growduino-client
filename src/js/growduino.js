define([
    "app",
    "services/resources",
    "services/Trigger",
    "controllers/NavigationController",
    "controllers/ChartController",
    "controllers/NetworkConfigController",
    "controllers/RelayController",
    "controllers/TriggersController",
    "directives/bsHasError",
    "ngtemplates"
], function() {
    document.title = settings.title;

    $(function() {
        $.each(document.styleSheets, function(i,sheet){
            if (sheet.href && sheet.href.indexOf('bootstrap.min.css') !== -1) {
                var rules = sheet.rules ? sheet.rules : sheet.cssRules;
                if (rules !== null && rules.length === 0) {
                    $('<link rel="stylesheet" href="/bower/bootstrap/dist/css/bootstrap.min.css">').appendTo('head');
                }
            }
        });
        $('#app-loading').remove();
        $('.container').show();
        angular.bootstrap(document, ['growduino']);
    });
});