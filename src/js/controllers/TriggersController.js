app.controller('TriggersController', ['$scope', function($scope) {

    //sample data
    $scope.timers = [];
    $scope.timers.push([
        { since: '10:00', until: '12:00'},
        { since: '14:00', until: '15:00'}
    ]);

    $scope.timers.push([
        { since: '10:00', until: '12:00'}
    ]);

    $scope.temp = {from: 20, to: 26, active: true};
    $scope.humidity = {from: 20, to: 26, active: false};
    $scope.fan = {after: 30, duration: 5, active: true};

    $scope.disableTemperature = function() {

    };

    $scope.disableHumidity = function() {

    };

    $scope.disableFanInterval = function() {

    };

}]);

app.controller('TimerController', ['$scope', function($scope) {
    var ranges = $scope.$parent.timer;

    $scope.addRange = function() {
        ranges.push({
            since: null,
            until: null
        });
    };

    $scope.removeRange = function(idx) {
        ranges.splice(idx, 1);
    };
}]);