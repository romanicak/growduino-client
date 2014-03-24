define(['app', 'async'], function(app, async) {

/* from firmaware conf:
sensors are (indexed from zero):
humidity
temperature
light
ultrasound
Dallas one wire devices
*/

app.controller('TriggersController', ['$scope', '$http', '$timeout', 'Trigger', 'SensorStatus', 'ClientConfig', 'OUTPUTS',
    function($scope, $http, $timeout, Trigger, SensorStatus, ClientConfig, OUTPUTS) {

    var triggerCount = null;

    $scope.loading = true;
    $scope.loadingStep = 0;
    $scope.loadingPercent = 0;

    $scope.relays = [];

    var triggerClasses = {
        'Fan': ['temp1LowDisallow', 'temp1High', 'humidityHigh', 'inactiveFor'],
        'Humidifier':  ['humidityLow'],
        'Heating': ['temp1Low']
    };

    OUTPUTS.forEach(function(output, i) {
        var triggers = {};

        function createEmpty(key) {
            var t = Trigger.create(key);
            t.active = false;
            t.output = i;
            triggers[key] = t;
        }

        (triggerClasses[output] || []).forEach(createEmpty);

        $scope.relays.push({
            name: output,
            index: i,
            intervals: [],
            triggers: triggers
        });
    });

    function createDisabledTrigger(index) {
        return {t_since:-1, t_until:-1, on_value: "<-256", off_value:">-512", sensor:-1, output:-1, index: index};
    }

    function serializeTriggers() {
        var modified = [], deleted = [], created = [], unmodified = [], inactive = [];

        function pack(u, relay) {
            var raw = u.pack();
            //console.log(u.triggerClass, u, raw);
            if (u.triggerClass == 'manualOn') {
                if (!relay.manualOn) raw = null;
            } else if (relay.off || relay.manualOn || !u.active) {
                if (raw !== null) {
                    raw.active = u.active;
                    inactive.push(raw);
                }
                raw = null;
            }

            if (!u.origin) {
                if (raw) created.push(raw);
            } else {
                if (raw) {
                    //console.log('Comparing', u.origin, raw);
                    if (utils.deepCompare(u.origin, raw)) {
                        unmodified.push(raw);
                    } else {
                        modified.push(raw);
                    }
                } else {
                    deleted.push(u.origin);
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
                pack(u, r);
            });
            for (var tc in r.triggers) {
                pack(r.triggers[tc], r);
            }
        });

        while (created.length) {
            var t = created.pop();
            t.index = deleted.length ? deleted.pop().index : getUnusedId();
            modified.push(t);
        }

        var usedIds = modified.concat(unmodified).map(function(t) { return t.index; });

        while (deleted.length) {
            modified.push(createDisabledTrigger(deleted.pop().index));
        }

        return {
            modified: modified,
            inactive: inactive,
            usedIds: usedIds
        };
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
        };
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
                Trigger.save(ser.modified, function() { done(); /*do not pas err arg */ });
                //console.log('Saving ', ser.modified); done();
            });
        }

        steps.push(function(done) {
            var saveData = getInactiveRelays();
            saveData.triggers = ser.inactive;
            if (settings.fastTriggerLoad) {
                saveData.usedTriggers = ser.usedIds;
            }
            ClientConfig.save(saveData, function() { done(); /*do not pas err arg */ });
            //console.log('Saving ', saveData); done();
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
        var u = Trigger.create('timer');
        u.active = true;
        u.output = relay.index;
        relay.intervals.push(u);
    };

    $scope.toggleInterval = function(relay, idx) {
        var interval = relay.intervals[idx];
        if (interval.origin) {
            interval.active = !interval.active;
        } else {
            relay.intervals.splice(idx, 1);
        }
    };

    $scope.relayTurnOff = function(relay) {
        relay.off = !relay.off;
        if (relay.off) relay.manualOn = false;
    };

    $scope.relayManualOn = function(relay) {
        relay.manualOn= !relay.manualOn;
        var rt = relay.triggers;
        if (relay.manualOn) {
            relay.off = false;
            if (!rt.manualOn) {
                rt.manualOn = Trigger.create('manualOn');
                rt.manualOn.output = relay.index;
            }
            rt.manualOn.active = true;
        } else {
            if (rt.manualOn) rt.manualOn.active = false;
        }
    };

    SensorStatus.get(function(data) {
        triggerCount = data.triggers; //keep variable on contoller to use in getUnusedId!
        if (settings.triggerLimit) {
            triggerCount = Math.min(triggerCount, settings.triggerLimit);
        }

        $scope.loadingStep = 0;
        $scope.stepCount = triggerCount + 1;

        var usedTriggers = null;

        function step() {
            $scope.loadingStep += 1;
            $scope.loadingPercent = parseInt($scope.loadingStep / $scope.stepCount * 100, 10);
        }

        function processTrigger(raw) {
            u = Trigger.unpack(raw);
            if (u) {
                var relay = $scope.relays[u.output];
                if (relay) {
                    if (u.triggerClass === 'timer' || (u.triggerClass === 'manualOn' && !relay.manualOn)) {
                        relay.intervals.push(u);
                    } else {
                        relay.triggers[u.triggerClass] = u;
                    }
                } else {
                    console.warn('Loaded trigger for undefined output '+ u.output);
                    return null;
                }
            }
            return u;
        }

        function parseConfig(data) {
            (data.triggers || []).forEach(function(trigger) {
                var u = processTrigger(trigger);
                if (u) {
                    u.active = !!trigger.active;
                    delete u.origin;
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
            if (settings.fastTriggerLoad) {
                usedTriggers = data.usedTriggers;
            }
            if (!usedTriggers) {
                usedTriggers = [];
                for (var i = 0; i < triggerCount; i++) usedTriggers.push(i);
            }
        }

        var cfg = ClientConfig.get();
        cfg.$promise.finally(function() {
            parseConfig(cfg || {});
            step();
            Trigger.loadMany(usedTriggers, function(raw) {
                    step();
                    var u = processTrigger(raw);
                    if (u) u.active = true;
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

});