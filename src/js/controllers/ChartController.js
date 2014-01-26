app.controller('ChartController', ['$scope', 'Temperature', 'Humidity', 'Lighting', function($scope, Temperature, Humidity, Lighting) {
    var chart;
    var series = [
        {name: 'Temperature', resource: Temperature, yAxis: 0},
        {name: 'Humidity', resource: Humidity, yAxis: 1},
        {name: 'Lighting', resource: Lighting, yAxis: 1},
    ];

    var zoomTypes = {
        'H': {
            dataKey: 'min',
            resourceMethod: 'getHour',
            dateComponents: {year: 'yyyy', month: 'mm', day: 'dd', hour: 'hh'},
            pointInterval: 1000 * 60, //1 min
            pickerMaxView: 1,
            pickerFormat: 'd. MM yyyy hh:ii'
        },
        'D': {
            dataKey: 'h',
            resourceMethod: 'getDay',
            dateComponents: {year: 'yyyy', month: 'mm', day: 'dd'},
            pointInterval: 1000 * 60 * 60,  //hour
            pickerMaxView: 2,
            pickerFormat: 'd. MM yyyy'
        },
        'M': {
            dataKey: 'day',
            resourceMethod: 'getMonth',
            dateComponents: {year: 'yyyy', month: 'mm'},
            pointInterval: 1000 * 60 * 60 * 24, //day
            pickerMaxView: 3,
            pickerFormat: 'MM yyyy'
        }
    };

    var q = async.queue(function(task, done) {
        task(done);
    }, 1);

    function initChart() {
        chart = new Highcharts.Chart({
            chart: {
                renderTo: 'chart',
                type: 'spline',
                zoomType: 'x'
            },
            title: {
                text: 'Sensors',
                style: {
                   display: 'none'
                }
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
                { title: { text: '%' }, min: 0},
                //{ title: { text: '% (Humidity)' }},
                //{ title: { text: '% (Lighting)' }}
            ],
            series: []
        });
        series.forEach(function(s) {
            chart.addSeries({
                name: s.name,
                yAxis: s.yAxis
            });
        });
        cleanChart();
    }

    function cleanChart() {
        chart.series.forEach(function(s) {
            s.hide();
        });
        q.tasks.splice(0, q.tasks.length);
        //chart.showLoading();
    }

    function show(dataKey, resourceMethod, queryArgs, seriesOptions) {
        cleanChart();
        series.forEach(function(item, i) {
            var series = chart.series[i];
            series.setData([]);
            series.update(seriesOptions);
            q.push(function(done) {
                item.resource[resourceMethod](queryArgs, function (data) {
                    //chart.hideLoading();
                    series.setData(data[dataKey]);
                }).$promise.finally(function() {
                    series.show();
                    done();
                });
            });
        });
    }

    function redraw() {
        zt = zoomTypes[$scope.zoom];

        args = {};
        for (var arg in zt.dateComponents) {
            args[arg] = utils.formatDate($scope.date, zt.dateComponents[arg]);
        }

        show(zt.dataKey, zt.resourceMethod, args, {
            pointStart: $scope.date.getTime(),
            pointInterval: zt.pointInterval
        });
    }

    function showRecent() {
        show('min', 'get', {}, {
            pointStart: (new Date()).getTime() - 60*1000,
            pointInterval: 1000 * 60 //1 min
        });
    }

    function setupPicker() {
        zt = zoomTypes[$scope.zoom];
        $('#picker-date').datetimepicker('remove');

        // var initialDate = new Date();
        // var time =  $scope.date.getTime() - $scope.date.getTimezoneOffset() * 60 * 1000;
        // initialDate.setTime(time);

        $('#picker-date').datetimepicker({
            minView: 3,
            maxView: zt.pickerMaxView,
            startView: zt.pickerMaxView,
            format: zt.pickerFormat,
            language: 'cs',
            startDate: new Date(2013, 0, 1),
            endDate: new Date(),
            initialDate: $scope.date
        }).on('changeDate', function(ev){
            if ($scope.zoom == 'H') {
                //datetime picker returns date with hour in UTC, fix it
                var time = ev.date.getTime() + ev.date.getTimezoneOffset() * 60 * 1000;
                $scope.date.setTime(time);
                $scope.date.setMinutes(0, 0, 0);
            } else {
                $scope.date.setTime(ev.date.getTime());
                $scope.date.setHours(0, 0, 0, 0);
            }
            redraw();
        });
    }

    $scope.changeZoom = function(zoom) {
        $scope.zoom = zoom;

        switch ($scope.zoom) {
            case 'M':
                $scope.date.setDate(1);
                $scope.date.setHours(0, 0, 0, 0);
                break;
            case 'D':
                $scope.date.setHours(0, 0, 0, 0);
                break;
        }
        redraw();
        setupPicker();
    };

    $scope.shiftDateUnit = function(offset) {
        var d = new Date();
        d.setTime($scope.date.getTime());
        switch ($scope.zoom) {
            case 'M':
                d.setMonth(d.getMonth() + offset);
                break;
            case 'D':
                d.setDate(d.getDate() + offset);
                break;
            case 'H':
                if ($scope.isCurrent) {
                    d.setMinutes(0, 0, 0);
                } else {
                    d.setHours(d.getHours() + offset);
                }
                break;
        }
        if (d <= new Date()) {
            $scope.isCurrent = false;
            $scope.date = d;
            redraw();
        }
    };

    $scope.zoom = 'H';
    $scope.date = new Date();
    $scope.date.setHours($scope.date.getHours() - 1);
    $scope.isCurrent = true;

    $scope.$watch(function() {
        return $scope.date ? $scope.date.getTime() : null;
    }, function() {
        $scope.formattedDate = utils.formatDate($scope.date, zoomTypes[$scope.zoom].pickerFormat);
    });

    initChart();
    showRecent();
    setupPicker();

    //TODO drill down
}]);