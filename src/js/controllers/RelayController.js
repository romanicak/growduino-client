app.controller('RelayController', ['$scope', 'Relay', function($scope, Relay) {

    function arrayFromMask (nMask) {
        // nMask must be between -2147483648 and 2147483647
        if (nMask > 0x7fffffff || nMask < -0x80000000) { throw new TypeError("arrayFromMask - out of range"); }
        for (var nShifted = nMask, aFromMask = []; nShifted; aFromMask.push(Boolean(nShifted & 1)), nShifted >>>= 1);
        return aFromMask;
    }

    $scope.relays = [];
    Relay.get(function(d) {
        $scope.relays = arrayFromMask(d.currentState).map(function(state) {
            return { state: state };
        });
    });
}]);