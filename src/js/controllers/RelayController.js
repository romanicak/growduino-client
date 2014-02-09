app.controller('RelayController', ['$scope', 'OUTPUTS', 'Relay', function($scope, OUTPUTS, Relay) {

    function arrayFromMask (nMask) {
        // nMask must be between -2147483648 and 2147483647
        if (nMask > 0x7fffffff || nMask < -0x80000000) { throw new TypeError("arrayFromMask - out of range"); }
        for (var nShifted = nMask, aFromMask = []; nShifted; aFromMask.push(Boolean(nShifted & 1)), nShifted >>>= 1);
        aFromMask.reverse(); //mask sent reversed from backend
        return aFromMask;
    }

    $scope.relays = [];
    Relay.get(function(d) {
        var states = arrayFromMask(d.currentState);
        OUTPUTS.forEach(function(name, i) {
            $scope.relays.push({
                name: name,
                state: states[i]
            });
        });
    });
}]);