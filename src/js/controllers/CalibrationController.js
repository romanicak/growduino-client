app.controller('CalibrationController', ['$scope', '$timeout', 'CalibrationConfig', function($scope, $timeout, CalibrationConfig) {
    $scope.loading = true;
    $scope.saving = false;
    $scope.calibratingArray = [];
    $scope.needsSavingArray = [];
    $scope.lastCalibrationFailedArray = [];

    calibrationNumSteps = 5;//pocet jednotlivych mereni, z jejichz vysledku se urci kalibracni hodnota
    calibrationMeasurementDelay = 2000;//casovy rozestup mezi jednotlivymi merenimi v milisekundach
    calibrationNumRetries = 1;

    ECMaxAcceptableValue = 1500;

    CalibrationConfig['config'].get().then(function(config) {
        $scope.config = config;
        $scope.loading = false;
    }, function(err){
        $scope.loading = false;
        $scope.config = {};
    });

    function isValueAcceptable(senzor, value){
      if (senzor == "EC" && (value = -999 || value > ECMaxAcceptableValue)){
        return false;
      }
      return true;
    }

    function rawDataSuccess(rawValue, total, skipStepsCount){
      $scope.loadingStep += skipStepsCount;
      $scope.loadingPercent = parseInt($scope.loadingStep / $scope.stepCount * 100, 10);
      curStep++;
      curRetry = 0;
      return total + rawValue;
    }

    function rawDataFail(){
      $scope.loadingStep += 1;
      $scope.loadingPercent = parseInt($scope.loadingStep / $scope.stepCount * 100, 10);
      curRetry++;
    }

    $scope.getRawData = function(valueName, senzor){
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

      async.whilst(
        function() {return curStep < calibrationNumSteps && curRetry <= calibrationNumRetries;},//test
        function(callback){//fn
           setTimeout(
             function(){
             CalibrationConfig[senzor].get(
               function(data){//get OK
                 //checknout, jestli je hodnota pripustna, pokud ano, udelat OK, pokud ne, udelat fail
                 rawValue = data.raw_value;
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
          //bud se to povedlo, pak je curStep == calibrationNumSteps, anebo nepovedlo, pak je curStep < calibrationNumSteps
          if (curStep == calibrationNumSteps){//vsechna mereni se podarila, muzeme zobrazit zmerenou hodnotu
            $scope.config[valueName] = total / calibrationNumSteps;
            $scope.needsSavingArray[valueName] = true;
            $scope.lastCalibrationFailedArray[valueName] = false;
          } else {//nektera mereni se nepodarila, je treba zobrazit error
            $scope.config[valueName] = "";
            $scope.needsSavingArray[valueName] = false;
            $scope.lastCalibrationFailedArray[valueName] = true;
          }
          $scope.loading = false;
          $scope.calibrating = false;
          $scope.calibratingArray[valueName] = false;
        }
      );




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
