$.ajaxSetup({
    contentType: 'application/json'
});

var app = angular.module('growduino', ['ngResource', 'ngRoute']);

app.factory('NetworkConfig', ['$resource', function($resource) {
    return $resource('/config.jso');
}]);


app.config(['$routeProvider', function($routeProvider) {
    $routeProvider.
        when('/', {
            templateUrl: 'partials/home.html',
            controller: 'HomeCtrl'
        }).
        when('/network', {
            templateUrl: 'partials/network.html',
            controller: 'NetworkConfigCtrl'
        }).
        otherwise({
           redirectTo: '/'
        });
}]);


app.controller('NavCtrl', ['$scope', '$location', function($scope, $location) {
    $scope.isActive = function(loc) {
        return loc === $location.path();
    };
}]);

app.controller('HomeCtrl', ['$scope', function($scope) {
    //TODO
}]);

app.controller('NetworkConfigCtrl', ['$scope', 'NetworkConfig', function($scope, NetworkConfig) {
    var config = $scope.config = NetworkConfig.get(function() {
        config.use_dhcp = !!config.use_dhcp; //convert to boolean
    });
}]);

