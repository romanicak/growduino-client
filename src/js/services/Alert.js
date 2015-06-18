app.factory('Alert', ['$http', 'utils', 'Relay', function($http, utils, Relay) {

    var Alert = function() {
        this.on_message = '';
	this.off_message = '';
        this.target = null;
        this.trigger = null;
    };

    Alert.prototype.pack = function(){
	if (this.target === null && this.on_message === ""
		&& this.off_message === ""){
	    return null;
	} else {
	    return {
		on_message: this.on_message,
		off_message: this.off_message,
		target: this.target
	    };
	}
    }

    Alert.prototype.prepareSave = function(){
	var activity = this.getFirmwareActivityCode();
	if (this.name !== "powerDown"){
	    this.trigger.off.val = this.trigger.on.val;
	    this.trigger.prepareSave(activity);
	}
	this.actualPack = this.pack();
	if (this.actualPack){
	    this.actualPack.active = activity;
	}
    };

    Alert.prototype.getReleasedIndexes = function(){
	if (this.index != undefined && this.actualPack == null){
	    return this.index;
	} else {
	    return -1;
	}
    };

    Alert.prototype.useSlotIndex = function(freeIndex, triggerFreeIndex){
	if (this.actualPack == null) return false;
	if (this.index == undefined){
	    this.index = freeIndex;
	    if (this.trigger){
	    	this.trigger.useSlotIndex(triggerFreeIndex);
		this.actualPack.trigger = triggerFreeIndex;
	    } else {
		this.actualPack.trigger = -2;
	    }
	    return true;
	} else {
	    if (this.trigger){
	        this.actualPack.trigger = this.trigger.index;
	        return false;
	    }
	}
    };

    Alert.prototype.save = function(asyncCallback){
	var alert = this;
	if (this.index > -1){
	    if (!utils.deepCompare(this.actualPack, this.origin)){
		console.log("Saving alert");
		console.log("ACTUAL:");
		console.log(this.actualPack);
		console.log("ORIGIN:");
		console.log(this.origin);
		async.series([
		    function(callback) {
	        	$http.post('/alerts/'+alert.index+'.jso', alert.actualPack).success(function(data) {
			    callback();
			});
		    },
		    function(callback) {
	    	        if (alert.trigger){
			    console.log("Calling save trigger");
			    alert.trigger.saveTrigger(asyncCallback);
	    	        } else {
			    console.log("Not calling save trigger, have no trigger");
			    console.log(alert.trigger);
			    callback();
			    asyncCallback();
		        }
		    }
		], function(err){});
	    } else {
		if (alert.trigger){
		    console.log("Calling save trigger 2");
		    alert.trigger.saveTrigger(asyncCallback);
		} else {
		    console.log("Not calling save trigger2");
	   	    console.log(this.trigger);
		    asyncCallback();
		}
	    }
	    return this.index;
	} else {
	    asyncCallback();
	    return -1;
	}
    };

    Alert.prototype.getFirmwareActivityCode = function() {
	if (this.active){
	    return Relay.FIRM_ACTIVITY_AUTO;
	} else {
	    return Relay.FIRM_ACTIVITY_PERM_OFF;
	}
    };

    $.extend(Alert, {
        createDisabled: function(index) {
             return {on_message: "", off_message: "", target: "", trigger: -1, index: index};
        },

        loadMany: function(alertIndexes, alertLoaded, success) {
            if (alertIndexes.length === 0) {
                success();
                return;
            }
            var q = async.queue(function(index, done) {
                $http.get('/alerts/'+index+'.jso', {cache: false}).success(function(data) {
                    console.log('alert #'+index+' loaded', data);
                    data.index = index;
                    alertLoaded(data);
                }).finally(done);
            }, 1);
            q.drain = function() {
                if ($.isFunction(success)) success();
            };

            alertIndexes.forEach(function(index) {
                q.push(index);
            });
        },

	loadRaw: function(index, loadedCallback, asyncCallback) {
	    var loadedData = $http.get('/alerts/' + index + '.jso', {cache: false}).success(function(data) {
		if (data.trigger > -1){
		    var loadedTrigger = $http.get('/triggers/' + data.trigger + '.jso', {cache: false}).success(function(triggerData) {
		    	asyncCallback();
		    	data.triggerData = triggerData;
		    	loadedCallback(data);
		    });
		} else {
		    asyncCallback();
		    loadedCallback(data);
		}
	    });
	},

        save: function(alerts, success)  {
            if (!alerts.length) {
                success();
                return;
            }
            var q = async.queue(function(alert, done) {
                var index = alert.index;
                console.log('Alert #'+index+' saved', alert);
                $http.post('/alerts/'+index+'.jso', alert).finally(done);
            }, 1);
            q.drain = function() {
                success();
            };
            alerts.forEach(function(alert) {
                q.push(alert);
            });
        },

	saveInactive: function(alerts, success) {
	    if (!alerts.length) {
		success();
		return;
	    }
	    var q = async.queue(function(alert, done) {
		var index = alert.index;
		console.log('Inactive alert #'+index+' saved', alert);
		$http.post('/alerts/alert'+index+'.jso', alert).finally(done);
	    }, 1);
	    q.drain = function() {
		success();
	    };
	    alerts.forEach(function(alert) {
		q.push(alert);
	    });
	},
    });

    return Alert;
}]);
