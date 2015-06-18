app.controller('RelayDataController', ['$scope', '$interval', 'settings', 'RelayData', function($scope, $interval, settings, RelayData) {

    $scope.loaded = false;
    console.log("RelayController");

    function arrayFromMask(nMask) {
        // nMask must be between -2147483648 and 2147483647
        if (nMask > 0x7fffffff || nMask < -0x80000000) { throw new TypeError("arrayFromMask - out of range"); }
        for (var nShifted = nMask, aFromMask = []; nShifted; aFromMask.push(Boolean(nShifted & 1)), nShifted >>>= 1);
        return aFromMask;
    }

    function refreshRelays() {
        RelayData.get(function(d) {
            var states = arrayFromMask(d.currentState);
            $scope.relays = [];
            settings.outputs.forEach(function(output, i) {
                $scope.relays.push({
                    name: output.name,
                    state: states.length > i ? states[i] : false
                });
            });

            var days = [];

            for (var i = 0; i < d.history.length-1; i++) {
                var curr = arrayFromMask(d.history[i].state),
                    prev = arrayFromMask(d.history[i+1].state),
                    relays = [];

                //console.log(d.history[i].when.unix(), moment(d.history[i].when).format(), d.history[i], d.history[i+1], curr, prev);

                for (var j = 0; j < Math.max(curr.length, prev.length); j++) {

                    if ((j < curr.length ? curr[j] : false) !== (j < prev.length ? prev[j] : false)) {
                        var name = settings.outputs[j] ? settings.outputs[j].name : ''+j;
                        relays.push({ name: name, on: curr[j]});
                    }
                }

                var when = d.history[i].when,
                    whenDay = moment(when).startOf('day'),
                    lastDay = days[days.length-1];

                var item = {
                    when: when,
                    relays: relays
                };

                if (lastDay && lastDay.when.isSame(whenDay)) {
                    lastDay.items.push(item);
                } else {
                    days.push({
                        when: whenDay,
                        items: [item]
                    });
                }
            }

            $scope.history = days;
            $scope.loaded = true;
        });
    }

    refreshRelays();
    $interval(refreshRelays, 30000);
}]);
