app.factory('Trigger', ['$http', '$q', 'requests', 'settings', 'utils', function($http, $q, requests, settings, utils) {

    var patterns = [
        ['LowDisallow', { off: {important: true, op: '<', val: '*'}}],
        ['HighDisallow', { off: {important: true, op: '>', val: '*'}}],
        ['InactiveFor', { since: null, on: {op: 'T', val: '*'}, off: {op: 'T', val: '*'}}],
        ['High', { since: null, on: {op: '>', val: '*'}, off: {op: '<', val: '*'}}],
        ['LowNoStopTimer', { since: '**:**', until: '**:**', on: {op: '<', val: '*'}, off: {op: '<', val: Number.NEGATIVE_INFINITY}}],
        ['LowTimer', { since: '**:**', until: '**:**', on: {op: '<', val: '*'}, off: {op: '>', val: '*'}}],
        ['Low', { since: null, on: {op: '<', val: '*'}, off: {op: '>', val: '*'}}],
        ['ManualOn', { since: '00:00', until: '24:00', on: {op: '>', val: Number.NEGATIVE_INFINITY}, off: {op: '<', val: Number.NEGATIVE_INFINITY}, sensor: null}],
        ['Timer', { since: '**:**', until: '**:**', on: {op: '>', val: Number.NEGATIVE_INFINITY}, off: {op: '<', val: Number.NEGATIVE_INFINITY}, sensor: null}]
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
        return null;
    }

    function getSensorDivisor(sensorIndex) {
        var sensor = settings.sensors[sensorIndex];
        if (sensor) {
            return sensor.divisor;
        } else {
            console.warn('Storing value for undeclared sensor: '+sensorIndex);
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

    Trigger.prototype.pack = function() {
        if (!this.match(this.triggerClass)) return null;
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
        if (this.index !== null) raw.index = this.index;
        return raw;
    };

    function matchPattern(obj, pattern) {
        for (var key in pattern) {
            var p = pattern[key], v = obj[key];
            if ($.isPlainObject(p)) {
                if (!matchPattern(v, p)) return false;
            } else {
                if (p === '**:**' || p === '*') {
                    if (v === null || $.type(v) === 'undefined') return false;
                    if (v === Number.NEGATIVE_INFINITY) return false;
                } else {
                    if (v != p) return false;
                }
            }
        }
        return true;
    }

    Trigger.prototype.match = function(pattern) {
        if ($.type(pattern) === 'string') {
            pattern = findPattern(pattern).pattern;
        }
        return matchPattern(this, pattern);
    };

    Trigger.prototype.getName = function() {
        for (var i = 0; i < patterns.length; i++) {
            if (this.match(patterns[i][1])) {
                var name = (this.sensor !== null ? settings.sensors[this.sensor].resource : '') + patterns[i][0];
                return name[0].toLowerCase() + name.substring(1);
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

        save: function(triggers, success)  {
            if (!triggers.length) {
                success();
                return;
            }

            var last;
            triggers.forEach(function(trigger) {
                last = requests.push(function() {
                    var index = trigger.index;
                    console.log('Trigger #'+index+' saved', trigger);
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
            //console.log('Created', t);
            return t;
        },

        unpack: function(raw) {
            var t = new Trigger();
            t.unpack(raw);
            t.triggerClass = t.getName();
            return t;
        }
    });

    return Trigger;
}]);