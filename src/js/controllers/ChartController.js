app.controller('ChartController', ['$scope', 'SensorHistory', 'TZ_OFFSET', function($scope, SensorHistory, TZ_OFFSET) {
    var charts = [];
    var chartDefs = [
        {
            element: 'chart-huteli',
            series: [
                {name: 'Temperature', resource: 'Temp1', yAxis: 0},
                {name: 'Humidity', resource: 'Humidity', yAxis: 1},
                {name: 'Lighting', resource: 'Light', yAxis: 1},
            ],
            yAxis: [
                { title: { text: '°C' }, minRange: 5},
                { title: { text: '%' }, min: 0, minRange: 5},
                //{ title: { text: '% (Humidity)' }},
                //{ title: { text: '% (Lighting)' }}
            ]
        },
        {
            element: 'chart-usnd',
            series: [
                {name: 'Ultrasound', resource: 'Usnd', yAxis: 0}
            ],
            yAxis: [
                { title: { text: 'usnd' }, min: 0, minRange: 5},
            ]
        },
        {
            element: 'chart-temp23',
            series: [
                {name: 'Temperature 1', resource: 'Temp2', yAxis: 0},
                {name: 'Temperature 2', resource: 'Temp3', yAxis: 0},
            ],
            yAxis: [
                { title: { text: '°C' }, minRange: 5}
            ]
        }
    ];

    var zoomTypes = {
        'H': {
            dataKey: 'min',
            resourceMethod: 'getHour',
            dateComponents: {year: 'YYYY', month: 'MM', day: 'DD', hour: 'HH'},
            pointInterval: 1000 * 60, //1 min
            pickerMaxView: 1,
            pickerFormat: 'd. MM yyyy hh:ii',
            momentFormat: 'D. MMMM YYYY h:mm'
        },
        'D': {
            dataKey: 'h',
            resourceMethod: 'getDay',
            dateComponents: {year: 'YYYY', month: 'MM', day: 'DD'},
            pointInterval: 1000 * 60 * 60,  //hour
            pickerMaxView: 2,
            pickerFormat: 'd. MM yyyy',
            momentFormat: 'D. MMMM YYYY'
        },
        'M': {
            dataKey: 'day',
            resourceMethod: 'getMonth',
            dateComponents: {year: 'YYYY', month: 'MM'},
            pointInterval: 1000 * 60 * 60 * 24, //day
            pickerMaxView: 3,
            pickerFormat: 'MM yyyy',
            momentFormat: 'MMMM YYYY'
        }
    };

    var lastRequest = null;

    function initCharts() {
        var colorIndex = 0, colors = Highcharts.getOptions().colors;

        chartDefs.forEach(function(chartDef, i) {
            charts[i] = new Highcharts.Chart({
                chart: {
                    renderTo: chartDef.element,
                    type: 'spline',
                    zoomType: 'x'
                },
                title: {
                    text: 'Sensors',
                    style: { display: 'none' }
                },
                xAxis: {
                    type: 'datetime',
                    maxZoom: 5 * 60 * 1000,
                    title: {
                        text: 'Time'
                    }
                },
                yAxis: chartDef.yAxis,
                series: []
            });

            chartDef.series.forEach(function(s) {
                charts[i].addSeries({
                    name: s.name,
                    color: colors[colorIndex++],
                    yAxis: s.yAxis,
                    events: {
                        click: function(ev) {
                            if ($scope.zoom === 'H') return;
                            $scope.dt = moment(ev.point.x);
                            $scope.changeZoom($scope.zoom === 'M' ? 'D' : 'H');
                        }
                    }
                });
            });

        });

        cleanCharts();
    }

    function cleanCharts() {
        //q.tasks.splice(0, q.tasks.length);
        //TODO call stop
        if (lastRequest) {
            lastRequest.stop();
        }
        charts.forEach(function(chart) {
            chart.series.forEach(function(s) {
                s.hide();
            });
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
            return utils.arrayPad(data, utils.daysInMonth($scope.dt.month(), $scope.dt.year()), null);
        }
    }

    function show(dataKey, resourceMethod, queryArgs, seriesOptions) {
        cleanCharts();
        charts.forEach(function(chart) {
            chart.showLoading('Loading…');
            chart.series.forEach(function(chartSeries) {
                chartSeries.setData([]);
                chartSeries.update($.extend({
                    cursor: $scope.zoom === 'H' ? 'default': 'pointer',
                    marker: {
                        enabled: true/*$scope.zoom !== 'H'*/
                    }
                }, seriesOptions));
            });
        });

        var sh = lastRequest = SensorHistory[resourceMethod](queryArgs);
        sh.$promise.then(null, null, function(sensor) {
            var data = sh[sensor],
                chart = null,
                chartSeries = null;

            chloop:
            for (var ci = 0; ci < charts.length; ci++) {
                for (var i = 0; i < chartDefs[ci].series.length; i++) {
                    if (chartDefs[ci].series[i].resource === sensor) {
                        chart = charts[ci];
                        chartSeries = chart.series[i];
                        break chloop;
                    }
                }
            }
            if (chartSeries == null) {
                console.warn('No series for ' + sensor);
            } else {
                chartSeries.setData(pad(data[dataKey]));
                chart.hideLoading();
                chartSeries.show();
            }
        });
    }

    function redraw() {
        zt = zoomTypes[$scope.zoom];

        args = {};
        for (var arg in zt.dateComponents) {
            args[arg] = $scope.dt.format(zt.dateComponents[arg]);
        }

        show(zt.dataKey, zt.resourceMethod, args, {
            pointStart: $scope.dt.valueOf(),
            pointInterval: zt.pointInterval
        });
    }

    function setupPicker() {
        zt = zoomTypes[$scope.zoom];
        $('#picker-date').datetimepicker('remove');

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
            //datetime picker return date with selected units in UTC, convert it!
            var d = moment(ev.date).zone(TZ_OFFSET).add('minutes', ev.date.getTimezoneOffset());
            padDate(d);
            $scope.dt = d;
            redraw();
        });
    }

    function padDate(d) {
        switch ($scope.zoom) {
            case 'M':
                d.startOf('month');
                break;
            case 'D':
                d.startOf('day');
                break;
            case 'H':
                d.startOf('hour');
        }
    }

    $scope.changeZoom = function(zoom) {
        $scope.zoom = zoom;
        padDate($scope.dt);
        redraw();
        setupPicker();
    };

    function shiftByUnit(dt, zoom, trimHourOnly, offset) {
        var d = moment(dt);
        switch (zoom) {
            case 'M':
                d.add('months', offset);
                break;
            case 'D':
                d.add('days', offset);
                break;
            case 'H':
                if (trimHourOnly) {
                    d.startOf('hour');
                } else {
                    d.add('hours', offset);
                }
                break;
        }
        return d;
    }

    $scope.shiftDateUnit = function(offset) {
        var d = shiftByUnit($scope.dt, $scope.zoom, $scope.isCurrent, offset);
        if (d.unix() <= moment().unix()) {
            $scope.isCurrent = false;
            $scope.dt = d;
            redraw();
        }
    };

    $scope.showRecent = function() {
        $scope.dt = moment();
        $scope.dt.zone(TZ_OFFSET);

        if ($scope.zoom === 'H') {
            $scope.dt.subtract('hour', 1);
            $scope.dt.startOf('minute');
            $scope.isCurrent = true;
            show('min', 'get', {}, {
                pointStart: $scope.dt.valueOf(),
                pointInterval: 1000 * 60 //1 min
            });
        } else {
            //call change zoom to align date
            $scope.changeZoom($scope.zoom);
        }
    };

    $scope.zoom = 'H';
    initCharts();
    $scope.showRecent();
    setupPicker();

    $scope.$watch(function() {
        return $scope.zoom + '-' + $scope.dt.unix();
    }, function() {
        $scope.formattedDate = $scope.dt.format(zoomTypes[$scope.zoom].momentFormat);
        $scope.forwardAllowed = !$scope.isCurrent && shiftByUnit($scope.dt, $scope.zoom, false, 1).unix() <= moment().unix();

        //debug
        //$scope.formattedDate += ' ' + $scope.dt.unix() + ' / ' + $scope.dt.format();
    });
}]);
