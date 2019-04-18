app.controller('RelayDataController', ['$scope', '$interval', 'settings', 'RelayData', 'OutputsData', 'utils', '$rootScope', '$http', function($scope, $interval, settings, RelayData, OutputsData, utils, $rootScope, $http) {

  historyData = {};

  function arrayFromMask(nMask) {
    // nMask must be between -2147483648 and 2147483647
    if (nMask > 0x7fffffff || nMask < -0x80000000) { throw new TypeError("arrayFromMask - out of range"); }
    for (var nShifted = nMask, aFromMask = []; nShifted; aFromMask.push(Boolean(nShifted & 1)), nShifted >>>= 1);
    return aFromMask;
  }

  function parseOutputsData(d) {
    console.log("parseOutputsData", d);
    /* toto plni info o aktualnim stavu relatek; nevidim, jak to z OutputsData vycist, takze komentim
	  var states = arrayFromMask(d.currentState);
	  $scope.relays = [];
	  settings.outputs.forEach(function(output, i) {
	    $scope.relays.push({
		    name: output.name,
		    state: states.length > i ? states[i] : false
	    });
	  });*/

	  var days = [];

	  for (var i = 0; i < d.history.length; i++) {
	    var curr = d.history[i].state,
		  relays = [];

	    for (var j = 0; j < curr.length; j++) {
        var index = parseInt(curr[j].output);
        var name = settings.outputs[index] ? settings.outputs[index].name : ''+index;
        relays.push({ name: name, on: curr[j].state });
	    }

	    var when = d.history[i].when,
		    whenDay = moment(when).startOf('day'),
		    lastDay = days[days.length-1];

	    var item = {
		    when: when,
		    relays: relays,
		    show: d.history[i].show
	    };
	    if (! d.history[i].show){
		    console.log("not showing item for ", when.format("HH:mm"));
	    }

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

  function parseRelaysData(d){
    console.log("parseRelaysData", d);
	  var states = arrayFromMask(d.currentState);
	  $scope.relays = [];
	  settings.outputs.forEach(function(output, i) {
	    $scope.relays.push({
		    name: output.name,
		    state: states.length > i ? states[i] : false
	    });
	  });

    //cela tahle metoda parseRelaysData je asi urcena ku smazani
    //ted ji ale jeste pouziju k nacitani aktualniho stavu rele
    //toto nacitani se deje vyse, nize se nacita historie zmen,
    //ktera je nove v parseOutputsData
    return;

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
		    relays: relays,
		    show: d.history[i].show
	    };
	    if (! d.history[i].show){
		    console.log("not showing item for ", when.format("HH:mm"));
	    }

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

  //toto rozhoduje, zda moment when spada do hodinoveho intervalu
  //zacinajiciho v daytime
  function isWithinHour(when, daytime){
	  var diff = when.diff(daytime, 'minutes');
	  if (when.isBefore(daytime) || diff > 60){
	    console.log("Filtering out datum for " + when.format("YYYY/MM/DD HH:mm,") + "diff: " + diff + ", daytime: " + daytime.format("YYYY/MM/DD HH:mm"));
	    return false;
	  } else {
	    console.log("Keeping datum for " + when.format("YYYY/MM/DD HH:mm,") + "diff: " + diff + ", daytime: " + daytime.format("YYYY/MM/DD HH:mm"));
	    return true;
	  }
  }

  //toto zpracovava jeden zaznam; porovnava, zda spadaji
  //do patricneho casoveho intervalu a podle vysledku porovnani
  //je bud prida nebo neprida do historyData, coz je vysledne pole,
  //ktere se zobrazi
  function filterHistoryDatum(when, datum, daytime, show){
	  if (! daytime || isWithinHour(when, daytime)){
	    historyData.history.push({
	      when: when,
	      state: datum,
	      show: show
	    });
	  }
  }

  //toto zpracovava data z jednoho souboru
  function historyDataLoaded(data, daytime){
	  //console.log("Daytime: ", daytime);
	  var prevDt = undefined;
	  var prevState = undefined;
	  //console.log(historyData);
    var minTS = undefined;
	  for (var ts in data.state){
	    var when = moment.unix(ts);
      if (minTS == undefined || minTS > ts) minTS = ts;
      filterHistoryDatum(when, data.state[ts], daytime, true);
	  }
    filterHistoryDatum(moment.unix(minTS).subtract({'seconds': 1}), data.initial, null, false);
  }

  //toto je basically rekurzivni: zvenku se to vola pouze s firstFileIndex = 0
  //pokud soubor (viz url na prvnim radku metody) je nalezen, zavola se
  //tato metoda rekurzivne znovu s vyssim firstFileIndex; cela tato opicka
  //je tam kvuli tomu, ze je treba vzdy pockat, az se soubor nahraje
  //
  //jedno volani teto metody nahraje data z jednoho souboru a zavola s nimi
  //historyDataLoaded
  function loadHistoryData(urlPrefix, firstFileIndex, daytime, outerCallback){
	  var url = urlPrefix + firstFileIndex + ".jso";
	  $http.get(url, {headers: {'Cache-Control': 'no-cache', 'Pragma': 'no-cache'}, cache: false}).then(
	    function successCallback(data){
		    //console.log(url + " loaded succesfully");
		    //console.log(data);
		    if (firstFileIndex == 0 && daytime){
			    historyData.history.push({
				    when: moment(daytime).startOf('day'),
				    state: data.data.initial ? data.data.initial: 0,
				    show: false
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
      OutputsData.get(function(d){
        parseOutputsData(d);
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
