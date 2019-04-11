app.factory('Relay', ['Trigger', 'utils', function(Trigger, utils){
    var Relay = function(){};

    Relay.prototype.dayDisabled = function(){
	return (!this.triggers["temp1HighTimer_day"].active 
		&& !this.triggers["humidityHighTimer_day"].active
		&& !this.triggers["cO2HighTimer_day"].active
		&& !this.triggers["inactiveForTimer_day"].active);
    }
    
    Relay.prototype.nightDisabled = function(){
	return (!this.triggers["temp1HighTimer_night"].active 
		&& !this.triggers["humidityHighTimer_night"].active
		&& !this.triggers["cO2HighTimer_night"].active
		&& !this.triggers["inactiveForTimer_night"].active);
    }

    Relay.prototype.initTrigger = function(triggerData, triggerIndex) {
	var trigger = Trigger.unpack(triggerData);
	var triggerClass = trigger.triggerClass;
	var fanDayNightTriggerClasses = ['temp1HighTimer', 'humidityHighTimer', 'cO2HighTimer', 'inactiveForTimer'];
	if (this.name == 'Fan' && fanDayNightTriggerClasses.indexOf(triggerClass) != -1){//je tam schvalne vetsi nez 0, protoze triggerClass 'Timer' chci nechat beze zmeny
	    if (trigger.since == this.day.since && trigger.until == this.day.until){
		var timeName = 'day';
	    } else {
		var timeName = 'night';
	    }
	    triggerClass = trigger.triggerClass = trigger.triggerClass + "_" + timeName;
	}
	if (triggerClass === 'timer'){
	    this.intervals.push(trigger);
	} else if (triggerClass === 'manualOn'){
	    this.permOnTrigger = trigger;
	    this.setPermOn();
	    this.permStatusSaved();
	} else {
	    var existingTrigger = this.triggers[triggerClass];
	    if (existingTrigger){
	    	existingTrigger.update(trigger);
	    } else {
		this.triggers[triggerClass] = trigger;
	    }
	    trigger = this.triggers[triggerClass];
	}
	trigger.active = (triggerData.active != Relay.FIRM_ACTIVITY_PERM_OFF);
	trigger.index = triggerIndex;
    }

  Relay.prototype.getReleasedIndexes = function(){
  	var result = [];
  	this.getTriggersAndIntervals().forEach(function(trig) {
	    if (trig.isReleased()){
    		result.push(trig.index);
	    }
	  });
	  if (this.permOnTrigger != null && this.permOnTrigger.index > -1 
		    && !this.isPermOn()){
	    result.push(this.permOnTrigger.index);
	  }
	  return result;
  }

  Relay.prototype.prepareSave = function() {
  	if (this.name == 'Fan'){
	    for (var triggerName in this.triggers){
    		if (triggerName.indexOf("_") != -1){
	  	    var trig = this.triggers[triggerName];
	        var timeName = trig.triggerClass.split("_")[1];
	        var timeLimits = this[timeName];
	        trig.since = timeLimits.since;
	        trig.until = timeLimits.until;
	    	}
      }
	  }
	  this.getTriggersAndIntervals().forEach(function(trig) {
	    var activity = (this.isPermOn() ? Relay.FIRM_ACTIVITY_PERM_OFF : this.getFirmwareActivityCode(trig));
	    trig.prepareSave(activity);
	  }, this);
	  if (this.isPermOn()){
	    this.permOnTrigger.prepareSave(Relay.FIRM_ACTIVITY_PERM_ON);
	  }
  }

    Relay.prototype.useSlotIndex = function(index) {
	var used = false;
	this.getTriggersAndIntervals().forEach(function(trig) {
	    if (!used && trig.useSlotIndex(index)){
		used = true;
	    }
	});
	if (used){
	    return true;
	}
	if (this.isPermOn()){
	    return this.permOnTrigger.useSlotIndex(index);
	}
	return false;
    }

  //ulozi triggery a vrati indexy vsech ulozenych triggeru
  Relay.prototype.saveTriggers = function(outerCallback) {
	  var usedIndexes = [];
	  this.getTriggersAndIntervals().forEach(
	    function(trig){
		    if (trig.index > -1 && ! trig.isReleased()){
		      usedIndexes.push(trig.index);
		    }
	    }
	  );
	  if (this.isPermOn()){
	    usedIndexes.push(this.permOnTrigger.index);
	  }
	  //ulozit vsechny nereleasle triggery
	  var relay = this;
	  async.series([
	    function(callback){
	      async.forEachSeries(relay.getTriggersAndIntervals(),
	        function(trig, innerCallback){
	          trig.saveTrigger(innerCallback);
	        }, function(err){
		        callback();
		      });
	      },
	      function(callback){
		      if (relay.isPermOn()){
		        relay.permOnTrigger.saveTrigger(callback);
		      } else {
		        callback();
		      }
	      },
	      function(callback){
		      outerCallback();
		      callback();
	      }
	    ]);
	  this.permStatusSaved();
	  return usedIndexes;
  }

    Relay.prototype.deletePermOnTrigger = function(callback){
	this.permOnTrigger.deleteTrigger(callback);
	this.permOnTrigger = null;
    }

    Relay.prototype.getTriggersAndIntervals = function(){
	var result = [];
	Array.prototype.push.apply(result, this.intervals);
	for (var trig in this.triggers){
	    result.push(this.triggers[trig]);
	}
	return result;
    }

    Relay.prototype.getTrigger = function(name){
	if (this.triggers[name] == null){
	    var splitName = name.split('_')[0];
  	    var t = Trigger.create(splitName);
	    t.triggerClass = name;
	    t.active = false;
	    t.output = this.outputIndex;
	    this.triggers[name] = t;
	}
	return this.triggers[name];
    }

    Relay.prototype.addInterval = function(){
	var u = Trigger.create('timer');
	u.active = true;
	u.output = this.outputIndex;
	this.intervals.push(u);
    }

    Relay.prototype.toggleInterval = function(index){
	var interval = this.intervals[index];
	interval.active = !interval.active;
    }

    Relay.prototype.permStatusSaved = function() {
	this.savedPermStatus = this.permStatus;
    }

    Relay.prototype.permStatusSaveNeeded = function(){
	return this.savedPermStatus != this.permStatus;
    }

    Relay.prototype.setPermStatus = function(status){
	this.permStatus = status;
	//puvodni implementace je silene zmatena; treba poradne otestit
	//!!!JE TREBA ZJISTIT, CO SE MA STAT S INTERVALAMA, KDYZ SE
	//setne nejaka hodnota perm statusu (ON nebo OFF)!!!
    }

    Relay.prototype.setPermOn = function(){
	this.setPermStatus(Relay.PERM_ON);
	if (this.permOnTrigger == null){
	    this.permOnTrigger = Trigger.create('manualOn');
	    this.permOnTrigger.output = this.outputIndex;
	    this.permOnTrigger.active = true;
	}
    }

    Relay.prototype.isPermOn = function(){
	return this.permStatus == Relay.PERM_ON;
    }

    Relay.prototype.setPermOff = function(){
	this.setPermStatus(Relay.PERM_OFF);
    }

    Relay.prototype.isPermOff = function(){
	return this.permStatus == Relay.PERM_OFF;
    }

    Relay.prototype.setPermAuto = function(){
	this.setPermStatus(Relay.AUTO);
    }

    Relay.prototype.isPermAuto = function(){
	return this.permStatus == Relay.AUTO;
    }

    Relay.prototype.getFirmwareActivityCode = function(trig){
	if (this.isPermOn()){
	    return Relay.FIRM_ACTIVITY_PERM_ON;
	} else if (this.isPermOff()){
	    return Relay.FIRM_ACTIVITY_PERM_OFF;
	} else {
	    if (trig.active){
	        return Relay.FIRM_ACTIVITY_AUTO;
	    } else {
		return Relay.FIRM_ACTIVITY_PERM_OFF;
	    }
	}
    }

    $.extend(Relay, {
	PERM_ON: 1,
	PERM_OFF: 2,
	AUTO: 3,
	FIRM_ACTIVITY_PERM_ON: 2,
	FIRM_ACTIVITY_PERM_OFF: 0,
	FIRM_ACTIVITY_AUTO: 1,

	create: function(output, i){
	    var result = new Relay();
	    result.name = output.name;
	    result.partial = output.partial;
	    result.outputIndex = i;
	    result.permStatus = Relay.AUTO;
	    result.savedPermStatus = Relay.AUTO;
	    result.intervals = [];
	    result.triggers = {};
	    result.permOnTrigger = null;
	    if (result.name == 'Fan'){
		result.day = {since: null, until: null};
		result.night = {since: null, until: null};
	    }


	    //nasledujici property jsou provizorni
	    /*result.manualOn = true;
	    result.manualOnSaved = true;
	    result.off = true;
	    result.offSaved = true;*/

	    return result;
        }
    });

    return Relay;
}]);
