app.factory('Alert', ['$http', function($http) {

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
	if (this.name !== "powerDown"){
	    this.trigger.off.val = this.trigger.on.val;
	    this.trigger.prepareSave();
	}
	this.actualPack = this.pack();
	console.log("Packed");
	console.log(this.actualPack);
    };

    Alert.prototype.getReleasedIndexes = function(){
	if (this.index != undefined && this.actualPack == null){
	    return this.index;
	} else {
	    return -1;
	}
    };

    Alert.prototype.useSlotIndex = function(freeIndex){
	if (this.index == undefined && this.actualPack != null){
	    this.index = freeIndex;
	    return true;
	}
	return false;
    };

    Alert.prototype.save = function(){
	if (this.index > -1){
	    if (!utils.deepCompare(this.actualPack, this.origin)){
	        console.log(this.actualPack);
	        $http.post('/alerts'+this.index+'.jso', this.actualPack);
	    }
	    if (this.trigger){
		this.trigger.saveTrigger();
	    }
	    return this.index;
	} else {
	    return -1;
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
