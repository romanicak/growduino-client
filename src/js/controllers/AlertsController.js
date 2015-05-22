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

    var remoteAlerts = utils.newArray(settings.alertLimit),
	remoteTriggers = utils.newArray(settings.alertLimit),
	alertSlots = utils.newArray(settings.alertLimit, null),
	remoteCfg = null,
        triggerOffset = settings.triggerCount - settings.alertLimit;

    $scope.getAlert = function(name) {
        if ($scope.alerts[name]) return $scope.alerts[name];

        var alert = new Alert();
        alert.active = false;
        alert.name = name;

        if (name !== 'powerDown') {
            var t = Trigger.create(name);
            t.output = -1;
            alert.trigger = t;
        }

        $scope.alerts[name] = alert;
        return alert;
    };

    function serializeAlert(alert, alertIndex){
	console.log("Serialize alert " + alert.name);
        var triggerIndex;
        if (alert.name === 'powerDown') {
            triggerIndex = -2; //special value for power down
	    if (alert.target == null && alert.on_message == null && alert.off_message == null){
		return null;
	    }
        } else {
            //alert triggers has off val same to on val
            alert.trigger.off.val = alert.trigger.on.val;

            var packedTrigger = alert.trigger.pack(true);
	    if (packedTrigger === null){
		console.log("null trigger");
		return null;
	    } else {
                packedTrigger.index = triggerOffset+alertIndex;
                triggerIndex = packedTrigger.index;
	    }
        }
	if (alert.target === "" && alert.on_message === "" 
			&& alert.off_message === "" && triggerIndex < 0){
	    return null;
	}
	var packedAlert = {
            on_message: alert.on_message,
            off_message: alert.off_message,
            target: alert.target,
            trigger: triggerIndex,
            index: alertIndex
        };
	return {
	    packedAlert: packedAlert,
	    packedTrigger: packedTrigger
	};
    };

    function serializeAlerts() {
        var mRemoteAlerts = utils.newArray(settings.alertLimit),
            mRemoteTriggers = utils.newArray(settings.alertLimit),
	    inactiveAlerts = [],
	    inactiveTriggers = [],
	    modifiedAlerts = [],
	    modifiedTriggers = [],
	    usedAlertIds = [],
	    inactiveAlertIds = [];

	for (var i = 0; i < settings.alertLimit; i++){
	    mRemoteAlerts[i] = remoteAlerts[i];
	    mRemoteTriggers[i] = remoteTriggers[i];
	}

        $.each($scope.alerts, function(name, alert) {
	    var alertIndex = alertSlots.indexOf(alert);
	    if (alertIndex == -1){
		alertIndex = alertSlots.indexOf(null);
		alertSlots[alertIndex] = alert;
	    }
	    var packed = serializeAlert(alert, alertIndex);
	    if (packed !== null){
                if (alert.active) {
                    mRemoteTriggers[alertIndex] = packed.packedTrigger;
                    mRemoteAlerts[alertIndex] = packed.packedAlert;
		    usedAlertIds.push(alertIndex);
                } else {
		    if (packed.packedTrigger != null){
		        inactiveTriggers.push(packed.packedTrigger);
		    }
		    inactiveAlerts.push(packed.packedAlert);
		    inactiveAlertIds.push(alertIndex);
	        }
	    }
        });

	for (var i = 0; i < remoteAlerts.length; i++){
	    if (remoteAlerts[i] != undefined && usedAlertIds.indexOf(i) == -1){
		if (remoteTriggers[i] != undefined){
			mRemoteTriggers[i] = Trigger.createDisabled(triggerOffset + i);
		}
		mRemoteAlerts[i] = Alert.createDisabled(i);
	    }
	}

	for (var i = 0; i < remoteAlerts.length; i++){
	    if (!utils.deepCompare(mRemoteAlerts[i], remoteAlerts[i])){
		console.log("modified alert " + i + ": ");
		console.log(mRemoteAlerts[i]);
		modifiedAlerts.push(mRemoteAlerts[i]);
	    }
	    if (!utils.deepCompare(mRemoteTriggers[i], remoteTriggers[i])){
		console.log("modified trigger " + i + ": ");
		console.log(mRemoteTriggers[i]);
		modifiedTriggers.push(mRemoteTriggers[i]);
	    }
        }

	remoteAlerts = mRemoteAlerts;
	remoteTriggers = mRemoteTriggers;

	return {
	    modifiedAlerts: modifiedAlerts,
	    modifiedTriggers: modifiedTriggers,
	    inactiveAlerts: inactiveAlerts,
	    inactiveTriggers: inactiveTriggers,
	    usedAlertIds: usedAlertIds,
	    inactiveAlertIds: inactiveAlertIds
	};
    }

    $scope.saveAlerts = function() {
        if ($scope.saving) return;
        $scope.saving = true;
	console.clear();

        var ser = serializeAlerts(),
            steps = [];

        if (ser.modifiedTriggers.length) {
            steps.push(function(done) {
		console.log("Saving triggers " + ser.modifiedTriggers + " , length: " + ser.modifiedTriggers.length); 
                Trigger.save(ser.modifiedTriggers, function() { done(); /*do not pass err arg */ });
                //console.log('Saving T ', ser.triggers); done();
            });
        }
        if (ser.modifiedAlerts.length) {
            steps.push(function(done) {
                Alert.save(ser.modifiedAlerts, function() { done(); /*do not pass err arg */ });
                //console.log('Saving A ', ser.alerts); done();
            });
        }
	if (ser.inactiveTriggers.length) {
	    steps.push(function(done) {
		Trigger.saveInactive(ser.inactiveTriggers, function() { done(); /*do not pass err arg */ });
	    });
	}
	if (ser.inactiveAlerts.length) {
	    steps.push(function(done) {
		Alert.saveInactive(ser.inactiveAlerts, function() { done(); /*do not pass err arg */ });
	    });
	}
	steps.push(function(done) {
	    var cfgData = null;
	    if (remoteCfg != null){
		cfgData = remoteCfg;
		cfgData.usedAlerts = [];
	    } else {
		cfgData = {
		    disabledRelays: [],
		    manualOnRelays: [],
		    triggers: [],
		    usedTriggers: []
		};
	    }
	    if (settings.fastTriggerLoad){
	        cfgData.usedAlerts = utils.arrayUnique(ser.usedAlertIds);
		cfgData.inactiveAlertIds = utils.arrayUnique(ser.inactiveAlertIds);
		cfgData.inactiveAlerts = ser.inactiveAlerts;
		cfgData.inactiveAlertTriggers = ser.inactiveTriggers;
		//cfgData.alerts = ser.inactiveAlerts;
	    }
	    /*cfgData.usedAlerts = [];
	    cfgData.inactiveAlertIds = [];
	    cfgData.inactiveAlerts = [];
	    cfgData.inactiveAlertTriggers = [];*/
	    ClientConfig.save(cfgData, function() { done(); });
});

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

        function initAlert(rawAlert, triggerClass) {
            var alert = $scope.alerts[triggerClass];
            alert.target = rawAlert.target;
            alert.on_message = rawAlert.on_message;
            alert.off_message = rawAlert.off_message;
            alert.active = true;
            return alert;
        }

	function parseConfig(data){
	    //napred si nactu rawTriggery do pole, at se mi v nich dobre hleda
	    var rawTriggers = [];
	    (data.inactiveAlertTriggers || []).forEach(function(rawTrigger){
		if (rawTrigger != null && rawTrigger.index != null){
		    rawTriggers[rawTrigger.index] = rawTrigger;
		}
	    });

	    //a ted jednotlive alerty
	    (data.inactiveAlerts || []).forEach(function(rawAlert){
		if (rawAlert.trigger === -2){
		    var alert = initAlert(rawAlert, 'powerDown');
		} else {
		    var trigger = Trigger.unpack(rawTriggers[rawAlert.trigger]);
		    var alert = initAlert(rawAlert, trigger.triggerClass);
		    alert.trigger = trigger;
		}
		alert.active = false;
	    });
	}

	ClientConfig.get().then(function(cfg){
	    remoteCfg = cfg;
	    parseConfig(cfg);
            var loadTasks = [];
	    var usedAlerts = null;
	    if (settings.fastTriggerLoad){
  	        usedAlerts = cfg.usedAlerts;
	    }
	    if (!usedAlerts){
		//usedAlerts = utils.seq(settings.alertLimit + 1);
		usedAlerts = [];
	    }

            //+1 special alert for power down
            $scope.stepCount = settings.alertLimit * 2 + 1;
            Alert.loadMany(usedAlerts, function(rawAlert) {
		if ('index' in rawAlert) {
		    remoteAlerts[rawAlert.index] = rawAlert;
		}
                step(); //one step for alert
                if (rawAlert.trigger === -1) {
                    step(); //second for trigger
                } else {
                    loadTasks.push(function(done) {
                        if (rawAlert.trigger === -2) {
                            initAlert(rawAlert, 'powerDown');
                            step();
                            done();
                        } else {
                            Trigger.loadMany([rawAlert.trigger], function(rawTrigger) {
                                u = Trigger.unpack(rawTrigger);
                                if (u) {
                                    var alert = initAlert(rawAlert, u.triggerClass);
                                    alert.trigger = u;
                                }
			        if ('index' in rawAlert){
				    remoteTriggers[rawAlert.index] = rawTrigger;
				    if (u){
				        alertSlots[rawAlert.index] = alert;
				    }
			        }
                                step();
                                done();
                            });
                        }
                    });
                }
            }, function() {
                async.series(loadTasks, function() {
                    $scope.loadingPercent = 100;
                    $scope.loading = false;
                });
            });
        });
    }

    loadAlerts();
}]);
