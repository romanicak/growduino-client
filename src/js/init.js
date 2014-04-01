define([
    "app",
    "services/resources",
    "services/divisors",
    "services/Trigger",
    "services/Alert",
    "controllers/NavigationController",
    "controllers/ChartController",
    "controllers/NetworkConfigController",
    "controllers/RelayController",
    "controllers/TriggersController",
    "controllers/AlertsController",
    "directives/bsHasError",
    "ngtemplates"
], function() {
    document.title = settings.title;

    $(function() {
        if ($('#bootstrap-css-check').css('display') !== 'none') {
            $('<link rel="stylesheet" href="/bower/bs.css">').appendTo('head');
        }
        $('#app-loading').remove();
        $('.container').show();
        angular.bootstrap(document, ['growduino']);
    });
});