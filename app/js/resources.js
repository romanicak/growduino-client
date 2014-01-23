(function() {

app.factory('NetworkConfig', ['$resource', function($resource) {
    return $resource('/config.jso');
}]);

app.factory('sensorResourceFactory', ['$resource', '$http', function($resource, $http) {
    return function(name, mapFn) {
        return $resource('/sensors/'+name+'.jso', {}, {
            getMonth: {
                method: 'GET',
                url: '/DATA/'+name.toUpperCase()+'/:year/:month.JSO',
                transformResponse: $http.defaults.transformResponse.concat([function(data, headersGetter) {
                    if ($.isArray(data.day)) {
                        data.day = mapFn(utils.fixNull(data.day));
                    }
                    if ($.isArray(data.min)) {
                        data.min = mapFn(utils.fixNull(data.min));
                    }
                    return data;
                }])
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

})();