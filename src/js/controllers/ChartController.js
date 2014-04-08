define(['app'], function(app) {

app.controller('ChartController', ['$scope', '$location', 'SensorHistory', 'settings', function($scope, $location, SensorHistory, settings) {
    var charts = [];
    var chartDefs = settings.charts;

    var zoomTypes = {
        'H': {
            dataKey: 'min',
            resourceMethod: 'getHour',
            dateComponents: {year: 'YYYY', month: 'MM', day: 'DD', hour: 'HH'},
            pointInterval: 1000 * 60, //1 min
            pickerMaxView: 1,
            pickerFormat: 'd. MM yyyy hh:ii',
            momentFormat: function(m) {
                return m.format('D. MMMM YYYY HH:mm') + ' - ' + moment(m).add('h', 1).format('HH:mm');
            },
            momentUnit: 'hour',
            urlFormat: 'YYYY-MM-DDTHH:mm',

        },
        'D': {
            dataKey: 'h',
            resourceMethod: 'getDay',
            dateComponents: {year: 'YYYY', month: 'MM', day: 'DD'},
            pointInterval: 1000 * 60 * 60,  //hour
            pickerMaxView: 2,
            pickerFormat: 'd. MM yyyy',
            momentFormat: 'D. MMMM YYYY',
            momentUnit: 'day',
            urlFormat: 'YYYY-MM-DD',
        },
        'M': {
            dataKey: 'day',
            resourceMethod: 'getMonth',
            dateComponents: {year: 'YYYY', month: 'MM'},
            pointInterval: 1000 * 60 * 60 * 24, //day
            pickerMaxView: 3,
            pickerFormat: 'MM yyyy',
            momentFormat: 'MMMM YYYY',
            momentUnit: 'month',
            urlFormat: 'YYYY-MM-DD',
        }
    };

    var lastRequest = null;

    function initCharts() {
        var colorIndex = 0, colors = Highcharts.getOptions().colors;

        chartDefs.forEach(function(chartDef, i) {
            var divId = utils.generateId();
            $('<div class="chart"></div>').attr('id', divId).appendTo('#charts');
            charts[i] = new Highcharts.Chart({
                chart: {
                    renderTo: divId,
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
                            if ($scope.zoom === 'H') return; //should never happen
                            updateChart($scope.zoom === 'M' ? 'D' : 'H', moment(ev.point.x));
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

    function padValues(data) {
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

    function padDate(d, zoom) {
        d.startOf(zoomTypes[zoom].momentUnit);
    }

    function show(dataKey, resourceMethod, queryArgs, seriesOptions) {
        cleanCharts();
        charts.forEach(function(chart) {
            chart.showLoading('Loading…');
            chart.series.forEach(function(chartSeries) {
                chartSeries.setData([]);
                chartSeries.update($.extend({
                    cursor: $scope.zoom === 'H' ? 'default': 'pointer'
                    /*marker: {
                        enabled: true//$scope.zoom !== 'H'
                    }*/
                }, seriesOptions));
            });
        });

        lastRequest = SensorHistory[resourceMethod](queryArgs);
        lastRequest.$promise.then(null, null, function(sensor) {
            var data = lastRequest[sensor],
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
            if (chartSeries === null) {
                console.warn('No series for ' + sensor);
            } else {
                if (data) {
                    chartSeries.setData(padValues(data[dataKey]));
                }
                chart.hideLoading();
                chartSeries.show();
            }
        });
    }

    function updateChart(zoom, dt) {
        var zoomChanged = $scope.zoom !== zoom,
            isNow = dt === 'now';

        if (isNow) {
            dt = moment().zone(settings.tzOffset);
            $scope.isCurrent = true;
            if (zoom === 'H')  dt.subtract('hour', 1).startOf('minute');
        }

        if (!isNow || zoom !== 'H') padDate(dt, zoom);
        $scope.dt = dt;
        $scope.zoom = zoom;

        zt = zoomTypes[zoom];
        $location.search('z', zoom);
        $location.search('d', isNow && zoom === 'H' ? null : dt.format(zt.urlFormat));

        args = {};
        for (var arg in zt.dateComponents) {
            args[arg] = dt.format(zt.dateComponents[arg]);
        }

        show(zt.dataKey, isNow ? 'get' : zt.resourceMethod, args, {
            pointStart: dt.valueOf(),
            pointInterval: zt.pointInterval
        });

        if (zoomChanged) {
            setupPicker();
        } else {
            updatePicker();
        }
    }

    function updatePicker() {
        var picker = $('#picker-date').data('datetimepicker');
        if (picker) {
            picker.initialDate = $scope.dt.toDate();
        }
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
            endDate: new Date()
        }).on('changeDate', function(ev){
            //datetime picker return date with selected units in UTC, convert it!
            var d = moment(ev.date).zone(settings.tzOffset).add('minutes', ev.date.getTimezoneOffset());
            updateChart($scope.zoom, d);
            $('#picker-date').datetimepicker('hide');
        });
        updatePicker();
    }

    function changeZoom(zoom) {
        updateChart(zoom, $scope.dt);
    }

    function shiftByUnit(dt, zoom, offset) {
        var d = moment(dt);
        d.add(zoomTypes[zoom].momentUnit+'s', offset);
        return d;
    }

    function shiftDateUnit(offset) {
        var d;
        if ($scope.isCurrent) {
            d = moment($scope.dt);
            padDate(d, $scope.zoom);
        } else {
            d = shiftByUnit($scope.dt, $scope.zoom, offset);
        }
        if (d.unix() <= moment().unix()) {
            $scope.isCurrent = false;
            updateChart($scope.zoom, d);
        }
    }

    function showRecent() {
        updateChart($scope.zoom, 'now');
    }

    $scope.changeZoom = changeZoom;
    $scope.shiftDateUnit = shiftDateUnit;
    $scope.showRecent = showRecent;

    initCharts();

    var search = $location.search();
    $scope.zoom = zoomTypes[search.z] ? search.z : 'H';
    updateChart($scope.zoom, search.d ? moment(search.d) : 'now');

    setupPicker();

    $scope.$watch(function() {
        return $scope.zoom + '-' + $scope.dt.unix();
    }, function() {
        var fmt = zoomTypes[$scope.zoom].momentFormat;
        $scope.formattedDate = $.isFunction(fmt) ? fmt($scope.dt) : $scope.dt.format(fmt);
        $scope.forwardAllowed = !$scope.isCurrent && shiftByUnit($scope.dt, $scope.zoom, 1).unix() <= moment().unix();

        //debug
        //$scope.formattedDate += ' ' + $scope.dt.unix() + ' / ' + $scope.dt.format();
    });
}]);

});