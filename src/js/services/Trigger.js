app.factory('Trigger', ['$http', '$q', 'requests', 'settings', 'utils', function($http, $q, requests, settings, utils) {

    var patterns = [
        ['LowDisallow', { off: {important: true, op: '<', val: '*'}}],
        ['HighDisallow', { off: {important: true, op: '>', val: '*'}}],
        ['InactiveFor', { since: null, on: {op: 'T', val: '*'}, off: {op: 'T', val: '*'}}],
        ['InactiveForTimer', { since: '**:**', until: '**:**', on: {op: 'T', val: '*'}, off: {op: 'T', val: '*'}}],
        ['High', { since: null, on: {op: '>', val: '*'}, off: {op: '<', val: '*'}}],
        ['LowNoStopTimer', { since: '**:**', until: '**:**', on: {op: '<', val: '*'}, off: {op: '<', val: Number.NEGATIVE_INFINITY}}],
        ['LowTimer', { since: '**:**', until: '**:**', on: {op: '<', val: '*'}, off: {op: '>', val: '*'}}],
        ['HighTimer', { since: '**:**', until: '**:**', on: {op: '>', val: '*'}, off: {op: '<', val: '*'}}],
        ['Low', { since: null, on: {op: '<', val: '*'}, off: {op: '>', val: '*'}}],
        ['ManualOn', { since: '00:00', until: '24:00', on: {op: '<', val: Number.NEGATIVE_INFINITY}, off: {op: '>', val: Number.NEGATIVE_INFINITY}, sensor: null}],
        ['Timer', { since: '**:**', until: '**:**', on: {op: '<', val: Number.NEGATIVE_INFINITY}, off: {op: '>', val: Number.NEGATIVE_INFINITY}, sensor: null}]
    ];

    function findPattern(triggerClass) {
        var lowered = triggerClass.toLowerCase();
        for (var i = 0; i < patterns.length; i++) {
            if (patterns[i][0].toLowerCase() === lowered) {
                return {
                    pattern: patterns[i][1],
                    sensor: null
                };
            }
            for (var j = 0; j < settings.sensors.length; j++) {
                if ((settings.sensors[j].resource + patterns[i][0]).toLowerCase() === lowered) {
                    return {
                        pattern: patterns[i][1],
                        sensor: j
                    };
                }
            }
        }
	console.warn("No pattern found for " + triggerClass);
        return null;
    }

    function getSensorDivisor(sensorIndex) {
        if (sensorIndex < 0) {
            return 1;
        }
        var sensor = settings.sensors[sensorIndex];
        if (sensor) {
            return sensor.divisor;
        } else {
            console.warn('Value for undeclared sensor: '+sensorIndex);
            return 10;
        }
    }

    function parseCondition(cond, sensorIndex) {
        var val = parseInt(cond.substring(1), 10);
        if (val <= -256) {
            val = Number.NEGATIVE_INFINITY;
        } else {
            if (cond[0] !== 'T') {
                val /= getSensorDivisor(sensorIndex);
            }
        }
        return {
            op: cond[0],
            val: val,
            important: cond.indexOf('!') !== -1
        };
    }

    function packCondition(cond, sensorIndex) {
        var val;
        if (cond.val === Number.NEGATIVE_INFINITY || cond.val === null) {
            val = -512;
        } else {
            if (cond.op === 'T') {
                val = cond.val;
            } else {
                val = parseInt(cond.val * getSensorDivisor(sensorIndex), 10);
            }
        }
        return cond.op + val + (cond.important ? '!' : '');
    }

    function createValue(patternValue) {
        if (patternValue === '**:**') return '00:00';
        if (patternValue === '*') return null;
        return patternValue;
    }

    var Trigger = function() {
        this.since = null;
        this.until = null;
        this.on = {op: null, val: null, important: false};
        this.off = {op: null, val: null, important: false};
    };

    Trigger.prototype.unpack = function(raw) {
        this.since = raw.t_since === -1 ? null : utils.minutesToTime(raw.t_since);
        this.until = raw.t_since === -1 ? null : utils.minutesToTime(raw.t_until); //if since is null until must null too regardless on value
        this.on = parseCondition(raw.on_value, raw.sensor);
        this.off = parseCondition(raw.off_value, raw.sensor);
        this.sensor = raw.sensor === -1 ? null : raw.sensor;
        this.output = raw.output;
        if (raw.index !== null) this.index = raw.index;
        this.origin = raw;
    };

    Trigger.prototype.pack = function(strict) {
        if (!this.match(this.triggerClass.split('_')[0], strict)) return null;
	if (this.triggerClass === 'timer') {
	    if (this.since === "00:00" && this.until === "00:00") {
 		return null;
	    }
	}
        if (this.off.important) {
            //in ui no field for off value, it should have same value as on val
            this.on = { val: this.off.val, op: this.off.op === '<' ? '>' : '<', important: false};
        }
        raw = {
            t_since: this.since === null ? -1 : utils.timeToMinutes(this.since),
            t_until: this.since === null ? 0 : utils.timeToMinutes(this.until),  //since === null -> no range: t_since: -1, t_until: 0
            off_value: packCondition(this.off, this.sensor),
            on_value: packCondition(this.on, this.sensor),
            sensor: this.sensor === null ? -1 : this.sensor,
            output: this.output
        };
        if (this.index !== null && this.index !== undefined) raw.index = this.index;
        return raw;
    };

    //strict -- refuse "" as valid value for "*" and "**:**"
    function matchPattern(obj, pattern, strict) {
        for (var key in pattern) {
            var p = pattern[key], v = obj[key];
            if ($.isPlainObject(p)) {
                if (!matchPattern(v, p, strict)) return false;
            } else {
                if (p === '**:**' || p === '*') {
                    if (v === null || $.type(v) === 'undefined') return false;
                    if (v === Number.NEGATIVE_INFINITY) return false;
		    if (strict && v === "") return false;
                } else {
                    if (v != p) return false;
                }
            }
        }
        return true;
    }

    Trigger.prototype.match = function(pattern, strict) {
        if ($.type(pattern) === 'string') {
            pattern = findPattern(pattern).pattern;
        }
        return matchPattern(this, pattern, strict);
    };

    Trigger.prototype.getName = function() {
        for (var i = 0; i < patterns.length; i++) {
            if (this.match(patterns[i][1])) {
                var name = (this.sensor !== null ? settings.sensors[this.sensor].resource : '') + patterns[i][0];
                return name[0].toLowerCase() + name.substring(1);//tohle jenom zmeni prvni pismeno na lowercase
            }
        }
        return null;
    };

    Trigger.prototype.update = function(t) {
        var keys = Object.keys(t);
        for (var i = 0; i < keys.length; i++) {
            this[keys[i]] = t[keys[i]];
        }
    };

    Trigger.prototype.prepareSave = function(activity) {
	this.actualPack = this.pack(true);
	if (this.actualPack){
	    this.actualPack.active = activity;
	    delete this.actualPack.index;
	}
    };

    //tohle ma vratit true, pokud trigger byl inicializovan ze souboru, ma tudiz index, ale
    //uz ho (ten index) nepotrebuje a tento muze byt recyklovan
    Trigger.prototype.isReleased = function() {
	if (this.index != undefined && this.actualPack == null){
	    return true;
	} else {
	    return false;
	}
    };

    //pokud trigger nebyl inicializovan ze souboru, a tudiz nema index, ale je nove pouzit,
    //a tudiz index potrebuje, priradi si index predany co parametr a vrati true
    //jinak vrati false
    Trigger.prototype.useSlotIndex = function(freeIndex) {
	if (this.index == undefined && this.actualPack != null){
	    this.index = freeIndex;
	    return true;
	}
	return false;
    };

    //pokud ( trigger neni released && zmenil se ), ulozit
    //pokud ( neni released ) vratit jeho index, jinak -1
    //TODO:
    Trigger.prototype.saveTrigger = function(asyncCallback) {
	if (this.index > -1){
	    if (this.origin && this.origin.index){
	        delete this.origin.index;//hack, ktery resi prave objeveny bug (loadnu stranku s alertama, nic nezmenim, dam save; vsechny triggery se preulozi)
	    			     //zpusobeno je to tim, ze v origin je pritomen 'index', zatimco v actualPack neni. Uz netusim, jestli je v tom origin
				     //k necemu dobry.
	    }
	    if (!utils.deepCompare(this.actualPack, this.origin)){
                console.log('Saving trigger #' + this.index + ", named " + this.triggerClass);
		console.log("Actual:");
	        console.log(this.actualPack);
		console.log("Origin:");
		console.log(this.origin);
		this.origin = this.actualPack;
                $http.post('/triggers/' + this.index + '.jso', this.actualPack).success(function(){
		    asyncCallback();
		});
	    } else {
		//console.log("No need to save trigger #" + this.index);
		//console.log("Actual:");
		//console.log(this.actualPack);
		//console.log("Origin:");
		//console.log(this.origin);
		asyncCallback();
	    }
	    return this.index;
	} else {
	    //console.log("Not saving trigger #" + this.index);
	    asyncCallback();
	    return -1;
	}
    };

    Trigger.prototype.deleteTrigger = function(asyncCallback) {
	var temp = Trigger.createDisabled(0);
	temp.active = 0;
	delete temp.index;
	$http.post('/triggers/' + this.index + '.jso', temp).success(function(){
	    asyncCallback();
	});
    };

    var triggerCount = settings.triggerCount - settings.alertLimit;
    if (settings.triggerLimit) {
        triggerCount = Math.min(triggerCount, settings.triggerLimit);
    }

    $.extend(Trigger, {
        LENGTH: triggerCount,

        createDisabled: function(index) {
            return {t_since:-1, t_until:-1, on_value: "<-256", off_value:">-512", sensor:-1, output:-1, index: index};
        },

        loadMany: function(triggerIndexes, triggerLoaded, success) {
            if (triggerIndexes.length === 0) {
                success();
                return;
            }

            var last;
            triggerIndexes.forEach(function(index) {
                last = requests.push(function() {
                    return $http.get('/triggers/'+index+'.jso', {cache: false}).success(function(data) {
                        console.log('trigger #'+index+' loaded', data);
                        data.index = index;
                        triggerLoaded(data);
                    });
                });
            });

            if ($.isFunction(success)) {
                last.finally(success);
            }
        },

	loadRaw: function(index, loadedCallback, asyncCallback) {
	    var loadedData = $http.get('/triggers/' + index + '.jso', {cache: false}).success(function(data) {
		loadedCallback(data);
		asyncCallback();
	    });
	},

        save: function(triggers, success)  {
            if (!triggers.length) {
                success();
                return;
            }

            var last;
            triggers.forEach(function(trigger) {
                last = requests.push(function() {
                    var index = trigger.index;
                    //console.log('Trigger #'+index+' saved', trigger);
                    return $http.post('/triggers/'+index+'.jso', trigger);
                });
            });

            if ($.isFunction(success)) {
                last.finally(success);
            }
        },

        create: function(triggerClass) {
            var meta = findPattern(triggerClass),
                p = meta.pattern,
                t = new Trigger();

            t.sensor = meta.sensor;
            for (var key in p) {
                var v = p[key];
                if ($.isPlainObject(v)) {
                    for (var condkey in v) {
                        t[key][condkey] = createValue(v[condkey]);
                    }
                } else {
                    t[key] = createValue(v);
                }
            }
            t.triggerClass = triggerClass;
	    t.active = false;
            return t;
        },

        unpack: function(raw) {
            var t = new Trigger();
            t.unpack(raw);
            var triggerClass = t.getName();
            if (triggerClass) {
                t.triggerClass = triggerClass;
                return t;
            }
            return null;
        }
    });

    return Trigger;
}]);
