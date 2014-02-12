/* from firmaware conf:
sensors are (indexed from zero):
humidity
temperature
light
ultrasound
Dallas one wire devices
*/

app.controller('TriggersController', ['$scope', '$http', 'Triggers', 'triggerTransformer', 'MAX_TRIGGER', function($scope, $http, Triggers, triggerTransformer, MAX_TRIGGER) {

    $scope.timers = [[], []];

    var DISABLED_TRIGGER = {t_since:-1, t_until:-1, on_value:-256, off_value:-512, sensor:-1, output:-1};

    //TODO delete, keep only in transofrmer service
    var FAN_OUTPUT = 3,
        SENSOR_TEMP = 0,
        SENSOR_HUMIDITY = 1;

    var FAN_TRIGGERS = ['temperatureOptimal', 'humidityOptimal', 'fanInterval', 'fanCritical'];

    FAN_TRIGGERS.forEach(function(key) {
        $scope[key] = triggerTransformer.createEmpty(key);
    });
    $scope.loading = true;

    function timeToMinutes(val) {
        var t = val.split(':');
        return parseInt(t[0], 10)*60+parseInt(t[1], 10);
    }

    function serializeTriggers() {
        //todo magic constants for outputs
        var triggers = [];

        FAN_TRIGGERS.forEach(function(key) {
            var trigger = triggerTransformer.pack($scope[key]);
            if (trigger) {
                triggers.push(trigger);
            }
        });

        //TODO as transformer
        $scope.timers.forEach(function(ranges, output) {
            ranges.forEach(function(range) {
                if (range.since === range.until) return;
                triggers.push({
                    t_since: timeToMinutes(range.since),
                    t_until: timeToMinutes(range.until),
                    on_value:"-256",
                    off_value:"-512",
                    sensor: -1,
                    output: output
                });
            });
        });

        for (var i = triggers.length; i < MAX_TRIGGER; i++) {
            triggers.push(DISABLED_TRIGGER);
        }
        triggers.forEach(function(trigger, i) {
            trigger.index = i;
        });

        return triggers;
    }

    $scope.toggleSentinel = function(sentinel) {
        sentinel.active = !sentinel.active;
    };

    function handleTriggerLoad(t) {
        u = triggerTransformer.unpack(t);
        if (u) {
            $scope[u.triggerClass] = u;
            return;
        }
    }

    $scope.saveTriggers = function() {
        if ($scope.saving) return;
        $scope.saving = true;

        var triggers = serializeTriggers();

        Triggers.save(triggers, function() {
            $scope.saving = false;
        });
    };

    Triggers.loadAll(function(triggers) {
        triggers.forEach(function(trigger) {
            handleTriggerLoad(trigger);
        });
        $scope.loading = false;
    });
}]);

app.controller('TimerController', ['$scope', function($scope) {
    var ranges = $scope.$parent.timer;

    $scope.addRange = function() {
        ranges.push({
            since: '00:00',
            until: '00:00'
        });
    };

    $scope.removeRange = function(idx) {
        ranges.splice(idx, 1);
    };
}]);