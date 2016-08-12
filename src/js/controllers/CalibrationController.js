app.controller('CalibrationController', ['$scope', '$timeout', 'CalibrationConfig', function($scope, $timeout, CalibrationConfig) {
    $scope.loading = true;
    $scope.saving = false;
    $scope.calibratingArray = [];
    $scope.needsSavingArray = [];

    calibrationNumSteps = 5;//pocet jednotlivych mereni, z jejichz vysledku se urci kalibracni hodnota
    calibrationMeasurementDelay = 2000;//casovy rozestup mezi jednotlivymi merenimi v milisekundach
    calibrationNumRetries = 1;

    calibrationSteps = [];
    for (i = 1; i <= calibrationNumSteps; i++){
      calibrationSteps.push(i);
    }

    CalibrationConfig['config'].get().then(function(config) {
        $scope.config = config;
        $scope.loading = false;
    }, function(err){
        $scope.loading = false;
    });

    $scope.getRawData = function(valueName, senzor){
      $scope.calibrating = true;
      $scope.calibratingArray[valueName] = true;
      curRetry = 0;
      total = 0;
      async.forEachSeries(calibrationSteps, function(step, callback){
        console.log(senzor);
        console.log($scope.calibratingArray);
        CalibrationConfig[senzor].get(function(data){
          console.log("This is step #" + step + ", valueName: " + valueName + ", senzor: " + senzor + ", data: " + data + ", total: " + total);
          total += data;
          if (step == calibrationNumSteps){
            $scope.config[valueName] = total / 5;
            $scope.calibrating = false;
            $scope.calibratingArray[valueName] = false;
            $scope.needsSavingArray[valueName] = true;
            callback();
          } else {
            setTimeout(callback, calibrationMeasurementDelay);
          }
        }, function() {
          console.log("Step #" + step + " failed, step will be retried");//retrying not impled
          if (step == calibrationNumSteps){
            $scope.config[valueName] = total / 5;
            $scope.calibrating = false;
            $scope.calibratingArray[valueName] = false;
            $scope.needsSavingArray[valueName] = true;
          }
          callback();
        });
      });
    };

    $scope.save = function() {
        if ($scope.saving) return;
        $scope.saving = true;

        $scope.config.$save().then(function() {
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
