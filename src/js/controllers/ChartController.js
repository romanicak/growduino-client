app.controller('ChartController', ['$scope', 'SensorHistory', function($scope, SensorHistory) {
    var chart;
    var series = [
        {name: 'Temperature', resource: 'Temp1', yAxis: 0},
        {name: 'Humidity', resource: 'Humidity', yAxis: 1},
        {name: 'Lighting', resource: 'Light', yAxis: 1},
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
            series: [],
            // drilldown: {
            //     series: []
            // },

        });
        series.forEach(function(s) {
            chart.addSeries({
                name: s.name,
                yAxis: s.yAxis,
                events: {
                    click: function(ev) {
                        if ($scope.zoom === 'H') return;
                        $scope.date = new Date(ev.point.x);
                        $scope.changeZoom($scope.zoom === 'M' ? 'D' : 'H');
                    }
                }
            });
        });
        cleanChart();
    }

    function cleanChart() {
        //q.tasks.splice(0, q.tasks.length);
        //TODO call stop
        chart.series.forEach(function(s) {
            s.hide();
        });
    }

    function pad(data) {
        if ($scope.zoom == 'H') {
            return utils.arrayPad(data, 60, null);
        }
        if ($scope.zoom == 'D') {
            return utils.arrayPad(data, 24, null);
        }
        if ($scope.zoom == 'M') {
            return utils.arrayPad(data, utils.daysInMonth($scope.date.getMonth(), $scope.date.getYear()), null);
        }
    }

    function show(dataKey, resourceMethod, queryArgs, seriesOptions) {
        cleanChart();
        chart.showLoading('Loading…');

        series.forEach(function(item, i) {
            var chartSeries = chart.series[i];
            chartSeries.setData([]);
            chartSeries.update($.extend({
                cursor: $scope.zoom === 'H' ? 'default': 'pointer'
            }, seriesOptions));
        });

        var sh = SensorHistory[resourceMethod](queryArgs);
        sh.$promise.then(null, null, function(sensor) {
            var data = sh[sensor],
                chartSeries = null;
            for (var i = 0; i < series.length; i++) {
                if (series[i].resource == sensor) {
                    chartSeries = chart.series[i];
                    break;
                }
            }
            chartSeries.setData(pad(data[dataKey]));
            chart.hideLoading();
            chartSeries.show();
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

    function showLastHour() {
        show('min', 'get', {}, {
            pointStart: (new Date()).getTime(),
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

    function shiftByUnit(dt, zoom, trimHourOnly, offset) {
        var d = new Date();
        d.setTime(dt.getTime());
        switch (zoom) {
            case 'M':
                d.setMonth(d.getMonth() + offset);
                break;
            case 'D':
                d.setDate(d.getDate() + offset);
                break;
            case 'H':
                if (trimHourOnly) {
                    d.setMinutes(0, 0, 0);
                } else {
                    d.setHours(d.getHours() + offset);
                }
                break;
        }
        return d;
    }

    $scope.shiftDateUnit = function(offset) {
        var d = shiftByUnit($scope.date, $scope.zoom, $scope.isCurrent, offset);
        if (d <= new Date()) {
            $scope.isCurrent = false;
            $scope.date = d;
            redraw();
        }
    };

    $scope.showRecent = function() {
        $scope.date = new Date();
        if ($scope.zoom === 'H') {
            $scope.date.setHours($scope.date.getHours() - 1);
            $scope.isCurrent = true;
            showLastHour();
        } else {
            //call change zoom to align date
            $scope.changeZoom($scope.zoom);
        }
    };

    $scope.zoom = 'H';
    initChart();
    $scope.showRecent();
    setupPicker();

    $scope.$watch(function() {
        return $scope.zoom + '-' + $scope.date.getTime();
    }, function() {
        $scope.formattedDate = utils.formatDate($scope.date, zoomTypes[$scope.zoom].pickerFormat);
        $scope.forwardAllowed = !$scope.isCurrent && shiftByUnit($scope.date, $scope.zoom, false, 1) <= new Date();
    });
}]);
