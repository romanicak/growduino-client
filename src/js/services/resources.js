(function() {

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

app.factory('Temperature', ['sensorResourceFactory', function(sensorResourceFactory) {
    return sensorResourceFactory('temp1', utils.mapDecimalValues);
}]);

app.factory('Humidity', ['sensorResourceFactory', function(sensorResourceFactory) {
    return sensorResourceFactory('humidity', utils.mapDecimalValues);
}]);

app.factory('Lighting', ['sensorResourceFactory', function(sensorResourceFactory) {
    return sensorResourceFactory('light', utils.mapPercentValues);
}]);

app.factory('Relay', ['$resource', '$http', function($resource, $http) {
    var transformers = $http.defaults.transformResponse.concat([function(data, headersGetter) {
        for (var ts in data.state) {
            //console.log(ts);
            data.currentState = data.state[ts];
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

app.factory('Triggers', ['$http', 'MAX_TRIGGER', function($http, MAX_TRIGGER) {
    return {
        loadAll: function(success) {
            var triggers = [];
            var q = async.queue(function(index, done) {
                $http.get('/triggers/'+index+'.jso').success(function(data) {
                    console.log('trigger #'+index+' loaded', data);
                    data.index = index;
                    triggers.push(data);
                }).finally(done);
            }, 1);
            q.drain = function() {
                success(triggers);
            };

            for (var i = 0; i < MAX_TRIGGER; i++) {
                q.push(i);
            }
        },
        save: function(triggers, success)  {
            var q = async.queue(function(trigger, done) {
                var index = trigger.index;
                delete trigger.index;
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