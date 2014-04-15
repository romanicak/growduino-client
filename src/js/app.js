define([
    'angular', 'angular_resource', 'angular_route', 'bootstrap', 'highcharts', 'moment',
    'bootstrap_datetimepicker',
    'async', 'utils', 'settings'
], function() {

$.ajaxSetup({
    contentType: 'application/json'
});

var app = window.app = angular.module('growduino', ['ngResource', 'ngRoute']);

app.constant('settings', window.settings);

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
        when('/settings', {
            templateUrl: 'partials/settings.html',
            controller: 'SettingsController'
        }).
        otherwise({
           redirectTo: '/'
        });
}]);

return app;

});