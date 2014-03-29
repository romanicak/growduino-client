define([
    'angular', 'angular_resource', 'angular_route', 'bootstrap', 'highcharts', 'moment',
    'bootstrap_datetimepicker',
    'async', 'utils', 'settings'
], function() {

$.ajaxSetup({
    contentType: 'application/json'
});

Highcharts.setOptions({
    /*lang: {
        months: $.fn.datetimepicker.dates.cs.months,
        shortMonths: $.fn.datetimepicker.dates.cs.monthsShort,
        weekdays: $.fn.datetimepicker.dates.cs.days
    },*/
    global: {
        timezoneOffset: settings.tzOffset
    }
});

var app = window.app = angular.module('growduino', ['ngResource', 'ngRoute']);

app.constant('TZ_OFFSET', settings.tzOffset);
app.constant('OUTPUTS', settings.outputs);
app.constant('SENSORS', settings.sensors);

app.config(['$routeProvider', function($routeProvider) {
    $routeProvider.
        when('/', {
            templateUrl: 'partials/sensors.html',
            controller: 'ChartController',
            reloadOnSearch: false
        }).
        when('/triggers', {
            templateUrl: 'partials/triggers.html',
            controller: 'TriggersController'
        }).
        when('/alerts', {
            templateUrl: 'partials/alerts.html',
            controller: 'AlertsController'
        }).
        when('/network', {
            templateUrl: 'partials/network.html',
            controller: 'NetworkConfigController'
        }).
        otherwise({
           redirectTo: '/'
        });
}]);

return app;

});