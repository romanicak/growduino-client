app.controller('ChartController', ['$scope', 'Temperature', 'Humidity', 'Lighting', function($scope, Temperature, Humidity, Lighting) {
    var chart;
    var series = [
        {name: 'Temperature', resource: Temperature, yAxis: 0},
        {name: 'Humidity', resource: Humidity, yAxis: 1},
        {name: 'Lighting', resource: Lighting, yAxis: 1},
    ];

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
    }

    function cleanChart() {
        //TODO use series.setData insead !!!
        while (chart.series.length > 0) {
            chart.series[0].remove(chart.series.length == 1);
        }
    }

    function showRecent() {
        //$scope.loading = true;
        cleanChart();
        var pointStart =  (new Date()).getTime() - 60*1000;
        series.forEach(function(item) {
            item.resource.get(function(data) {
                $scope.loading = false;
                chart.addSeries({
                    name: item.name,
                    data: data.min,
                    yAxis: item.yAxis,
                    pointStart: pointStart,
                    pointInterval: 1000 * 60 //1 min
                });
            });
        });
    }

    function showMonth(dt) {
        //$scope.loading = true;
        cleanChart();
        var args = {
            year: utils.formatDate(dt, 'yyyy'),
            month: utils.formatDate(dt, 'mm')
        };
        series.forEach(function(item) {
            item.resource.getMonth(args, function(data) {
                $scope.loading = false;
                chart.addSeries({
                    name: item.name,
                    data: data.day,
                    yAxis: item.yAxis,
                    pointStart: dt.getTime(),
                    pointInterval: 1000 * 60 * 60 * 24 //day
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
        //startDate: new Date()
        endDate: new Date()
    }).on('changeDate', function(ev){
        showMonth(ev.date);
    });

    initChart();
    showRecent();
}]);