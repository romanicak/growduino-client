app.controller('RelayDataController', ['$scope', '$interval', 'settings', 'RelayData', 'utils', '$rootScope', '$http', function($scope, $interval, settings, RelayData, utils, $rootScope, $http) {

    historyData = {};

    function arrayFromMask(nMask) {
        // nMask must be between -2147483648 and 2147483647
        if (nMask > 0x7fffffff || nMask < -0x80000000) { throw new TypeError("arrayFromMask - out of range"); }
        for (var nShifted = nMask, aFromMask = []; nShifted; aFromMask.push(Boolean(nShifted & 1)), nShifted >>>= 1);
        return aFromMask;
    }

    function parseRelaysData(d){
	var states = arrayFromMask(d.currentState);
	$scope.relays = [];
	settings.outputs.forEach(function(output, i) {
	    $scope.relays.push({
		name: output.name,
		state: states.length > i ? states[i] : false
	    });
	});

	var days = [];

	for (var i = 0; i < d.history.length-1; i++) {
	    var curr = arrayFromMask(d.history[i].state),
		prev = arrayFromMask(d.history[i+1].state),
		relays = [];

	    //console.log(d.history[i].when.unix(), moment(d.history[i].when).format(), d.history[i], d.history[i+1], curr, prev);
		//console.log(moment(d.history[i].when).format(), moment(d.history[i+1].when).format());

	    for (var j = 0; j < Math.max(curr.length, prev.length); j++) {
		if ((j < curr.length ? curr[j] : false) !== (j < prev.length ? prev[j] : false)) {
		    var name = settings.outputs[j] ? settings.outputs[j].name : ''+j;
		    relays.push({ name: name, on: curr[j]});
		}
	    }

	    var when = d.history[i].when,
		whenDay = moment(when).startOf('day'),
		lastDay = days[days.length-1];

	    var item = {
		when: when,
		relays: relays
	    };

	    if (lastDay && lastDay.when.isSame(whenDay)) {
		console.log("no push");
		lastDay.items.push(item);
	    } else {
		console.log("push");
		days.push({
		    when: whenDay,
		    items: [item]
	        });
	    }
	}

	$scope.history = days;
	$scope.loadingHistory = false;
    }

    function cancelReload(){
	if ($rootScope.reloadTimer){
		clearInterval($rootScope.reloadTimer);
		delete $rootScope.reloadTimer;
	}
    }

    function setReload(){
	if ($rootScope.reloadTimer){
		return;
	}
	$rootScope.reloadTimer = setInterval(refreshRelays, 30000);
    }


    function loadHistoryData(urlPrefix, firstFileIndex, daytime, outerCallback){
	var url = urlPrefix + firstFileIndex + ".jso";
	$http.get(url, {headers: {'Cache-Control': 'no-cache', 'Pragma': 'no-cache'}, cache: false}).then(
	    function successCallback(data){
		//console.log(url + " loaded succesfully");
		//console.log(data);
		if (firstFileIndex == 0 && daytime){
			historyData.history.push({
				when: daytime,
				state: data.initial ? data.initial: 0
			});
		}
		historyDataLoaded(data.data, daytime);
		async.series([
		    function(callback){
			loadHistoryData(urlPrefix, firstFileIndex + 1, daytime, callback);
		    },
		    function(callback){
			outerCallback();
			callback();
		    }
		]);
   	    },
	    function errorCallback(data){
		//console.log(url + " not loaded");
		outerCallback();
	    }
	);
    }

    function historyDataLoaded(data, daytime){
	//console.log("Daytime: ", daytime);
	var prevDt = undefined;
	var prevState = undefined;
	for (var ts in data.state){
	    var when = moment.unix(ts);
	    var push = true;
	    if (daytime) { 
	    	var diff = when.diff(daytime, 'minutes');
		if (diff < 0 || diff > 60){
		    push = false;
		    //console.log("Filter out datum for " + when.format("YYYY/MM/DD HH:mm,") + "diff: " + diff + ", daytime: " + daytime.format("YYYY/MM/DD HH:mm"));
		    if (diff < 0 && (prevDt == undefined || prevDt.diff(when) < 0)){
			prevDt = when;
			prevState = data.state[ts];
		    }
		} else {
		}
	    }
	    if (push){
	      historyData.history.push({
		  when: when,
		  state: data.state[ts]
	      });
	    }
	}
	if (prevDt !== undefined){
	    console.log("PrevDt: " + prevDt);
	    historyData.history.unshift({
	        when: prevDt,
		state: prevState
	    });
	}
    }

    function loadAndParseHistoryData(urlPrefix, daytime){
	historyData = {};
	historyData.history = [];
	async.series([
	    function(callback){
		loadHistoryData(urlPrefix, 0, daytime, callback);
		//console.log("Load over");
	    },
	    function(callback){
		/*console.log("4 sorting now");
		console.log("!!Checking historyData.history before sorting!!");
		console.log("Length: " + historyData.history.length);
		for (var i = 0; i < historyData.history.length; i++){
		    var hist = historyData.history[i];
		    if (! hist.when){
			console.log("when udefined for index " + i);
			console.log(hist);
		    }
		}*/
		historyData.history.sort(function(a, b){
		    return b.when.valueOf() - a.when.valueOf();
		});
		//console.log("sorting over -- 4 parsing");
		parseRelaysData(historyData);
		//console.log("parse over");
		callback();
	    }
	]);
    }

    function refreshRelays(daytime, zoom, isNow) {
	if (daytime)
		console.log("refreshRelays daytime: ", daytime.format("YYYY/MM/DD HH:mm"), " zone: ", daytime.zone());
	$scope.loadingHistory = true;
	$scope.showMonthMessage = false;
	$scope.history = {};
	cancelReload();
	if (! zoom || (isNow && zoom == 'H')){
	    //console.log("Display now");
            RelayData.get(function(d){
	        parseRelaysData(d);
	    });
	    setReload();
	} else if (zoom == 'H'){
	    //console.log("Display hour");
	    var formattedDaytime = daytime.format("YYYY/MM/DD/");
	    var urlPrefix = "/DATA/OUTPUTS/" + formattedDaytime;
	    loadAndParseHistoryData(urlPrefix, daytime);
	} else if (zoom == 'D'){
	    //console.log("Display day");
	    var formattedDaytime = daytime.format("YYYY/MM/DD/");
	    var urlPrefix = "/DATA/OUTPUTS/" + formattedDaytime;
	    loadAndParseHistoryData(urlPrefix);
	} else {
	    //console.log("Display nothing");
	    $scope.showMonthMessage = true;
	    $scope.loadingHistory = false;
	}
	//console.log("We're done");
    }

    $rootScope.$on('displayedTimeChanged', function(event, datetime, zoom, isNow) {
	refreshRelays(datetime, zoom, isNow);
    });

    //refreshRelays();
}]);
