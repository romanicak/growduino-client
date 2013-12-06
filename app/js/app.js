$.ajaxSetup({
    contentType: 'application/json'
});

var app = angular.module('growduino', []);

app.controller('NetworkConfigCtrl', ['$scope', function($scope) {
     $scope.config = {"use_dhcp":0,"mac":"de:ad:be:ef:55:44","ip":"195.113.57.69","netmask":"255.255.255.0","gateway":"195.113.57.254","ntp":"195.113.56.8"};
 }]);

