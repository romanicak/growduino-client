define([
    'angular', 'bootstrap', 'highcharts', 'moment',
    'bootstrap_datetimepicker', 'bootstrap_datetimepicker_cs', 'async', 'utils', 'settings'
], function() {

$.ajaxSetup({
    contentType: 'application/json'
});

Highcharts.setOptions({
    lang: {
        months: $.fn.datetimepicker.dates.cs.months,
        shortMonths: $.fn.datetimepicker.dates.cs.monthsShort,
        weekdays: $.fn.datetimepicker.dates.cs.days
    },
    global: {
        timezoneOffset: settings.tzOffset
    }
});

var app = window.app = angular.module('growduino', ['ngResource', 'ngRoute']);

app.constant('TZ_OFFSET', settings.tzOffset);
app.constant('OUTPUTS', settings.outputs);
app.constant('SENSORS', settings.sensors);
app.constant('SENSOR_META', {
    'Humidity':  { mapFn: utils.mapDecimalValues },
    'Temp1': { mapFn: utils.mapDecimalValues },
    'Temp2': { mapFn: utils.mapDecimalValues },
    'Temp3': { mapFn: utils.mapDecimalValues },
    'Light': { mapFn: utils.mapPercentValues },
    'Usnd':  { mapFn: null }
});

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