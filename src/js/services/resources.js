(function() {

app.factory('SensorStatus', ['$resource', function($resource) {
    return $resource('/sensors/status.jso');
}]);

app.factory('NetworkConfig', ['$resource', function($resource) {
    return $resource('/config.jso');
}]);

app.factory('ClientConfig', ['$resource', function($resource) {
    return $resource('/client.jso');
}]);

app.factory('sensorResourceFactory', ['$resource', '$http', function($resource, $http) {
    return function(name, mapFn) {
        var transformers = $http.defaults.transformResponse.concat([function(data, headersGetter) {
            ['day', 'h', 'min'].forEach(function(key) {
                if ($.isArray(data[key])) {
                    //invalid backend data temporary fix
                    d = data[key].map(function(item) {
                        if (item && item > 25000) return item - 32768;
                        return item;
                    });
                    //end of fix
                    d = utils.fixNull(d);
                    data[key] = mapFn ? mapFn(d) : d;
                }
            });
            return data;
        }]);
        return $resource('/sensors/'+name+'.jso', {}, {
            get: {
                method: 'GET',
                transformResponse: transformers
            },
            getMonth: {
                method: 'GET',
                url: '/DATA/'+name.toUpperCase()+'/:year/:month.JSO',
                transformResponse: transformers
            },
            getDay: {
                method: 'GET',
                url: '/DATA/'+name.toUpperCase()+'/:year/:month/:day.JSO',
                transformResponse: transformers
            },
            getHour: {
                method: 'GET',
                url: '/DATA/'+name.toUpperCase()+'/:year/:month/:day/:hour.JSO',
                transformResponse: transformers
            }
        });
    };
}]);

app.factory('SensorHistory', ['sensorResourceFactory', '$q', 'SENSORS', 'SENSOR_META', function(sensorResourceFactory, $q, SENSORS, SENSOR_META) {
    var sensorResources = [];

    SENSORS.forEach(function(sensor) {
        sensorResources.push({
            name: sensor,
            resource: sensorResourceFactory(sensor, SENSOR_META[sensor].mapFn)
        });
    });

    function load(resourceMethod, queryArgs) {
        var d = $q.defer();
        var result = { $promise: d.promise }; //use resoure like result
        var queue = async.queue(function(sensor, done) {
            sensor.resource[resourceMethod](queryArgs, function(data) {
                result[sensor.name] = data;
            }).$promise.finally(function() {
                d.notify(sensor.name);
                done();
            });
        }, 1);

        queue.drain = function() {
            d.resolve(result);
        };

        sensorResources.forEach(function(sensor) {
            queue.push(sensor);
        });

        result.stop = function() {
            queue.tasks.splice(0, queue.tasks.length);
        };
        return result;
    }

    return {
        get: function() {
            return load('get', {});
        },
        getMonth: function(queryArgs) {
            return load('getMonth', queryArgs);
        },
        getDay: function(queryArgs) {
            return load('getDay', queryArgs);
        },
        getHour: function(queryArgs) {
            return load('getHour', queryArgs);
        }
    };
}]);

app.factory('Relay', ['$resource', '$http', 'TZ_OFFSET', function($resource, $http, TZ_OFFSET) {
    var transformers = $http.defaults.transformResponse.concat([function(data, headersGetter) {
        var history = [];
        for (var ts in data.state) {
            history.push({
                when: moment.unix(ts).zone(TZ_OFFSET),
                state: data.state[ts]
            });
        }
        history.sort(function(a, b) { return b.when.valueOf() - a.when.valueOf();});
        data.currentState = history.length === 0 ? 0 : history[0].state;
        data.history = history;
        return data;
    }]);
    return $resource('/sensors/outputs.jso', {}, {
        get: {
            method: 'GET',
            transformResponse: transformers
        },
    });
}]);

app.factory('Triggers', ['$http', function($http) {
    return {
        loadAll: function(triggerIndexes, triggerLoaded, success) {
            if (triggerIndexes.length === 0) {
                success();
                return;
            }
            var q = async.queue(function(index, done) {
                $http.get('/triggers/'+index+'.jso', {cache: false}).success(function(data) {
                    console.log('trigger #'+index+' loaded', data);
                    data.index = index;
                    triggerLoaded(data);
                }).finally(done);
            }, 1);
            q.drain = function() {
                success();
            };

            triggerIndexes.forEach(function(index) {
                q.push(index);
            });
        },
        save: function(triggers, success)  {
            if (!triggers.length) {
                success();
                return;
            }
            var q = async.queue(function(trigger, done) {
                var index = trigger.index;
                console.log('Trigger #'+index+' saved', trigger);
                $http.post('/triggers/'+index+'.jso', trigger).finally(done);
            }, 1);
            q.drain = function() {
                success();
            };
            triggers.forEach(function(trigger) {
                q.push(trigger);
            });
        }
    };
}]);


})();