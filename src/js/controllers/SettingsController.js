app.controller('SettingsController', ['$scope', '$timeout', 'BackendConfig', function($scope, $timeout, BackendConfig) {
    $scope.loading = true;
    $scope.saving = false;

    var config = $scope.config = BackendConfig.get(function() {
        config.use_dhcp = !!config.use_dhcp; //convert to boolean - TODO move on resource layer
        $scope.loading = false;
    });

    // $scope.tzOptions = {

    // }

    $scope.save = function() {
        if ($scope.saving) return;
        $scope.saving = true;

        config.$save().then(function() {
            $scope.saving = false;
            $scope.saveSuccess = true;
            $timeout(function() {
                $scope.saveSuccess = false;
            }, 2000);
        }, function() {
            alert('Oops save failed.');
        });
    };
}]);