/* from firmaware conf:
sensors are (indexed from zero):
humidity
temperature
light
ultrasound
Dallas one wire devices
*/

app.controller('TriggersController', ['$scope', '$http', 'Triggers', 'triggerTransformer', 'SensorStatus', 'OUTPUTS',
    function($scope, $http, Triggers, triggerTransformer, SensorStatus, OUTPUTS) {

    var FAN_TRIGGERS = ['temperatureOptimal', 'humidityOptimal', 'fanInterval', 'fanCritical'];

    $scope.loading = true;
    $scope.loadingStep = 0;
    $scope.loadingPercent = 0

    $scope.relays = [];

    OUTPUTS.forEach(function(output, i) {
        $scope.relays.push({
            name: output,
            index: i,
            intervals: []
        })
    });

    //TODO remove coupling with controller scope
    FAN_TRIGGERS.forEach(function(key) {
        $scope[key] = triggerTransformer.createEmpty(key);
    });

    function createDisabledTrigger(index) {
        return {t_since:-1, t_until:-1, on_value: "<-256", off_value:">-512", sensor:-1, output:-1, index: index};
    }

    function serializeTriggers() {
        var modified = [], deleted = [], created = [], unmodified = [];

        function pack(u) {
            var trigger = triggerTransformer.pack(u);
            if (!u.trigger) {
                if (trigger) {
                    created.push(trigger);
                }
            } else {
                if (trigger) {
                    trigger.index = u.trigger.index;
                    if (utils.deepCompare(u.trigger, trigger)) {
                        unmodified.push(trigger);
                    } else {
                        modified.push(trigger);
                    }
                } else {
                    deleted.push(u.trigger);
                }
            }
        }

        function containsIndex(arr, idx) {
            for (var i = 0; i < arr.length; i++) {
                if (arr[i].index == idx) {
                    return true;
                }
            }
            return false;
        }

        function getUnusedId() {
            for (var i = 0; i < $scope.triggerCount; i++) {
                if (containsIndex(modified, i)) continue;
                if (containsIndex(unmodified, i)) continue;
                return i;
            }
        }

        FAN_TRIGGERS.forEach(function(key) {
            pack($scope[key]);
        });
        $scope.relays.forEach(function(r) {
            r.intervals.forEach(pack);
        });

        while (created.length) {
            var t = created.pop();
            t.index = deleted.length ? deleted.pop().index : getUnusedId();
            modified.push(t);
        }

        while (deleted.length) {
            modified.push(createDisabledTrigger(deleted.pop().index));
        }

        return modified;
    }

    $scope.toggleSentinel = function(sentinel) {
        sentinel.active = !sentinel.active;
    };

    $scope.saveTriggers = function() {
        if ($scope.saving) return;
        $scope.saving = true;

        Triggers.save(serializeTriggers(), function() {
            //remove objects marked for delete
            $scope.relays.forEach(function(r) {
                for (var i = 0; i < r.intervals.length; i++) {
                    if (!r.intervals[i].active) {
                        r.intervals.splice(i, 1);
                    }
                }
            });
            $scope.saving = false;
        });
    };

    $scope.addInterval = function(relay) {
        var u = triggerTransformer.createEmpty('timer');
        u.output = relay.index;
        relay.intervals.push(u);
    };

    $scope.toggleInterval = function(relay, idx) {
        var interval = relay.intervals[idx];
        if (interval.trigger) {
            interval.active = !interval.active;
        } else {
            relay.intervals.splice(idx, 1);
        }
    };

    $scope.relayTurnOff = function(relay) {
        relay.off = !relay.off;
        if (relay.off) relay.manualOn = false;
    }

    $scope.relayManualOn = function(relay) {
        relay.manualOn= !relay.manualOn;
        if (relay.manualOn) relay.off = false;
    }

    SensorStatus.get(function(data) {
        $scope.triggerCount = data.triggers;
        //$scope.triggerCount = 8; //debug

        Triggers.loadAll($scope.triggerCount,
            function(trigger) {
                $scope.loadingStep += 1;
                $scope.loadingPercent = parseInt($scope.loadingStep / $scope.triggerCount * 100, 10);
                u = triggerTransformer.unpack(trigger);
                if (u) {
                    if (u.triggerClass === 'timer') {
                        $scope.relays[u.trigger.output].intervals.push(u);
                    } else {
                        $scope[u.triggerClass] = u;
                    }
                    return;
                }
            }, function() {
                $scope.loadingPercent = 100;
                $scope.relays.forEach(function(r) {
                    r.intervals.sort(function(a, b) {
                        if (a.since != b.since) {
                            return utils.timeToMinutes(a.since) - utils.timeToMinutes(b.since);
                        } else {
                            return utils.timeToMinutes(a.until) - utils.timeToMinutes(b.until);
                        }
                    });
                });
                $scope.loading = false;
            }
        );
    });
}]);