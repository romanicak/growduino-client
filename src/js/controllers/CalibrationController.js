app.controller('CalibrationController', ['$scope', '$http', '$timeout', 'CalibrationConfig', function($scope, $http, $timeout, CalibrationConfig) {
    $scope.loading = true;
    $scope.saving = false;
    $scope.calibratingArray = [];
    $scope.needsSavingArray = [];
    $scope.lastCalibrationFailedArray = [];
    $scope.twoPointCalibrationData = [];

    calibrationNumSteps = 5;//pocet jednotlivych mereni, z jejichz vysledku se urci kalibracni hodnota
    calibrationMeasurementDelay = 2000;//casovy rozestup mezi jednotlivymi merenimi v milisekundach
    calibrationNumRetries = 1;

    ECMaxAcceptableValue = 1500;

    CalibrationConfig['config'].get().then(function(config) {
        $scope.config = config;
        prepareCalibrationData();
        $scope.loading = false;
    }, function(err){
        alert("Fail: " + err);
        $scope.loading = false;
        $scope.config = {};
    });

    calibrationDataConfig = [
      {"id": 2, "name": "Light-Out"},
      {"id": 5, "name": "Light-In"},
      {"id": 1, "name": "DHT22-Temp"},
      {"id": 0, "name": "DHT22-Hum"},
      {"id": 4, "name": "Temp-Water"},
      {"id": 6, "name": "Temp-Bulb"},
      {"id": 3, "name": "USND"}
    ];

    function prepareCalibrationData() {
        for (var i = 0; i < calibrationDataConfig.length; i++) {
            d = calibrationDataConfig[i];
            cd = getCalibrationDataForSensor(d);
            $scope.twoPointCalibrationData.push(cd);
        }
    }

    function sensorDataCompare(a, b) {
        timeA = Date.parse(a.timestamp);
        timeB = Date.parse(b.timestamp);
        if (timeA < timeB) {
            return -1;
        } else {
            return 1;
        }
    }

    //vim, ze availableData ma vic nez 2 prvky. chci vratit nove pole, ktere
    //bude obsahovat prave 2 prvky, a to ty, ktere maji nevyssi hodnotu "timestamp"
    function getLast2SensorData(availableData) {
        availableData.sort(sensorDataCompare);
        result = [];
        result.push(availableData[0]);
        result.push(availableData[1]);
        return result;
    }

    //zde projdu vsechny hodnoty z $scope.config.calibration_data;
    //vyignoruju ty, ktere maji v polozce "sensor" neco jineho nez sensorId.id
    //pokud mi zbude min nez 2 vysledky, vratim null
    //jinak setridim vysledky podle hodnot "timestamp" sestupne
    //vratim prvni dva vysledky jako dvouprvkove pole dvouprvkovych hodnot
    //prvky hodnot jsou "sensor_reading" a "real_value"
    function collectCalibrationDataForSensor(sensorId) {
        calibrationArray = Object.values($scope.config.calibration_data);
        availableSensorData = [];
        for (var i = 0; i < calibrationArray.length; i++) {
            calibrationItem = calibrationArray[i];
            if (calibrationItem["sensor"] == sensorId.id) {
                availableSensorData.push(calibrationItem);
            }
        }
        if (availableSensorData.length <= 2) {
            return availableSensorData;
        } else {
            return getLast2SensorData(availableSensorData);
        }
    }

    //zde sensorId je objekt, resp. dvojice (int, str); int reprezentuje index v poli
    //calibration, ktere prislo z krabicky, str reprezentuje jmeno, ktere ma cidlo
    //ve frontendu mit
    function getCalibrationDataForSensor(sensorId) {
        //calib = $scope.config.calibration_data[sensorId];
        calib = collectCalibrationDataForSensor(sensorId);
        data = {};
        data["calib"] = calib;
        data["sensorId"] = sensorId;
        data.records = [];
        rec0 = {};
        rec0["reading"] = calib.length > 0 ? calib[0].sensor_reading : "";
        rec0["realVal"] = calib.length > 0 ? calib[0].real_value : "";
        data.records.push(rec0);
        rec1 = {};
        rec1["reading"] = calib.length > 1 ? calib[1].sensor_reading : "";
        rec1["realVal"] = calib.length > 1 ? calib[1].real_value : "";
        data.records.push(rec1);
        return data;
    }

    $scope.open_popup_window = function(sensorId) {
        $scope.popup_data = getCalibrationDataForSensor(sensorId);
        $scope.show_calibration_popup_window = true;
    }

    $scope.close_popup_window = function() {
        $scope.show_calibration_popup_window = false;
    }

    function sendCalibrationRecord(data, index) {
        recordIndex = data.sensorId.id * 10 + index;
        recordData = data.records[index];
        if (recordData.realVal == "") {
            if (data.calib.length > index) {
                //exje-li, smazat
                alert("smazat "  + recordIndex );
            }
        } else {
            if (data.calib.length > index) {
                //exje-li, prepsat
                alert("prepsat "  + recordIndex );
            } else {
                //jinak vytvorit
                alert("vytvorit "  + recordIndex );
            }
        }
    }

    //realValue je neprazdne
    //  sensor_reading neprazdne: vytvor zaznam
    //  sensor_reading prazdne: error
    //realValue je prazdne
    //  smazat zaznam
    function storeCalibrationRecord(index) {
        recordIndex = $scope.popup_data.sensorId.id * 10 + index;
        record = $scope.popup_data.records[index];
        realVal = parseFloat(record["realVal"]);
        reading = parseFloat(record["reading"]);
        if (isNaN(realVal)) {
            console.log($scope.config.calibration_data);
            delete $scope.config.calibration_data[recordIndex];
            console.log($scope.config.calibration_data);
        } else {
            if (isNaN(reading)) {
                alert("Data error: Cannot save calibration pair with no Sensor data, index: '" + index + "'");
                console.log(record);
            } else {
                $scope.config.calibration_data["" + recordIndex] = {
                    "id": recordIndex,
                    "sensor_reading": reading,
                    "real_value": realVal,
                    "sensor" : $scope.popup_data.sensorId.id
                };
            }
        }
    }

    $scope.sendCalibrationData = function() {
        storeCalibrationRecord(0);
        storeCalibrationRecord(1);
        console.log($scope.config.calibration_data);
        $scope.close_popup_window();
        $scope.save();
        window.location.reload();
    }

    function isValueAcceptable(senzor, value){
      if (senzor == "EC" && (value == -999 || value > ECMaxAcceptableValue)){
        return false;
      }
      if (senzor == "pH" && value == 0){
        return false;
      }
      return true;
    }

    function rawDataSuccess(rawValue, total, skipStepsCount){
      $scope.loadingStep += skipStepsCount;
      $scope.loadingPercent = parseInt($scope.loadingStep / $scope.stepCount * 100, 10);
      curStep++;
      curRetry = 0;
      console.log("rawDataSuccess: ", rawValue, total, total + rawValue, curStep);
      return total + rawValue;
    }

    function rawDataFail(){
      $scope.loadingStep += 1;
      $scope.loadingPercent = parseInt($scope.loadingStep / $scope.stepCount * 100, 10);
      curRetry++;
    }

    function postCalibSinglePoint(valueName) {
      console.log("Calibration done", curStep, total);
      //bud se to povedlo, pak je curStep == calibrationNumSteps, anebo nepovedlo, pak je curStep < calibrationNumSteps
      if (curStep == calibrationNumSteps){//vsechna mereni se podarila, muzeme zobrazit zmerenou hodnotu
        $scope.config[valueName] = "" + Math.round(total / calibrationNumSteps);//formular ma nastaveno, ze hodnoty musi byt cela cisla; angular odmitne (silently) nastavit hodnotu, ktera podminky nesplnuje; proto je treba zaokrouhlit
        $scope.needsSavingArray[valueName] = true;
        $scope.lastCalibrationFailedArray[valueName] = false;
      } else {//nektera mereni se nepodarila, je treba zobrazit error
        $scope.needsSavingArray[valueName] = false;
        $scope.lastCalibrationFailedArray[valueName] = true;
      }
    }

    function postCalibTwoPoint(recordIndex) {
      //use dummy data
      $scope.popup_data.records[recordIndex]["reading"] = 11*recordIndex;
      return;
      if (curStep == calibrationNumSteps){//success
        //nastavit sensor value prislusneho kalibracniho paru (v popup_data) na 
        Math.round(total / calibrationNumSteps);
        //to je vsechno; mel by se zmenit obsah zobrazenych dat v popupu, ale jeste ne na strance calibration
      } else {//cteni kalibracnich dat se nepovedlo; error
        alert("Error occured while reading sensor data; 'sensor reading' value could not be updated");
      }
    }

    $scope.getRawData = function(valueName, senzor, useTwoPoint = false, recordIndex = -1){
      $scope.loadingMessage = "Calibrating " + senzor;
      $scope.loading = true;
      $scope.stepCount = (calibrationNumRetries + 1) * calibrationNumSteps;
      $scope.loadingStep = 0;
      $scope.loadingPercent = 0;

      $scope.calibrating = true;
      $scope.calibratingArray[valueName] = true;
      curStep = 0;
      curDelay = 0;
      curRetry = 0;
      total = 0;

      if (useTwoPoint) {
        postCalibTwoPoint(recordIndex);
        $scope.loading = false;
        $scope.calibrating = false;
        $scope.calibratingArray[valueName] = false;
      }

      /*async.whilst(
        function() {return curStep < calibrationNumSteps && curRetry <= calibrationNumRetries;},//test
        function(callback){//fn
           setTimeout(
             function(){
             CalibrationConfig[senzor].get(
               function(data){//get OK
                 //checknout, jestli je hodnota pripustna, pokud ano, udelat OK, pokud ne, udelat fail
                 rawValue = parseInt(data.raw_value);
                 if (isValueAcceptable(senzor, rawValue)){
                   total = rawDataSuccess(rawValue, total, calibrationNumRetries + 1 - curRetry);
                 } else {
                   rawDataFail();
                 }
                 callback();
               },
               function(){//get failed
                 //udelat fail
                 rawDataFail();
                 callback();
               }
             )}, curDelay);
        },
        function(){//callback
          if (useTwoPoint) {
            postCalibTwoPoint(recordIndex);
          } else {
            postCalibSinglePoint(valueName);
          }
          $scope.loading = false;
          $scope.calibrating = false;
          $scope.calibratingArray[valueName] = false;
        }
      );*/
    };

    $scope.save = function() {
        if ($scope.saving) return;
        $scope.saving = true;

        //$scope.config.$save().then(function() {
        $http.post('calib.jso', $scope.config).success(function(){
            $scope.saving = false;
            $scope.saveSuccess = true;
            $scope.needsSavingArray = [];
            $timeout(function() {
              $scope.saveSuccess = false;
            }, 2000);
        }, function() {
            alert('Oops save failed.');
        });
    };
}]);




      /*async.forEachSeries(calibrationSteps, function(step, callback){
        console.log(senzor);
        console.log($scope.calibratingArray);
        CalibrationConfig[senzor].get(function(data){
          console.log("This is step #" + step + ", valueName: " + valueName + ", senzor: " + senzor + ", data: " + data + ", total: " + total);
          total += data.raw_value;
          console.log(data);
          console.log(data.raw_value);
          if (step == calibrationNumSteps){
            $scope.config[valueName] = total / 5;
            $scope.loading = false;
            $scope.calibrating = false;
            $scope.calibratingArray[valueName] = false;
            $scope.needsSavingArray[valueName] = true;
            callback();
          } else {
            $scope.loadingStep += 2;
            $scope.loadingPercent = parseInt($scope.loadingStep / $scope.stepCount * 100, 10);
            setTimeout(callback, calibrationMeasurementDelay);
          }
        }, function() {
          console.log("Step #" + step + " failed, step will be retried");//retrying not impled
          if (step == calibrationNumSteps){
            $scope.config[valueName] = total / 5;
            $scope.loading = false;
            $scope.calibrating = false;
            $scope.calibratingArray[valueName] = false;
            $scope.needsSavingArray[valueName] = true;
            callback();
          } else {
            $scope.loadingStep += 1;
            $scope.loadingPercent = parseInt($scope.loadingStep / $scope.stepCount * 100, 10);
            setTimeout(callback, calibrationMeasurementDelay);
          }
        });
      });*/
