$.ajaxSetup({
    contentType: 'application/json'
});

var app = angular.module('growduino', ['ngResource', 'ngRoute']);

app.factory('NetworkConfig', ['$resource', function($resource) {
    return $resource('/config.jso');
}]);

app.factory('Temperature', ['$resource', function($resource) {
    return $resource('/sensors/temp1.jso');
}]);

app.factory('Humidity', ['$resource', function($resource) {
    return $resource('/sensors/humidity.jso');
}]);

app.factory('Lighting', ['$resource', function($resource) {
    return $resource('/sensors/light.jso');
}]);



app.config(['$routeProvider', function($routeProvider) {
    $routeProvider.
        when('/', {
            templateUrl: 'partials/home.htm',
            controller: 'ChartCtrl'
        }).
        when('/network', {
            templateUrl: 'partials/network.htm',
            controller: 'NetworkConfigCtrl'
        }).
        otherwise({
           redirectTo: '/'
        });
}]);


app.controller('NavCtrl', ['$scope', '$location', function($scope, $location) {
    $scope.isActive = function(loc) {
        return loc === $location.path();
    };
}]);

app.controller('ChartCtrl', ['$scope', 'Temperature', 'Humidity', 'Lighting', function($scope, Temperature, Humidity, Lighting) {
    var chart = new Highcharts.Chart({
        chart: {
            renderTo: 'chart',
            type: 'spline',
            zoomType: 'x'
        },
        title: {
            text: 'Sensors'
        },
        xAxis: {
            type: 'datetime',
            maxZoom: 5 * 60 * 1000,
            title: {
                text: 'Time'
            }
        },
        yAxis: [
            { title: { text: '°C' }},
            { title: { text: '%' }},
            { title: { text: 'L?' }}],
        series: []
    });

    var pointStart =  (new Date()).getTime() - 60*1000;

    $scope.loading = true;

    Temperature.get(function(d) {
        $scope.loading = false;
        d.min = d.min.map(function(val) { return val / 10.0; });
        chart.addSeries({
            name: 'Temperature',
            data: d.min,
            yAxis: 0,
            pointStart: pointStart,
            pointInterval: 60 * 1000 //1 min
        });
    });

    Humidity.get(function(d) {
        $scope.loading = false;
        //d.min = d.min.map(function(val) { return val / 2.56; });
        chart.addSeries({
            name: 'Humidity',
            data: d.min,
            yAxis: 1,
            pointStart: pointStart,
            pointInterval: 60 * 1000 //1 min
        });
    });

    Lighting.get(function(d) {
        $scope.loading = false;
        chart.addSeries({
            name: 'Lighting',
            data: d.min,
            yAxis: 2,
            pointStart: pointStart,
            pointInterval: 60 * 1000 //1 min
        });
    });
}]);

app.controller('NetworkConfigCtrl', ['$scope', 'NetworkConfig', function($scope, NetworkConfig) {
    $scope.loading = true;
    var config = $scope.config = NetworkConfig.get(function() {
        config.use_dhcp = !!config.use_dhcp; //convert to boolean
        $scope.loading = false;
    });
}]);

