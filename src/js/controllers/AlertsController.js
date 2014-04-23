app.controller('AlertController', ['$scope', function($scope) {
    $scope.init = function(name) {
        $scope.alert = $scope.$parent.getAlert(name);
    };

    $scope.toggle = function() {
        $scope.alert.active = !$scope.alert.active;
    };
}]);


app.controller('AlertsController', ['$scope', '$timeout', 'utils', 'Alert', 'Trigger', 'ClientConfig',
    function($scope, $timeout, utils, Alert, Trigger, ClientConfig) {

    $scope.loadingMessage = 'Loading alerts';
    $scope.loading = true;
    $scope.loadingStep = 0;
    $scope.loadingPercent = 0;

    $scope.alerts = {};

    $scope.getAlert = function(name) {
        if ($scope.alerts[name]) return $scope.alerts[name];

        var t = Trigger.create(name);
        t.output = -1;

        var alert = new Alert();
        alert.trigger = t;
        alert.active = false;

        $scope.alerts[name] = alert;
        return alert;
    };

    function serializeAlerts() {
        var alerts = [],
            triggers = [];

        var alertIndex = 0;
            triggerOffset = settings.triggerCount - settings.alertLimit;

        $.each($scope.alerts, function(name, alert) {
            if (alert.active) {
                //alert triggers has off val same to on val
                alert.trigger.off.val = alert.trigger.on.val;
                var t = alert.trigger.pack();
                t.index = triggerOffset+alertIndex;
                triggers.push(t);
                alerts.push({
                    on_message: alert.on_message,
                    off_message: alert.off_message,
                    target: alert.target,
                    trigger: t.index,
                    index: alertIndex
                });
                alertIndex++;
            }
        });

        while (alertIndex < settings.alertLimit) {
            alerts.push(Alert.createDisabled(alertIndex));
            triggers.push(Trigger.createDisabled(triggerOffset+alertIndex));
            alertIndex++;
        }

        return {
            alerts: alerts,
            triggers: triggers
        };
    }

    $scope.saveAlerts = function() {
        if ($scope.saving) return;
        $scope.saving = true;

        var ser = serializeAlerts(),
            steps = [];

        if (ser.triggers.length) {
            steps.push(function(done) {
                Trigger.save(ser.triggers, function() { done(); /*do not pas err arg */ });
                //console.log('Saving T ', ser.triggers); done();
            });
        }
        if (ser.alerts.length) {
            steps.push(function(done) {
                Alert.save(ser.alerts, function() { done(); /*do not pas err arg */ });
                //console.log('Saving A ', ser.alerts); done();
            });
        }

        async.series(steps, function() {
            $scope.saving = false;
            $scope.saveSuccess = true;
            $timeout(function() {
                $scope.saveSuccess = false;
            }, 2000);
        });
    };

    function loadAlerts() {

        function step() {
            $scope.loadingStep += 1;
            $scope.loadingPercent = parseInt($scope.loadingStep / $scope.stepCount * 100, 10);
        }

        //var cfg = ClientConfig.get();
        //cfg.$promise.finally(function() {
        //     step();
        //});

        var loadTasks = [];

        $scope.stepCount = settings.alertLimit * 2;
        Alert.loadMany(utils.seq(settings.alertLimit), function(rawAlert) {
            step(); //one step for alert
            if (rawAlert.trigger === -1) {
                step(); //second for trigger
            } else {
                loadTasks.push(function(done) {
                    Trigger.loadMany([rawAlert.trigger], function(rawTrigger) {
                        u = Trigger.unpack(rawTrigger);
                        if (u) {
                            //console.log(u.triggerClass);
                            var alert = $scope.alerts[u.triggerClass];
                            alert.target = rawAlert.target;
                            alert.on_message = rawAlert.on_message;
                            alert.off_message = rawAlert.off_message;
                            alert.trigger = u;
                            alert.active = true;
                        }
                        step();
                        done();
                    });
                });
            }
        }, function() {
            async.series(loadTasks, function() {
                $scope.loadingPercent = 100;
                $scope.loading = false;
            });
        });
    }

    loadAlerts();
}]);
