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
        data.currentState = data.min[data.min.length - 1];
        return data;
    }]);
    return $resource('/sensors/outputs.jso', {}, {
        get: {
            method: 'GET',
            transformResponse: transformers
        },
    });
}]);


})();