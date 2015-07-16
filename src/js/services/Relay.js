app.factory('Relay', ['Trigger', function(Trigger){
    var Relay = function(){};

    Relay.prototype.initTrigger = function(triggerData, triggerIndex) {
	var trigger = Trigger.unpack(triggerData);
	var triggerClass = trigger.triggerClass;
	if (triggerClass === 'timer'){
	    this.intervals.push(trigger);
	} else if (triggerClass === 'manualOn'){
	    this.intervals.push(trigger);
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
	trigger.active = false;
	/*if (triggerData.active == Relay.PERM_OFF){
	    this.setPermOff();
	}*/
	trigger.index = triggerIndex;
    }

    Relay.prototype.prepareSave = function() {
	this.getTriggersAndIntervals().forEach(function(trig) {
	    var activity = this.getFirmwareActivityCode(trig);
	    trig.prepareSave(activity);
	}, this);
    }

    //ulozi triggery a vrati indexy vsech ulozenych triggeru
    Relay.prototype.saveTriggers = function(outerCallback) {
	var usedIndexes = [];
	this.getTriggersAndIntervals().forEach(
	    function(trig){
		if (trig.index > -1){
		    usedIndexes.push(trig.index);
		}
	    }
	);
	//ulozit vsechny nereleasle triggery do souboru, odpovidajicich jejich indexum
	async.forEachSeries(this.getTriggersAndIntervals(),
	    function(trig, innerCallback){
	        trig.saveTrigger(innerCallback);
	    }, function(err){
		outerCallback();
	});
	this.permStatusSaved();
	return usedIndexes;
    }

    Relay.prototype.useSlotIndex = function(index) {
	var stillFree = true;
	this.getTriggersAndIntervals().forEach(function(trig) {
	    if (stillFree && trig.useSlotIndex(index)){
		stillFree = false;
	    }
	});
	if (!stillFree) return true;
	if (this.isPermOn() && this.getTriggersAndIntervals().length == 0){
	    var trig = Trigger.create('manualOn');
	    trig.output = this.outputIndex;
	    trig.active = true;
	    this.triggers['manualOn'] = trig;
	    trig.useSlotIndex(index);
	    return true;
	}
	return false;
    }

    Relay.prototype.getReleasedIndexes = function(){
	var result = [];
	this.getTriggersAndIntervals().forEach(function(trig) {
	    if (trig.isReleased()){
		result.push(trig.index);
		trig.index = undefined;
	    }
	});
	return result;
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
  	    var t = Trigger.create(name);
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
	//setne nejaka hodnota!!!
    }

    Relay.prototype.setPermOn = function(){
	this.setPermStatus(Relay.PERM_ON);
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


	    //nasledujici property jsou provizorni
	    result.manualOn = true;
	    result.manualOnSaved = true;
	    result.off = true;
	    result.offSaved = true;

	    return result;
        }
    });

    return Relay;
}]);
