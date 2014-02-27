(function() {

var TZ_OFFSET = -60; //TODO read from /sensors/status.jso: timeZoneffset = -tz * 60

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
        timezoneOffset: TZ_OFFSET
    }
});

var app = window.app = angular.module('growduino', ['ngResource', 'ngRoute']);

app.constant('OUTPUTS', [
    'Timer 1',
    'Timer 2',
    'Pump',
    'Fan',
    'Humidifier',
    'Heating'
]);

app.constant('SENSORS', [
    'Humidity',
    'Temp1',
    'Light',
    'Usnd',
    'Temp2',
    'Temp3'
]);

app.constant('SENSOR_META', {
    'Humidity':  { mapFn: utils.mapDecimalValues },
    'Temp1': { mapFn: utils.mapDecimalValues },
    'Temp2': { mapFn: utils.mapDecimalValues },
    'Temp3': { mapFn: utils.mapDecimalValues },
    'Light': { mapFn: utils.mapPercentValues },
    'Usnd':  { mapFn: null }
});

app.constant('TZ_OFFSET', TZ_OFFSET);

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


})();



