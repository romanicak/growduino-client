define(['app'], function(app) {

app.controller('RelayController', ['$scope', 'OUTPUTS', 'Relay', function($scope, OUTPUTS, Relay) {

    $scope.loaded = false;

    function arrayFromMask(nMask) {
        // nMask must be between -2147483648 and 2147483647
        if (nMask > 0x7fffffff || nMask < -0x80000000) { throw new TypeError("arrayFromMask - out of range"); }
        for (var nShifted = nMask, aFromMask = []; nShifted; aFromMask.push(Boolean(nShifted & 1)), nShifted >>>= 1);
        return aFromMask;
    }

    $scope.relays = [];
    Relay.get(function(d) {
        var states = arrayFromMask(d.currentState);
        OUTPUTS.forEach(function(output, i) {
            $scope.relays.push({
                name: output.name,
                state: states.length > i ? states[i] : false
            });
        });

        $scope.history = [];
        for (var i = 0; i < d.history.length-1; i++) {
            var curr = arrayFromMask(d.history[i].state),
                prev = arrayFromMask(d.history[i+1].state),
                relays = [];

            for (var j = 0; j < curr.length; j++) {
                if (curr[j] !== prev[j]) {
                    var name = OUTPUTS[j] ? OUTPUTS[j].name : ''+j;
                    relays.push({ name: name, on: curr[j]});
                }
            }

            $scope.history.push({
                when: d.history[i].when,
                relays: relays
            });
        }

        $scope.loaded = true;
    });
}]);

});