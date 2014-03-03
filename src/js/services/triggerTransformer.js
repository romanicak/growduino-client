(function() {

app.factory('triggerTransformer', ['SENSORS', 'OUTPUTS', function(SENSORS, OUTPUTS) {

    var FAN_OUTPUT = OUTPUTS.indexOf('Fan'),
        SENSOR_TEMP = SENSORS.indexOf('Temp1'),
        SENSOR_HUMIDITY = SENSORS.indexOf('Humidity');

    function sensorRangeUnpack(sensor, t) {
        if (sensor == t.sensor && (t.t_since == -1 && t.t_until === 0)) {
            if (t.off_value.indexOf('!') === -1) {
                return {
                    off: parseInt(t.off_value.substring(1), 10) / 10,
                    on: parseInt(t.on_value.substring(1), 10) / 10
                };
            }
        }
        return null;
    }

    function sensorRangePack(sensor, u) {
        if (!$.isNumeric(u.on) || !$.isNumeric(u.off)) return null;
        var on = parseInt(u.on * 10, 10),
            off = parseInt(u.off * 10, 10);
        return {t_since: -1, t_until:0, on_value: ">"+on, off_value:"<"+off, sensor: sensor, output: FAN_OUTPUT};
    }

    function sensorRangeCreateEmpty() {
        return {on: null, off: null};
    }

    function createSensorTransformer(sensor) {
        return {
            unpack: function(t) {
                return sensorRangeUnpack(sensor, t);
            },
            pack: function(u) {
                return sensorRangePack(sensor, u);
            },
            createEmpty: sensorRangeCreateEmpty
        };
    }

    var transformers = {
        'tempBelow': {
            unpack: function(t) {
                if (t.off_value.indexOf('!') !== -1 && t.sensor === SENSOR_TEMP && t.output === FAN_OUTPUT) {
                    return {
                        temperature: parseInt(t.off_value.substring(1), 10) / 10
                    };
                }
                return null;
            },
            pack: function(u) {
                if (!$.isNumeric(u.temperature)) return null;
                var val = parseInt(u.temperature * 10, 10);
                return {t_since:-1, t_until:0, on_value: ">"+val, off_value: "<"+val+"!", sensor: SENSOR_TEMP, output: FAN_OUTPUT};
            },
            createEmpty: function() {
                return { temperature: null };
            }
        },
        'inactiveFor': {
            unpack: function(t) {
                if (t.output == FAN_OUTPUT && (t.t_since == -1 && t.t_until === 0) && t.on_value[0] === 'T' && t.off_value[0] === 'T') {
                    return {
                        duration: parseInt(t.off_value.substring(1), 10),
                        after: parseInt(t.on_value.substring(1), 10)
                    };
                }
                return null;
            },
            pack: function(u) {
                if (!$.isNumeric(u.after) || !$.isNumeric(u.duration)) return null;
                return {t_since: -1, t_until: 0, on_value: "T"+u.after, off_value:"T"+u.duration, sensor:-1, output: FAN_OUTPUT};
            },
            createEmpty: function() {
                return { duration: null, after: null };
            }
        },
        'humidityOver': createSensorTransformer(SENSOR_HUMIDITY),
        'tempOver': createSensorTransformer(SENSOR_TEMP),
        'timer': {
            unpack: function(t) {
                if (t.t_since !== -1 && t.t_until !== -1 && t.on_value === ">-256" && t.off_value === "<-512" && t.sensor === -1) {
                    return {
                        since: utils.minutesToTime(t.t_since),
                        until: utils.minutesToTime(t.t_until),
                        output: t.output
                    };
                }
                return null;
            },
            pack: function(u) {
                if (!u.since || !u.until) return null;
                return {
                    t_since: utils.timeToMinutes(u.since),
                    t_until: utils.timeToMinutes(u.until),
                    on_value: ">-256",
                    off_value: "<-512",
                    sensor: -1,
                    output: u.output,
                };
            },
            createEmpty: function() {
                return { since: '00:00', until: '00:00'};
            }
        },
        'manualOn': {
            unpack: $.noop,
            pack: function(u) {
                 return transformers['timer'].pack({since: '00:00', until: '24:00', output: u.output});
            },
            createEmpty: function() {
                return {};
            }
        }
    };

    return {
        createEmpty: function(triggerClass) {
            u = transformers[triggerClass].createEmpty();
            u.triggerClass = triggerClass;
            return u;
        },
        unpack: function(trigger) {
            for (var key in transformers) {
                var u = transformers[key].unpack(trigger);
                if (u) {
                    if (key === 'timer' && trigger.t_since === 0 && trigger.t_until === 1440) {
                        key = 'manualOn';
                    }
                    u.triggerClass = key;
                    u.trigger = trigger;
                    console.log('trigger #'+trigger.index+' recognized: ' + key);
                    return u;
                }
            }
            return null;
        },
        pack: function(obj) {
            var tClass = obj.triggerClass;
            return transformers[obj.triggerClass].pack(obj);
        }
    };
}]);

})();