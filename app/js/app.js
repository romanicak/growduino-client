(function() {

$.ajaxSetup({
    contentType: 'application/json'
});

Highcharts.setOptions({
    lang: {
        months: $.fn.datetimepicker.dates['cs'].months,
        shortMonths: $.fn.datetimepicker.dates['cs'].monthsShort,
        weekdays: $.fn.datetimepicker.dates['cs'].days
    },
    global: {
        useUTC: false
    }
});

var app = window.app = angular.module('growduino', ['ngResource', 'ngRoute']);


app.config(['$routeProvider', function($routeProvider) {
    $routeProvider.
        when('/', {
            templateUrl: 'partials/sensors.htm',
            controller: 'ChartController'
        }).
        when('/network', {
            templateUrl: 'partials/network.htm',
            controller: 'NetworkConfigController'
        }).
        otherwise({
           redirectTo: '/'
        });
}]);


})();



