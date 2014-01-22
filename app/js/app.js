$.ajaxSetup({
    contentType: 'application/json'
});

var app = window.app = angular.module('growduino', ['ngResource', 'ngRoute']);

app.factory('NetworkConfig', ['$resource', function($resource) {
    return $resource('/config.jso');
}]);

app.factory('Temperature', ['$resource', function($resource) {
    return $resource('/sensors/temp1.jso');
}]);

app.factory('Humidity', ['$resource', function($resource) {
    return $resource('/sensors/humidity.jso');
}]);

app.factory('Lighting', ['$resource', function($resource) {
    return $resource('/sensors/light.jso');
}]);



app.config(['$routeProvider', function($routeProvider) {
    $routeProvider.
        when('/', {
            templateUrl: 'partials/home.htm',
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


app.controller('NavigationController', ['$scope', '$location', function($scope, $location) {
    $scope.isActive = function(loc) {
        return loc === $location.path();
    };
}]);




