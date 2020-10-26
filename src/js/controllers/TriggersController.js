app.controller('RelayController', ['$scope', function($scope) {
}]);
app.controller('TriggerController', ['$scope', function($scope) {
    $scope.init = function(relay, name) {
	//if (name != 'temp3HighDisallow')
        $scope.t = relay.getTrigger(name);
    };

    $scope.toggle = function() {
        $scope.t.active = !$scope.t.active;
    };
}]);

app.controller('TriggersController', ['$scope', '$http', '$timeout', 'utils', 'Relay', 'Trigger', 'ClientConfig', 'FanConfig', 'settings',
    function($scope, $http, $timeout, utils, Relay, Trigger, ClientConfig, FanConfig, settings) {

    $scope.relays = [];
    $scope.relaysHash = {};
    $scope.showInvalids = false;

    settings.outputs.forEach(function(output, i) {
        var relay = Relay.create(output, i);
        $scope.relays.push(relay);
	$scope.relaysHash[output["name"]] = relay;
    });

//New Loading:
//Loadovat az pote, co byla inicializovana vsechna rele
    var slots = utils.newArray(Trigger.LENGTH, -1),
	clientConfigData = {};

    $scope.loadingMessage = 'Loading triggers';
    $scope.loading = true;
    $scope.loadingStep = 0;
    $scope.loadingPercent = 0;

    ClientConfig.get().then(function(cfg) {
	    clientConfigData = cfg;
    	$scope.stepCount = clientConfigData.usedTriggers ? clientConfigData.usedTriggers.length : 0;

      //prectu z configu, ktera rele jsou permOff
      (clientConfigData.permOffRelays || []).forEach(function(relay) {
          $scope.relaysHash[relay].setPermOff();
          $scope.relaysHash[relay].permStatusSaved();
      });

      //prectu z configu data o casech relatka Fan
      if (clientConfigData.fanTimesInfo != null){
          var fan = $scope.relaysHash['Fan'];
          fan.day.since = clientConfigData.fanTimesInfo[0] == -1 ? "00:00" : utils.minutesToTime(clientConfigData.fanTimesInfo[0]);
          fan.day.until = clientConfigData.fanTimesInfo[0] == -1 ? "00:00" : utils.minutesToTime(clientConfigData.fanTimesInfo[1]);
          fan.night.since = clientConfigData.fanTimesInfo[2] == -1 ? "00:00" : utils.minutesToTime(clientConfigData.fanTimesInfo[2]);
          fan.night.until = clientConfigData.fanTimesInfo[2] == -1 ? "00:00" : utils.minutesToTime(clientConfigData.fanTimesInfo[3]);
      }

      //prectu z configu, ktere triggery musim cist; postupne je ctu
      async.forEachSeries(clientConfigData.usedTriggers || [],
          function(triggerIndex, callback) {
              var triggerData = Trigger.loadRaw(triggerIndex, 
                  function(triggerData) {
                    //podle indexu poznam, ke kteremu rele patri
                      var relay = $scope.relays[triggerData.output];
                if (relay){
                              //reknu rele, inicializuj trigger(rawTrigger) 
                          relay.initTrigger(triggerData, triggerIndex);
              slots[triggerIndex] = relay.outputIndex;
                } else {
                          console.warn('Loaded trigger for undefined output ' + triggerData);
                }
          $scope.loadingStep += 1;
          $scope.loadingPercent = parseInt($scope.loadingStep / $scope.stepCount * 100, 10);
            }, callback
        );
          }, function (err){
        $scope.loading = false;
      });
    });

    FanConfig.get().then(function(fanCfg) {
        var fan = $scope.relaysHash['Fan'];

        if (fanCfg.controls != null) {
            if (fanCfg.ec_fan_enable) {
                fan.setPermEc();
            }
            fan.ec = fanCfg;
        } else {
            /*fan.ec = {
                ec_fan_enable: false,
                min_power: 0,
                max_power: 255,
                controls: {
                    day: {
                        start: 0,
                        end: 719
                    },
                    night: {
                        start: 720,
                        end: 1439
                    }
                }
            };*/
            fan.ec = {
                ec_fan_enable: false,
                min_power: 0,
                max_power: 255,
                controls: {
                    day: {
                        start: 0,
                        end: 719,
                        temp: [ {
                            sensor_value: 1,
                            power_pct: 2
                        }, {
                            sensor_value: 3,
                            power_pct: 4
                        }], 
                        humidity: [ {
                            sensor_value: 11,
                            power_pct: 12
                        }, {
                            sensor_value: 13,
                            power_pct: 14
                        }],
                        co2: [ {
                            sensor_value: 21,
                            power_pct: 22
                        }, {
                            sensor_value: 23,
                            power_pct: 24
                        }]
                    },
                    night: {
                        start: 720,
                        end: 1439,
                        temp: {
                        },
                        humidity: {
                        },
                        co2: {
                        }
                    }
                }
            };
        }
        prepareEcDisp(fan.ec);
    });

    function prepareEcDisp(ec) {
        $scope.ecDisp = {};
        $scope.ecDisp.max_power_pct = Math.floor( ( ec.max_power * 100 ) / 255 );
        $scope.ecDisp.controls = {};
        $scope.ecDisp.controls.day = {};
        $scope.ecDisp.controls.day.temp = ec.controls.day.temp;
        $scope.ecDisp.controls.day.humidity = ec.controls.day.humidity;
        $scope.ecDisp.controls.day.co2 = ec.controls.day.co2;
    }

//New Saving:
  function findAvailableSlotIndex(){
	  var result = slots.indexOf(-1);
	  if (result != -1){
	    return result;
	  }
    alert('Too many triggers!'); throw 'Too many triggers!';
  }

  $scope.saveTriggers = function(){
	  var invalidInputs = document.getElementsByClassName("ng-invalid");
	  if (invalidInputs.length != 0){
		  var invalidInput = invalidInputs[1];//invalidInputs[0] is the save button itself
		  invalidInput.scrollIntoView(true);
		  invalidInput.focus();
		  $scope.showInvalids = true;
		  return;
	  }

	  $scope.saving = true;

	  $scope.relays.forEach(function(r) {
	    r.prepareSave();
	  });
	  //vyzadat od kazdeho rele indexy uz nepouzitych triggeru
	  $scope.relays.forEach(function(r) {
	    r.getReleasedIndexes().forEach(function(index) {
		    slots[index] = -1;
	    });
	  });
	  //pridelit kazdemu rele indexy pro nove pouzite triggery
	  $scope.relays.forEach(function(r) {
	    do {
	    	//zjistit vhodny volny index anebo zarvat, pokud zadny neexistuje
		    var availIndex = findAvailableSlotIndex();
	    	//dat ho relatku, at ho pouzije, jestli chce
		    var indexUsed = r.useSlotIndex(availIndex);
		    if (indexUsed){
		      slots[availIndex] = r.outputIndex;
		    }
	    } while (indexUsed);//pokud ho pouzilo, zopakovat
	  });
	  //ulozit do clientConfigu info o permaDisabled relatkach
	  var permOffRelays = [];
	  $scope.relays.forEach(function(r) {
	    if (r.isPermOff()){
		    permOffRelays.push(r.name);
	    }
	  });
	  //ulozit do clientConfigu info o casech relatka Fan
	  var fan = $scope.relaysHash['Fan'];
	  var fanTimesInfo = [
	    fan.day.since === null ? -1 : utils.timeToMinutes(fan.day.since),
	    fan.day.since === null ? 0 : utils.timeToMinutes(fan.day.until),
	    fan.night.since === null ? -1 : utils.timeToMinutes(fan.night.since),
	    fan.night.since === null ? 0 : utils.timeToMinutes(fan.night.until),
	  ];
	  var usedTriggers = [];
	  async.series([
	    function(callback){
	      //zavolat na kazdem rele save
	      async.forEachSeries($scope.relays,
	        function(r, innerCallback){
	          Array.prototype.push.apply(usedTriggers, r.saveTriggers(innerCallback));
	        }, function(err){
			      callback();
	        });
	    },
	    function(callback){
		    //je-li treba, prepsat permOn trigger prazdnym stringem
		    async.forEachSeries($scope.relays,
		      function(r, innerCallback){
			      if (r.permOnTrigger != null){
			        var relayPermOnTriggerIndex = r.permOnTrigger.index;
			        if (relayPermOnTriggerIndex > -1 
					      && slots[relayPermOnTriggerIndex] == -1){
				        r.deletePermOnTrigger(innerCallback);
			        } else {
				        innerCallback();
			        }
			      } else {
			        innerCallback();
			      } 
		      }, function(err){
			      callback();
		      });
	    },
	    function(callback){
	      //prozkoumat, jestli je treba clientConfig ukladat, a prip. ulozit
	      if (!utils.deepCompare(permOffRelays, clientConfigData.permOffRelays)
		        || !utils.deepCompare(usedTriggers, clientConfigData.usedTriggers)
			      || !utils.deepCompare(fanTimesInfo, clientConfigData.fanTimesInfo)){
	            clientConfigData.permOffRelays = permOffRelays;
	            clientConfigData.usedTriggers = usedTriggers;
		          clientConfigData.fanTimesInfo = fanTimesInfo;
		          $http.post('client.jso', clientConfigData).success(function(){
			          callback();
		          });
	        } else {
		        callback();
		      }
	    },
	    function(callback){
		    $scope.saving = false;
	      $scope.saveSuccess = true;
		    $timeout(function() {
		      $scope.saveSuccess = false;
		    }, 2000);
		    callback();
	    }
	  ]);
  };

    $scope.editEc = function(relay){
        relay.setPermEc();
        $scope.showEditEcWindow = true;
    }

    $scope.addEcPair = function(array) {
        array.push({
            sensor_value: "",
            power_pct: ""
        });
    }

    $scope.close_edit_ec_window = function() {
        $scope.showEditEcWindow = false;
    }

    $scope.submit_ec_form = function() {
      //zkonvertit data z ecDisp do ec,
        /*$scope.ecDisp = {};
        $scope.ecDisp.max_power_pct = Math.floor( ( ec.max_power * 100 ) / 255 );
        $scope.ecDisp.controls = {};
        $scope.ecDisp.controls.day = {};
        $scope.ecDisp.controls.day.temp = ec.controls.day.temp;
        $scope.ecDisp.controls.day.humidity = ec.controls.day.humidity;
        $scope.ecDisp.controls.day.co2 = ec.controls.day.co2;*/

        var fan = $scope.relaysHash['Fan'];
      //ulozit jako FanConfig
		    $http.post('fanconfig.jso', fan.ec).success(function() {
            $scope.close_edit_ec_window();
        });
    }

}]);
