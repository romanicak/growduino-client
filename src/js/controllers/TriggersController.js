/* from firmaware conf:
sensors are (indexed from zero):
humidity
temperature
light
ultrasound
Dallas one wire devices
*/

app.controller('TriggersController', ['$scope', '$http', 'Triggers', 'triggerTransformer', 'SensorStatus', function($scope, $http, Triggers, triggerTransformer, SensorStatus) {

    $scope.timers = [[], []];

    var FAN_TRIGGERS = ['temperatureOptimal', 'humidityOptimal', 'fanInterval', 'fanCritical'];

    FAN_TRIGGERS.forEach(function(key) {
        $scope[key] = triggerTransformer.createEmpty(key);
    });
    $scope.loading = true;
    $scope.loadingStep = 0;
    $scope.loadingPercent = 0;

    function createDisabledTrigger(index) {
        return {t_since:-1, t_until:-1, on_value: "<-256", off_value:">-512", sensor:-1, output:-1, index: index};
    }

    function serializeTriggers() {
        var modified = [], deleted = [], created = [];

        function pack(u) {
            var trigger = triggerTransformer.pack(u);
            if (!u.trigger) {
                if (trigger) {
                    created.push(trigger);
                }
            } else {
                if (trigger) {
                    trigger.index = u.trigger.index;
                    if (!utils.deepCompare(u.trigger, trigger)) {
                        modified.push(trigger);
                    }
                } else {
                    deleted.push(u.trigger);
                }
            }
        }

        function getUnusedId() {
            for (var i = 0; i < $scope.triggerCount; i++) {
                var used = false;
                for (var j = 0; j < modified.length; j++) {
                    if (modified[j].index == i) {
                        used = true;
                        break;
                    }
                }
                if (!used) return i;
            }
        }

        FAN_TRIGGERS.forEach(function(key) {
            pack($scope[key]);
        });
        $scope.timers.forEach(function(ranges, output) {
            ranges.forEach(pack);
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
            $scope.timers.forEach(function(ranges, output) {
                for (var i = 0; i < ranges.length; i++) {
                    if (!ranges[i].active) {
                        ranges.splice(i, 1);
                    }
                }
            });
            $scope.saving = false;
        });
    };

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
                        $scope.timers[u.trigger.output].push(u);
                    } else {
                        $scope[u.triggerClass] = u;
                    }
                    return;
                }
            }, function() {
                $scope.loadingPercent = 100;
                $scope.timers.forEach(function(ranges) {
                    ranges.sort(function(a, b) {
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

app.controller('TimerController', ['$scope', 'triggerTransformer', function($scope, triggerTransformer) {
    var ranges = $scope.$parent.timer;

    $scope.addRange = function() {
        var u = triggerTransformer.createEmpty('timer');
        u.output = $scope.$parent.$index;
        ranges.push(u);
    };

    $scope.toggleRange = function(idx) {
        if (ranges[idx].trigger) {
            ranges[idx].active = !ranges[idx].active;
        } else {
            ranges.splice(idx, 1);
        }
    };
}]);