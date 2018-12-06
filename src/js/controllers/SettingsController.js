app.controller('SettingsController', ['$scope', '$timeout', 'BackendConfig', function($scope, $timeout, BackendConfig) {
    $scope.loading = true;
    $scope.saving = false;

    BackendConfig.get(function(config) {
        config.use_dhcp = !!config.use_dhcp; //convert to boolean - TODO move on resource layer
        $scope.config = config;
        $scope.loading = false;
        $scope.known_wifis = [];
        $scope.selected_index_in_modal = -1;
        $scope.model={};
        $scope.model.entered_password = "";
    });

    $scope.save = function() {
        if ($scope.saving) return;
        $scope.saving = true;

        $scope.config.$save().then(function() {
            $scope.saving = false;
            $scope.saveSuccess = true;
            $timeout(function() {
                $scope.saveSuccess = false;
            }, 2000);
        }, function() {
            alert('Oops save failed.');
        });
    };

    $scope.scan_for_wifis = function() {
        $scope.show_wifi_window = true;
        known_wifis = [ { 
            quality: "88%",
            ssid: "ASBNJOS",
            frequency: "2,457",
            channel: "42",
            encrypted: false
        }, {
            quality: "88%",
            ssid: "ASBNJOS",
            frequency: "2,457",
            channel: "42",
            encrypted: false
        }, {
            quality: "88%",
            ssid: "ASBNJOS",
            frequency: "2,457",
            channel: "42",
            encrypted: true
        }, {
            quality: "88%",
            ssid: "ASBNJOS",
            frequency: "2,457",
            channel: "42",
            encrypted: false
        }, {
            quality: "88%",
            ssid: "jsdal",
            frequency: "2,457",
            channel: "42",
            encrypted: true
        }, {
            quality: "88%",
            ssid: "ASBNJOS",
            frequency: "2,457",
            channel: "42",
            encrypted: false
        }, {
            quality: "88%",
            ssid: "ASBNJOS",
            frequency: "2,457",
            channel: "42",
            encrypted: false
        }, {
            quality: "88%",
            ssid: "dasasdaj",
            frequency: "2,457",
            channel: "42",
            encrypted: true
        }, {
            quality: "88%",
            ssid: "ASBNJOS",
            frequency: "2,457",
            channel: "42",
            encrypted: false
        }, {
            quality: "88%",
            ssid: "ASBNJOS",
            frequency: "2,457",
            channel: "42",
            encrypted: false
        }, {
            quality: "88%",
            ssid: "ASBNJOS",
            frequency: "2,457",
            channel: "42",
            encrypted: false
        } ];
        angular.copy(known_wifis, $scope.known_wifis);
    };

    $scope.select_wifi_in_modal = function(wifi_object, wifi_index) {
        if (! wifi_object.encrypted && $scope.selected_index_in_modal == wifi_index) {
            $scope.selected_index_in_modal = -1;
            $scope.select_wifi_in_controller(wifi_object);
        } else {
            $scope.model.entered_password = "";
            $scope.selected_index_in_modal = wifi_index;
        }
    };

    $scope.select_wifi_in_controller = function(wifi_object) {
        //alert($scope.model.entered_password);
        $scope.config.wifi_ssid = wifi_object.ssid;
        $scope.config.wifi_pwd = $scope.model.entered_password;
        $scope.close_wifi_window();
    };

    $scope.close_wifi_window = function() {
        $scope.show_wifi_window = false;
    };
}]);
