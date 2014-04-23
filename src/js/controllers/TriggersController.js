app.controller('TriggerController', ['$scope', function($scope) {
    $scope.init = function(relay, name) {
        $scope.t = relay.getTrigger(name);
    };

    $scope.toggle = function() {
        $scope.t.active = !$scope.t.active;
    };
}]);

app.controller('TriggersController', ['$scope', '$http', '$timeout', 'utils', 'Trigger', 'ClientConfig', 'settings',
    function($scope, $http, $timeout, utils, Trigger, ClientConfig, settings) {

    $scope.loadingMessage = 'Loading triggers';
    $scope.loading = true;
    $scope.loadingStep = 0;
    $scope.loadingPercent = 0;

    $scope.relays = [];

    settings.outputs.forEach(function(output, i) {
        var relay = {
            name: output.name,
            partial: output.partial,
            index: i,
            intervals: [],
            triggers: {},

            getTrigger: function(name) {
                if (this.triggers[name]) return this.triggers[name];

                var t = Trigger.create(name);
                t.active = false;
                t.output = i;
                this.triggers[name] = t;
                return t;
            }
        };
        $scope.relays.push(relay);
    });

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
            for (var i = 0; i < Trigger.LENGTH; i++) {
                if (containsIndex(modified, i)) continue;
                if (containsIndex(unmodified, i)) continue;
                return i;
            }
            //TODO
            alert('Too many triggers!');
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
            modified.push(Trigger.createDisabled(deleted.pop().index));
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
                //clear dirty flags
                r.offSaved = r.off;
                r.manualOnSaved = r.manualOn;
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

    $scope.relayAuto = function(relay) {
        if (relay.off) $scope.relayTurnOff(relay);
        if (relay.manualOn) $scope.relayManualOn(relay);
    }

    $scope.loadingStep = 0;
    $scope.stepCount = Trigger.LENGTH + 1;

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
                    var exists = relay.triggers[u.triggerClass];
                    if (exists) {
                        exists.update(u); //updated needed because TriggerController already refs existing record in it's scope
                        u = exists;
                    } else {
                        relay.triggers[u.triggerClass] = u;
                    }
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
                    r.offSaved = true;
                }
            });
        });
        (data.manualOnRelays || []).forEach(function(relayName)  {
            $scope.relays.forEach(function(r) {
                if (r.name === relayName) {
                    r.manualOn = true;
                    r.manualOnSaved = true;
                }
            });
        });
        if (settings.fastTriggerLoad) {
            usedTriggers = data.usedTriggers;
        }
        if (!usedTriggers) {
            usedTriggers = utils.seq(Trigger.LENGTH);
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

}]);