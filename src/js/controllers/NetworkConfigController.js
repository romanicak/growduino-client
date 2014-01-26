app.controller('NetworkConfigController', ['$scope', 'NetworkConfig', function($scope, NetworkConfig) {
    $scope.loading = true;
    var config = $scope.config = NetworkConfig.get(function() {
        config.use_dhcp = !!config.use_dhcp; //convert to boolean - TODO move on resource layer
        $scope.loading = false;
    });
}]);
