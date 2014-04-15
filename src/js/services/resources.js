define(['app', 'async'], function(app, async) {

app.factory('BackendConfig', ['$resource', function($resource) {
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

app.factory('SensorHistory', ['$q', 'sensorResourceFactory', 'divisors', 'settings', function($q, sensorResourceFactory, divisors, settings) {
    var sensorResources = [];

    settings.sensors.forEach(function(sensor) {
        sensorResources.push({
            name: sensor.resource,
            resource: sensorResourceFactory(sensor.resource, divisors.get(sensor.divisor))
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

app.factory('Relay', ['$resource', '$http', 'settings', function($resource, $http, settings) {
    var transformers = $http.defaults.transformResponse.concat([function(data, headersGetter) {
        var history = [];
        for (var ts in data.state) {
            history.push({
                when: moment.unix(ts).zone(settings.tzOffset),
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

});