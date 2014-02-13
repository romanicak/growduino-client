(function() {

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
        useUTC: false
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

app.config(['$routeProvider', function($routeProvider) {
    $routeProvider.
        when('/', {
            templateUrl: 'partials/sensors.html'
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



