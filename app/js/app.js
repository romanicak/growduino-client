$.ajaxSetup({
    contentType: 'application/json'
});

var app = angular.module('growduino', ['ngResource']);

app.factory('NetworkConfig', ['$resource', function($resource) {
    return $resource('/config.jso');
}]);

app.controller('NetworkConfigCtrl', ['$scope', 'NetworkConfig', function($scope, NetworkConfig) {
    var config = $scope.config = NetworkConfig.get(function() {
        config.use_dhcp = !!config.use_dhcp; //convert to boolean
    });
}]);

