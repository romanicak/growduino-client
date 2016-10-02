app.controller('MaintenanceController', [ '$http', '$scope', 'Alert', 'Trigger', 'BackendConfig', 'ClientConfig', 'CalibrationConfig', function($http, $scope, Alert, Trigger, BackendConfig, ClientConfig, CalibrationConfig) {
  //********Backup settings********//
  //Saving settings to a file
  $scope.initSaveClientJSO = function(){
    var formData = {
      fileName: "config.jso",
      file: ""
    };
    $scope.formData = formData;
    $scope.$parent.form1Data = formData;
  };
  $scope.saveClientJSO = function(){
    setupLoadingBarWithMessage('Loading');
    $scope.$parent.loading = true;
    BackendConfig.get().then(function(cfg) {
      cfg.$promise = undefined;
      cfg.$resolved = undefined;
      save2File(JSON.stringify(cfg), $scope.form1Data.fileName);
      $scope.$parent.loading = false;
    });
  };

  //Loading settings from a file
  $scope.loadConfig = function(){
    var selector = document.getElementById("fileSelector1");
    selector.click();
  };
  $scope.loadClientJSO = function(file){
    loadFile(file, uploadClientJSO);
  };
  uploadClientJSO = function(data){
    setupLoadingBarWithMessage('Saving');
    $scope.$parent.loading = true;
    $http.post('config.jso', data).success(function() {
      $scope.$parent.loading = false;
    });
  };
  //********End of Backup settings********//

  //********Backup calibration********//
  //Saving calibration to a file
  $scope.initSaveCalibJSO = function(){
    var formData = {
      fileName: "calib.jso",
      file: ""
    };
    $scope.formData = formData;
    $scope.$parent.form6Data = formData;
  };
  $scope.saveCalibJSO = function(){
    setupLoadingBarWithMessage('Loading');
    $scope.$parent.loading = true;
    CalibrationConfig['config'].get().then(function(cfg) {
      cfg.$promise = undefined;
      cfg.$resolved = undefined;
      save2File(JSON.stringify(cfg), $scope.form6Data.fileName);
      $scope.$parent.loading = false;
    });
  };
  //Loading calibration from a file
  $scope.loadCalib = function(){
    var selector = document.getElementById("fileSelector3");
    selector.click();
  };
  $scope.loadCalibJSO = function(file){
    loadFile(file, uploadCalibJSO);
  };
  uploadCalibJSO = function(data){
    setupLoadingBarWithMessage('Saving');
    $scope.$parent.loading = true;
    $http.post('calib.jso', data).success(function() {
      $scope.$parent.loading = false;
    });
  };
  //********End of Backup settings********//


  //********Backup Outputs&Alerts********//
  //Saving Outputs&Alerts to a file
  $scope.initBackupTriggers = function(){
    var formData = {
      fileName: "backup.txt",
      file: ""
    };
    $scope.formData = formData;
    $scope.$parent.form2Data = formData;
  };
  $scope.backupTriggers = function(){
    setupLoadingBarWithMessage('Loading');
    $scope.$parent.loading = true;
    ClientConfig.get().then(function(cfg) {
      $scope.$parent.stepCount = cfg.usedAlerts ? cfg.usedAlerts.length : 0;
      $scope.$parent.stepCount += cfg.usedTriggers ? cfg.usedTriggers.length : 0;
      cfg.$promise = undefined;
      cfg.$resolved = undefined;
      var saveData = {
        client: cfg
      };
      async.forEachSeries(cfg.usedAlerts || [],
        function(alertIndex, callback) {
          var alertData = Alert.loadRaw(alertIndex,
            function(alertData){
              if (alertData.trigger > -1){
                saveData['/triggers/' + alertData.trigger] = alertData.triggerData;
                delete alertData.triggerData;
              }
              saveData['/alerts/' + alertIndex] = alertData;
              $scope.$parent.loadingStep += 1;
              $scope.$parent.loadingPercent = parseInt($scope.loadingStep / $scope.stepCount * 100, 10);
            }, callback
          );
        }, function (err){
          async.forEachSeries(cfg.usedTriggers || [],
            function(triggerIndex, callback) {
              var triggerData = Trigger.loadRaw(triggerIndex,
                function(triggerData) {
                  saveData['/triggers/' + triggerIndex] = triggerData;
                  $scope.$parent.loadingStep += 1;
                  $scope.$parent.loadingPercent = parseInt($scope.loadingStep / $scope.stepCount * 100, 10);
                }, callback
              );
            }, function (err){
              save2File(JSON.stringify(saveData), $scope.form2Data.fileName);
              $scope.$parent.loading = false;
          });
      });
    });
  };

  //Loading Outputs&Alerts from a file
  $scope.loadAlertsTriggers = function(){
    var selector = document.getElementById("fileSelector2");
    selector.click();
  };
  $scope.loadTriggers = function(file){
    loadFile(file, uploadTriggers);
  };
  uploadTriggers = function(rawData){
    console.log("upload triggers " + rawData);
    setupLoadingBarWithMessage('Saving');
    $scope.$parent.loading = true;
    data = JSON.parse(rawData);
    $scope.$parent.stepCount = Object.keys(data).length;
    async.forEachSeries(Object.keys(data) || [],
      function(datum, callback){
        $http.post(datum + ".jso", data[datum]).success(function() {
          $scope.$parent.loadingStep += 1;
          $scope.$parent.loadingPercent = parseInt($scope.loadingStep / $scope.stepCount * 100, 10);
          callback();
        });
      }, function (err){
        $scope.$parent.loading = false;
    });
  };
  //********End of Backup Outputs&Alerts********//

  //********Delete Outputs&Alerts********//
  $scope.deleteAlertsTriggers = function(){
    setupLoadingBarWithMessage('Deleting');
    $scope.$parent.loading = true;
    ClientConfig.get().then(function(cfg){
      if (cfg.usedTriggers == undefined){
        cfg.usedTriggers = [];
      }
      $scope.$parent.stepCount = cfg.usedAlerts ? 3 * cfg.usedAlerts.length : 0;
      $scope.$parent.stepCount += cfg.usedTriggers ? cfg.usedTriggers.length : 0;
      async.forEachSeries(cfg.usedAlerts || [],
        function(alertIndex, callback) {
          var alertData = Alert.loadRaw(alertIndex,
            function(alertData){
              if (alertData.trigger > -1){
                cfg.usedTriggers.push(alertData.trigger);
              }
            }, callback
          );
        }, function (err){
          async.forEachSeries(cfg.usedAlerts || [],
            function(alertIndex, callback) {
              $http.post("/alerts/" + alertIndex + ".jso", "").success(function(){
                $scope.$parent.loadingStep += 1;
                $scope.$parent.loadingPercent = parseInt($scope.loadingStep / $scope.stepCount * 100, 10);
                callback();
              });
            }, function (err){
              async.forEachSeries(cfg.usedTriggers || [],
                function(triggerIndex, callback) {
                  $http.post("/triggers/" + triggerIndex + ".jso", "").success(function() {
                  $scope.$parent.loadingStep += 1;
                  $scope.$parent.loadingPercent = parseInt($scope.loadingStep / $scope.stepCount * 100, 10);
                    callback();
                  });
                }, function (err){
                  $http.post('client.jso', "").success(function() {
                  $scope.$parent.loading = false;
                });
              });
          });
      });     
    });
  };
  //********End of Delete Outputs&Alerts********//

  //********Util stuff********//
  setupLoadingBarWithMessage = function(message) {
    $scope.$parent.loadingMessage = message;
    $scope.$parent.loadingStep = 0;
    $scope.$parent.loadingPercent = 0;
  };

  //util functions for saving to disc and loading from it
  save2File = function(data, fileName){
    var file = new Blob([data], {type: "text/plain"});
    var a = document.getElementById("a");
    a.href = URL.createObjectURL(file);
    a.download = fileName;
    a.click();
  };

  loadFile = function(file, callback){
    var f = file.files[0];
    var reader = new FileReader();

    reader.onload = function(theFile) {
      callback(theFile.target.result);
    };
    reader.readAsText(f);
  };
  //********End of Util stuff********//
}]);
