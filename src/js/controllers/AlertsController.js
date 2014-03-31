define(['app'], function(app) {

app.controller('AlertController', ['$scope', function($scope) {
    $scope.init = function(relay, name) {
        //$scope.alert = relay.getTrigger(name);
    };

    $scope.toggle = function() {
        //$scope.t.active = !$scope.t.active;
    };
}]);


app.controller('AlertsController', ['$scope', 'Alert', 'ClientConfig', function($scope, Alert, ClientConfig) {

    $scope.loadingMessage = 'Loading alerts';
    $scope.loading = true;
    $scope.loadingStep = 0;
    $scope.loadingPercent = 0;


    function step() {
        $scope.loadingStep += 1;
        $scope.loadingPercent = parseInt($scope.loadingStep / $scope.stepCount * 100, 10);
    }

    var cfg = ClientConfig.get();

    $scope.stepCount = 5;
    cfg.$promise.finally(function() {
        step();
        Alert.loadMany([0,1,2,3], function(raw) {
           step();

        }, function() {
            $scope.loadingPercent = 100;
            $scope.loading = false;
        });
    });
}]);

});