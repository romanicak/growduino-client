/* from firmaware conf:
sensors are (indexed from zero):
humidity
temperature
light
ultrasound
Dallas one wire devices
*/

app.controller('TriggersController', ['$scope', '$http', '$timeout', 'Triggers', 'triggerTransformer', 'SensorStatus', 'ClientConfig', 'OUTPUTS',
    function($scope, $http, $timeout, Triggers, triggerTransformer, SensorStatus, ClientConfig, OUTPUTS) {

    var triggerCount = null;

    $scope.loading = true;
    $scope.loadingStep = 0;
    $scope.loadingPercent = 0

    $scope.relays = [];

    OUTPUTS.forEach(function(output, i) {
        var triggers = {};

        if (output == 'Fan') {
            ['tempBelow', 'tempOver', 'humidityOver', 'inactiveFor'].forEach(function(key) {
                var t = triggerTransformer.createEmpty(key);;
                t.active = false;
                triggers[key] = t;
            });
        }

        $scope.relays.push({
            name: output,
            index: i,
            intervals: [],
            triggers: triggers
        })
    });

    function createDisabledTrigger(index) {
        return {t_since:-1, t_until:-1, on_value: "<-256", off_value:">-512", sensor:-1, output:-1, index: index};
    }

    function serializeTriggers() {
        var modified = [], deleted = [], created = [], unmodified = [], inactive = [];

        function pack(u, relay) {
            //TODO relay enabled

            var trigger = triggerTransformer.pack(u);
            if (u.triggerClass == 'manualOn') {
                if (!relay.manualOn) trigger = null;
            } else if (relay.off || relay.manualOn || !u.active) {
                if (trigger != null) {
                    trigger.active = u.active;
                    inactive.push(trigger);
                }
                trigger = null;
            }

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
            for (var i = 0; i < triggerCount; i++) {
                if (containsIndex(modified, i)) continue;
                if (containsIndex(unmodified, i)) continue;
                return i;
            }
        }

        $scope.relays.forEach(function(r) {
            r.intervals.forEach(function(u) {
                pack(u, r)
            });
            for (tc in r.triggers) {
                pack(r.triggers[tc], r);
            }
        });

        while (created.length) {
            var t = created.pop();
            t.index = deleted.length ? deleted.pop().index : getUnusedId();
            modified.push(t);
        }

        while (deleted.length) {
            modified.push(createDisabledTrigger(deleted.pop().index));
        }

        return {
            modified: modified,
            inactive: inactive
        }
    }

    function getInactiveRelays() {
        var disabledRelays = [], manualOnRelays = [];
        $scope.relays.forEach(function(r) {
            if (r.off) {
                disabledRelays.push(r.name);
            }
            if (r.manualOn) {
                manualOnRelays.push(r.name);
            }
        });
        return {
            disabledRelays: disabledRelays,
            manualOnRelays: manualOnRelays
        }
    }

    $scope.toggleTrigger = function(trigger) {
        trigger.active = !trigger.active;
    };

    $scope.saveTriggers = function() {
        if ($scope.saving) return;
        $scope.saving = true;

        var ser = serializeTriggers(),
            steps = [];

        if (ser.modified.length) {
            steps.push(function(done) {
                Triggers.save(ser.modified, function() { done(); /*do not pas err arg */ });
            });
        }

        steps.push(function(done) {
            var saveData = getInactiveRelays();
            saveData.triggers = ser.inactive;
            ClientConfig.save(saveData, function() { done(); /*do not pas err arg */ });
        });

        async.series(steps, function() {
            $scope.relays.forEach(function(r) {
                for (var i = 0; i < r.intervals.length; i++) {
                    if (!r.intervals[i].active) {
                        r.intervals.splice(i, 1);
                    }
                }
            });
            $scope.saving = false;
            $scope.saveSuccess = true;
            $timeout(function() {
                $scope.saveSuccess = false;
            }, 2000);
        });
    };

    $scope.addInterval = function(relay) {
        var u = triggerTransformer.createEmpty('timer');
        u.active = true;
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
        var rt = relay.triggers;
        if (relay.manualOn) {
            relay.off = false;
            if (!rt.manualOn) {
                rt.manualOn = triggerTransformer.createEmpty('manualOn');
                rt.manualOn.output = relay.index;
            }
            rt.manualOn.active = true;
        } else {
            if (rt.manualOn) rt.manualOn.active = false;
        }
    }

    SensorStatus.get(function(data) {
        triggerCount = data.triggers; //store variable for getUnusedId
        //triggerCount = 8; // debug

        $scope.loadingStep = 0
        $scope.stepCount = triggerCount + 1;

        function step() {
            $scope.loadingStep += 1;
            $scope.loadingPercent = parseInt($scope.loadingStep / $scope.stepCount * 100, 10);
        }

        function processTrigger(trigger) {
            u = triggerTransformer.unpack(trigger);
            if (u) {
                var relay = $scope.relays[u.trigger.output];
                if (u.triggerClass === 'timer' || (u.triggerClass === 'manualOn' && !relay.manualOn)) {
                    relay.intervals.push(u);
                } else {
                    relay.triggers[u.triggerClass] = u;
                }
            }
            return u;
        }

        var cfg = ClientConfig.get(function(data) {
            (data.triggers || []).forEach(function(trigger) {
                var u = processTrigger(trigger)
                if (u) {
                    u.active = !!trigger.active;
                    delete u.trigger;
                }
            });
            (data.disabledRelays || []).forEach(function(relayName)  {
                $scope.relays.forEach(function(r) {
                    if (r.name === relayName) {
                        r.off = true;
                    }
                });
            });
            (data.manualOnRelays || []).forEach(function(relayName)  {
                $scope.relays.forEach(function(r) {
                    if (r.name === relayName) {
                        r.manualOn = true;
                    }
                });
            });
        });

        cfg.$promise.finally(function() {
            step();
            Triggers.loadAll(triggerCount,
                function(trigger) {
                    step();
                    var u = processTrigger(trigger);
                    if (u) {
                        u.active = true;
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


    });
}]);