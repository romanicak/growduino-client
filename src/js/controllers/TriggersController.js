/* from firmaware conf:
sensors are (indexed from zero):
humidity
temperature
light
ultrasound
Dallas one wire devices
*/

app.controller('TriggersController', ['$scope', '$http', 'MAX_TRIGGER', function($scope, $http, MAX_TRIGGER) {

    $scope.timers = [[], []];

    $scope.rangeSentinels = [
        {name: 'temperature', unit: '°C', from: null, to: null, active: false, sensor: 0}, //temp
        {name: 'humidity', unit: "%", from: null, to: null, active: false, sensor: 1} //humidity
    ];
    var fan = $scope.fan = {after: null, duration: null, active: false};

    var DISABLED_TRIGGER = {t_since:-1, t_until:-1, on_value:-256, off_value:-512, sensor:-1, output:-1};
    var FAN_OUTPUT = 3;
    var RANGE_TRIGGERS = 4; //system triggers

    function createRangeTrigger(sensor, output, on, off) {
        return {t_since: -1, t_until:0, on_value: ">"+on, off_value:"<"+off, sensor: sensor, output: output};
    }

    function timeToMinutes(val) {
        var t = val.split(':');
        return parseInt(t[0], 10)*60+parseInt(t[1], 10);
    }

    function serializeTriggers() {
        //todo magic constants for outputs
        var triggers = [];

        //min temperature guard
        var tempRange = $scope.rangeSentinels[0];
        if (tempRange.active) {
            var val = parseInt(tempRange.from * 10, 10);
            triggers.push({t_since:-1, t_until:0, on_value: ">"+val, off_value: "<"+val+"!", sensor: tempRange.sensor, output: FAN_OUTPUT});
        } else {
            triggers.push(DISABLED_TRIGGER);
        }

        $scope.rangeSentinels.forEach(function(range) {
            if (range.active) {
                triggers.push(createRangeTrigger(range.sensor, FAN_OUTPUT, parseInt(range.to * 10, 10), parseInt(range.from * 10, 10)));
            } else {
                triggers.push(DISABLED_TRIGGER);
            }
        });
        if (fan.active) {
            triggers.push({t_since: -1, t_until: 0, on_value: "T"+fan.after, off_value:"T"+fan.duration, sensor:-1, output: FAN_OUTPUT});
        } else {
            triggers.push(DISABLED_TRIGGER);
        }

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

        return triggers;
    }

    $scope.toggleSentinel = function(sentinel) {
        sentinel.active = !sentinel.active;
    };

    $scope.saveTriggers = function() {
        if ($scope.saving) return;
        $scope.saving = true;

        var triggers = serializeTriggers();
        console.log(triggers);


        //todo resource service?
        var q = async.queue(function(trigger, done) {
            $http.post('/triggers/'+trigger.index+'.jso', trigger.data).finally(done);
        }, 1);
        q.drain = function() {
            $scope.saving = false;
        };

        for (var i = 0; i < triggers.length; i++) {
            q.push({
                index: i,
                data: triggers[i]
            });
        }
    };

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