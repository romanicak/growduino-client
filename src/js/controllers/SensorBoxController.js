app.controller('SensorBoxController', ['$http', '$scope', '$timeout', function($http, $scope, $timeout) {
    $scope.loading = false;
    $scope.saving = false;

    /*$http.get('/sensorbox/detect', {cache: false}).success(function(data) {
      console.log("/sensorbox/detect data: " + JSON.stringify(data));
      console.log("keys: " + JSON.stringify(Object.keys(data)));
      //data maj bejt json s tremi primarnimi klici: usb, online, offline
      $scope.sensorBoxConfigData = data;
      $scope.sensorBoxNames = Object.keys(data);
      $scope.selectedSensorBox = $scope.sensorBoxNames[0];
      $scope.selectedSensorBoxData = data[$scope.selectedSensorBox];
      console.log("Selected sensor box data: " + JSON.stringify($scope.selectedSensorBoxData));
    });*/

    /*$http.get("/sensorbox/" + data.id + "/config", {cache: false}).success(function(configData) {
        $scope.sensorBoxConfig = configData;
    });*/

    function addSensorBox(key, dataItem, displayedName) {
        $scope.sensorBoxNames.push({ "displayedName": displayedName, "dataItem": dataItem });
    }

    function processSensorBoxKey(key, keyData) {
        for (let dataItem of keyData) {
            if (dataItem.hasOwnProperty("name")) {
                addSensorBox(key, dataItem, dataItem["name"]);
            } else if (dataItem.hasOwnProperty("id")) {
                addSensorBox(key, dataItem, dataItem["id"]);
            } else {
                console.log("No 'name' or 'id' in " + JSON.stringify(dataItem));
            }
        }
        console.log("UNIMPLEMENTED from js/controllers/SensorBoxController.js::processSensorBoxKey()");
    }

    function processSensorBoxData(data) {
        console.log("/sensorbox/detect data: " + JSON.stringify(data));
        $scope.sensorBoxNames = [];
        let expectedKeys = [ "usb", "online", "offline" ];
        if ( expectedKeys.every(item => data.hasOwnProperty(item)) ) {
            processSensorBoxKey( "usb", data["usb"] );
            processSensorBoxKey( "online", data["online"] );
            console.log(JSON.stringify($scope.sensorBoxNames));
            console.log(JSON.stringify($scope.selectedSensorBox));
            if (! $scope.sensorBoxNames.includes($scope.selectedSensorBox)) {
                $scope.selectedSensorBox = $scope.sensorBoxNames[0];
            }
        } else {
            console.log("Returned object misses expected key");
        }
    };

    $scope.flashFirmware = function() {
        console.log("UNIMPLEMENTED from js/controllers/SensorBoxController.js::flashFirmware()");
        console.log("Currently select data is " + JSON.stringify($scope.selectedSensorBox));
        let sensorBoxId = $scope.selectedSensorBox["dataItem"]["id"];
        let url = '/sensorbox/' + sensorBoxId + '/flash';
        console.log("About to try url: " + url);
        $http.get(url, {cache: false}).success(function(data) {
            console.log("Success reading " + url + "; returned data: " + JSON.stringify(data));
            $scope.sensorBoxFlashOk = true;
        }).error(function(data, status) {
            console.log("Error reading " + url + "; returned status: " + status);
            $scope.sensorBoxFlashError = true;
        });
    };

    $scope.detectSensorBox = function() {
        let url = '/sensorbox/detect';
        $http.get(url, {cache: false}).success(function(data) {
            processSensorBoxData(data);
        }).error(function(data, status) {
            console.log("Error reading " + url + "; returned status: " + status);
        });
    };

    $scope.changeSettings = function() {
        console.log("UNIMPLEMENTED from js/controllers/SensorBoxController.js::changeSettings()");
        let sensorBoxId = $scope.selectedSensorBox["dataItem"]["id"];
        let url = '/sensorbox/box/' + sensorBoxId;
        console.log("About to try url: " + url);
        $http.get(url, {cache: false}).success(function(data) {
            console.log("Success reading " + url + "; returned data: " + JSON.stringify(data));
            $scope.show_change_settings_window = true;
            $scope.config = data;
            console.log($scope.config.mac);
        }).error(function(data, status) {
            console.log("Error reading " + url + "; returned status: " + status);
            $scope.sensorBoxChangeError = true;
        });
    };

    $scope.closeChangeSettingsWindow = function() {
        $scope.show_change_settings_window = false;
    };

    $scope.uploadSettings = function(config) {
        console.log("UNIMPLEMENTED from js/controllers/SensorBoxController.js::uploadSettings()");
        console.log("config = " + JSON.stringify(config));
        let sensorBoxId = $scope.selectedSensorBox["dataItem"]["id"];
        let url = '/sensorbox/box/' + sensorBoxId;
        console.log("About to try url: " + url);
        $http.post(url, $scope.config).success(function(data) {
            console.log("Post successful");
            $scope.show_save_settings_result_window = true;
            $scope.flashSuccessful = true;
        }).error(function(data, status) {
            console.log("Post NOT successful");
            $scope.show_save_settings_result_window = true;
            $scope.flashSuccessful = false;
        });
    };

    $scope.closeSaveSettingsResultWindow = function() {
        $scope.show_save_settings_result_window = false;
        if ($scope.flashSuccessful) {
            $scope.closeChangeSettingsWindow();
        }
    };
}]);
