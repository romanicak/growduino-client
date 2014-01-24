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

    function showRecent() {
        cleanChart();
        var pointStart =  (new Date()).getTime() - 60*1000;
        series.forEach(function(item, i) {
            chart.series[i].update({
                data: [],
                pointStart: pointStart,
                pointInterval: 1000 * 60 //1 min
            });
            q.push(function(done) {
                item.resource.get(function (data) {
                    //chart.hideLoading();
                    chart.series[i].setData(data.min);
                    chart.series[i].show();
                }).$promise.finally(function() {
                    chart.series[i].show();
                    done();
                });
            });
        });
    }

    function showMonth(dt) {
        cleanChart();
        var args = {
            year: utils.formatDate(dt, 'yyyy'),
            month: utils.formatDate(dt, 'mm')
        };
        series.forEach(function(item, i) {
            chart.series[i].update({
                data: [],
                pointStart: dt.getTime(),
                pointInterval: 1000 * 60 * 60 * 24 //day
            });
            q.push(function(done) {
                item.resource.getMonth(args, function(data) {
                    //chart.hideLoading();
                    chart.series[i].setData(data.day);
                }).$promise.finally(function() {
                    chart.series[i].show();
                    done();
                });
            });
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
        showMonth(ev.date);
    });

    initChart();
    showRecent();
}]);