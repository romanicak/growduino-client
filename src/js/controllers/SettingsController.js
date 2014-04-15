define(['app'], function(app) {

app.controller('SettingsController', ['$scope', 'BackendConfig', function($scope, BackendConfig) {
    $scope.loading = true;
    var config = $scope.config = BackendConfig.get(function() {
        config.use_dhcp = !!config.use_dhcp; //convert to boolean - TODO move on resource layer
        $scope.loading = false;
    });
}]);

});