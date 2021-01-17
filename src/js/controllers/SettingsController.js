app.controller('SettingsController', ['$http', '$scope', '$timeout', '$interval', 'BackendConfig', function($http, $scope, $timeout, $interval, BackendConfig) {
    $scope.loading = true;
    $scope.saving = false;
    $scope.wifi_connected = false;

    $scope.$on('$destroy', function() {
        $interval.cancel($scope.wifi_status_updater);
    });

    BackendConfig.get(function(config) {
        config.use_dhcp = !!config.use_dhcp; //convert to boolean - TODO move on resource layer
        config.current_time = moment.parseZone(config.current_time);
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

    $scope.wifi_status_updater = $interval(function() {
        $http.get('/wifi_active.jso', {cache:false}).success(function(data) {
            $scope.wifi_connected = (data.ssid != null);
        });
    }, 1000);

    $scope.scan_for_wifis = function() {
        $scope.show_wifi_window = true;
        $http.get('/wifilist.jso', {cache: false}).success(function(data) {
            angular.copy(data.networks, $scope.known_wifis);
        });
    };

    $scope.close_wifi_window = function() {
        $scope.show_wifi_window = false;
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
        var wifi_connect_info = {
          "SSID": wifi_object.ssid,
          "password": $scope.model.entered_password
        };
        $http.post('/partial/config.jso', wifi_connect_info).success(function(data) {
          console.log("Connect data succesfully POSTed to /partial/config.jso");
        });
    };

    $scope.test_email_window = function() {
        $scope.show_test_email_window = true;
    };

    $scope.close_test_email_window = function() {
        $scope.test_email_error_msg = "";
        $scope.show_test_email_window = false;
    };

    $scope.send_test_email = function() {
        //alert($scope.config.test_email);
        var req_addr = "send_test_mail?";
        var req_server = "smtp=" + $scope.config.smtp;
        var req_port = "&" + "smtp_port=" + $scope.config.smtp_port;
        var req_ssl = "&" + "smtp_ssl=" + $scope.config.smtp_ssl;
        var req_user = "&" + "smtp_user=" + $scope.config.smtp_user;
        var req_pwd = "&" + "smtp_pwd=" + $scope.config.smtp_pwd;
        var req_mail_from = "&" + "mail_from=" + $scope.config.mail_from;
        var req_mail_to = "&" + "to=" + $scope.config.test_email;

        var request = req_addr + req_server + req_port + req_ssl
            + req_user + req_pwd + req_mail_from + req_mail_to;
        $http.get(request, {cache: false})
            .success(function(data) {
                alert("Response received"); 
                if (data.success) {
                    $scope.test_email_error_msg = "";
                    $scope.close_test_email_window();
                } else {
                    $scope.test_email_error_msg = data.code;
                }
            });
    };
}]);
