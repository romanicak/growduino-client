define(['app'], function(app) {

app.controller('NavigationController', ['$scope', '$location', function($scope, $location) {
    $scope.isActive = function(loc) {
        return loc === $location.path();
    };
}]);

});