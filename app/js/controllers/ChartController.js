app.controller('ChartController', ['$scope', 'Temperature', 'Humidity', 'Lighting', function($scope, Temperature, Humidity, Lighting) {
    var chart;
    var series = [
        {name: 'Temperature', resource: Temperature, yAxis: 0},
        {name: 'Humidity', resource: Humidity, yAxis: 1},
        {name: 'Lighting', resource: Lighting, yAxis: 1},
    ];
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
                text: 'Sensors'
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

    function showMonth(dt) {
        show('day', 'getMonth', {
            year: utils.formatDate(dt, 'yyyy'),
            month: utils.formatDate(dt, 'mm')
        }, {
            pointStart: dt.getTime(),
            pointInterval: 1000 * 60 * 60 * 24 //day
        });
    }

    function showDay(dt) {
        show('h', 'getDay', {
            year: utils.formatDate(dt, 'yyyy'),
            month: utils.formatDate(dt, 'mm'),
            day: utils.formatDate(dt, 'dd')
        }, {
            pointStart: dt.getTime(),
            pointInterval: 1000 * 60 * 60  //hour
        });
    }

    function showHour(dt) {
        show('min', 'getHour', {
            year: utils.formatDate(dt, 'yyyy'),
            month: utils.formatDate(dt, 'mm'),
            day: utils.formatDate(dt, 'dd'),
            hour: utils.formatDate(dt, 'hh')
        }, {
            pointStart: dt.getTime(),
            pointInterval: 1000 * 60 //1 min
        });
    }

    function showRecent() {
        show('min', 'get', {}, {
            pointStart: (new Date()).getTime() - 60*1000,
            pointInterval: 1000 * 60 //1 min
        });
    }

    $('#picker-month').datetimepicker({
        minView: 3,
        maxView: 3,
        startView: 3,
        format: 'MM yyyy',
        language: 'cs',
        startDate: new Date(2013, 0, 1),
        endDate: new Date()
    }).on('changeDate', function(ev){
        ev.date.setHours(0, 0, 0, 0);
        showMonth(ev.date);
    });

    $('#picker-day').datetimepicker({
        minView: 3,
        maxView: 2,
        startView: 2,
        format: 'd MM yyyy',
        language: 'cs',
        startDate: new Date(2013, 0, 1),
        endDate: new Date()
    }).on('changeDate', function(ev){
        ev.date.setHours(0, 0, 0, 0);
        showDay(ev.date);
    });

    $('#picker-hour').datetimepicker({
        minView: 3,
        maxView: 1,
        startView: 1,
        format: 'd MM yyyy hh:00',
        language: 'cs',
        startDate: new Date(2013, 0, 1),
        endDate: new Date()
    }).on('changeDate', function(ev){
        ev.date.setMinutes(0, 0, 0);
        showHour(ev.date);
        //TODO FIX Timezones !!!!
    });

    initChart();
    showRecent();
}]);