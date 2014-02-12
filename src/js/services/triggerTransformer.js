(function() {

var FAN_OUTPUT = 3,
    SENSOR_TEMP = 0,
    SENSOR_HUMIDITY = 1;

function sensorRangeUnpack(sensor, t) {
    if (sensor == t.sensor && (t.t_since == -1 && t.t_until === 0)) {
        if (t.off_value.indexOf('!') === -1) {
            return {
                from: parseInt(t.off_value.substring(1), 10) / 10,
                to: parseInt(t.on_value.substring(1), 10) / 10
            };
        }
    }
}

function sensorRangePack(sensor, u) {
    var on = parseInt(u.to * 10, 10),
        off = parseInt(u.from * 10, 10);
    return {t_since: -1, t_until:0, on_value: ">"+on, off_value:"<"+off, sensor: sensor, output: FAN_OUTPUT};
}

function sensorRangeCreateEmpty() {
    return {from: null, to: null};
}


var transformers = {
    'fanCritical': {
        unpack: function(t) {
            if (t.off_value.indexOf('!') !== -1 && t.sensor === SENSOR_TEMP && t.output === FAN_OUTPUT) {
                return {
                    temperature: parseInt(t.off_value.substring(1), 10) / 10
                };
            }
        },
        pack: function(u) {
            var val = parseInt(u.temperature * 10, 10);
            return {t_since:-1, t_until:0, on_value: ">"+val, off_value: "<"+val+"!", sensor: SENSOR_TEMP, output: FAN_OUTPUT};
        },
        createEmpty: function() {
            return { temperature: null };
        }
    },
    'fanInterval': {
        unpack: function(t) {
            if (t.output == FAN_OUTPUT && (t.t_since == -1 && t.t_until === 0) && t.on_value[0] === 'T' && t.off_value[0] === 'T') {
                return {
                    duration: parseInt(t.off_value.substring(1), 10),
                    after: parseInt(t.on_value.substring(1), 10)
                };
            }
        },
        pack: function(u) {
            return {t_since: -1, t_until: 0, on_value: "T"+fan.after, off_value:"T"+fan.duration, sensor:-1, output: FAN_OUTPUT};
        },
        createEmpty: function() {
            return { duration: null, after: null };
        }
    },
    'humidityOptimal': {
        unpack: function(t) {
            return sensorRangeUnpack(SENSOR_HUMIDITY, t);
        },
        pack: function(u) {
            sensorRangePack(SENSOR_HUMIDITY, u);
        },
        createEmpty: sensorRangeCreateEmpty
    },
    'temperatureOptimal': {
        unpack: function(t) {
            return sensorRangeUnpack(SENSOR_TEMP, t);
        },
        pack: function(u) {
            sensorRangePack(SENSOR_TEMP, u);
        },
        createEmpty: sensorRangeCreateEmpty
    }
};

app.factory('triggerTransformer', function() {
    return {
        createEmpty: function(triggerClass) {
            u = transformers[triggerClass].createEmpty();
            u.active = false;
            u.triggerClass = triggerClass;
            return u;
        },
        unpack: function(trigger) {
            for (var key in transformers) {
                var u = transformers[key].unpack(trigger);
                if (u) {
                    u.active = true;
                    u.triggerClass = key;
                    u.trigger = trigger;
                    return u;
                }
            }
        },
        pack: function(obj) {
            if (!obj.active) return null;
            return transformers[obj.triggerClass].pack(obj);
        }
    };
});

})();