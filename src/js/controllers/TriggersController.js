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

app.controller('TriggersController', ['$scope', '$http', '$timeout', 'utils', 'Relay', 'Trigger', 'ClientConfig', 'settings',
    function($scope, $http, $timeout, utils, Relay, Trigger, ClientConfig, settings) {

    $scope.relays = [];
    $scope.relaysHash = {};

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


//New Saving:
    function findAvailableSlotIndex(){
	var result = slots.indexOf(-1);
	if (result != -1){
	    return result;
	}
        alert('Too many triggers!'); throw 'Too many triggers!';
    }

    $scope.saveTriggers = function(){
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
	var usedTriggers = [];
	async.series([
	    function(callback){
	        //zavolat na kazdem rele save
	        async.forEachSeries($scope.relays,
	            function(r, callback){
	                Array.prototype.push.apply(usedTriggers, r.saveTriggers(callback));
	            }, function(err){
			callback();
	        });
	    },
	    function(callback){
	        //prozkoumat, jestli je treba clientConfig ukladat, a prip. ulozit
	        if (!utils.deepCompare(permOffRelays, clientConfigData.permOffRelays)
		        || !utils.deepCompare(usedTriggers, clientConfigData.usedTriggers)){
	            clientConfigData.permOffRelays = permOffRelays;
	            clientConfigData.usedTriggers = usedTriggers;
		    $http.post('client.jso', clientConfigData).success(function(){
			callback();
		    });
	        }
	    },
	    function(callback){
	        $scope.saveSuccess = true;
		$timeout(function() {
		    $scope.saveSuccess = false;
		}, 2000);
		callback();
	    }
	]);
    };
}]);
