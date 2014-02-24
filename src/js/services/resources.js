(function() {

app.factory('SensorStatus', ['$resource', function($resource) {
    return $resource('/sensors/status.jso');
}]);

app.factory('NetworkConfig', ['$resource', function($resource) {
    return $resource('/config.jso');
}]);

app.factory('sensorResourceFactory', ['$resource', '$http', function($resource, $http) {
    return function(name, mapFn) {
        var transformers = $http.defaults.transformResponse.concat([function(data, headersGetter) {
            ['day', 'h', 'min'].forEach(function(key) {
                if ($.isArray(data[key])) {
                    //invalid backend data temporary fix
                    data[key] = data[key].map(function(item) {
                        if (item && item > 25000) return item - 32768;
                        return item;
                    });
                    //end of fix
                    data[key] = mapFn(utils.fixNull(data[key]));
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

app.factory('SensorHistory', ['sensorResourceFactory', '$q', function(sensorResourceFactory, $q) {
    var sensors = [
        {name: 'Humidity', mapFn: utils.mapDecimalValues},
        {name: 'Temp1', mapFn: utils.mapDecimalValues},
        {name: 'Light', mapFn: utils.mapPercentValues},
        {name: 'Usnd', mapFn: utils.mapDecimalValues},
        {name: 'Temp2', mapFn: utils.mapDecimalValues},
        {name: 'Temp3', mapFn: utils.mapDecimalValues}
    ];

    sensors.forEach(function(sensor) {
        sensor.resource = sensorResourceFactory(sensor.name, sensor.mapFn);
    });

    function load(resourceMethod, queryArgs) {
        var d = $q.defer();
        var result = { $promise: d.promise }; //use resoure like result
        var queue = async.queue(function(sensor, done) {
            sensor.resource[resourceMethod](queryArgs, function(data) {
                result[sensor.name] = data;
                d.notify(sensor.name);
            }).$promise.finally(function() {
                done();
            });
        }, 1);

        queue.drain = function() {
            d.resolve(result);
        };

        sensors.forEach(function(sensor) {
            queue.push(sensor);
        });

        result.stop = function() {
            queue.tasks.splice(0, queue.tasks.length);
        }
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

app.factory('Relay', ['$resource', '$http', function($resource, $http) {
    var transformers = $http.defaults.transformResponse.concat([function(data, headersGetter) {
        var last = -1;
        for (var ts in data.state) {
            if (ts > last) {
                last = ts;
                data.currentState = data.state[ts];
            }
        }
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
        loadAll: function(triggerCount, triggerLoaded, success) {
            //dbg no load
            // success();
            // return;

            var q = async.queue(function(index, done) {
                $http.get('/triggers/'+index+'.jso').success(function(data) {
                    console.log('trigger #'+index+' loaded', data);
                    data.index = index;
                    triggerLoaded(data);
                }).finally(done);
            }, 1);
            q.drain = function() {
                success();
            };

            for (var i = 0; i < triggerCount; i++) {
                q.push(i);
            }
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