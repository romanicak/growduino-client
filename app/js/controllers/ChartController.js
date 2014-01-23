app.controller('ChartController', ['$scope', 'Temperature', 'Humidity', 'Lighting', function($scope, Temperature, Humidity, Lighting) {
    var chart = new Highcharts.Chart({
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

    var pointStart =  (new Date()).getTime() - 60*1000;

    $scope.loading = true;

    // Temperature.getMonth({year: 2013, month: 11}, function(d) {
    //     console.log(d);
    //     $scope.loading = false;
    //     chart.addSeries({
    //         name: 'Temperature',
    //         data: d.day,
    //         yAxis: 0,
    //         pointStart: pointStart,
    //         pointInterval: 60 * 1000 * 60 * 24//1 min
    //     });
    // });

    Temperature.get(function(d) {
        $scope.loading = false;
        chart.addSeries({
            name: 'Temperature',
            data: d.min,
            yAxis: 0,
            pointStart: pointStart,
            pointInterval: 60 * 1000 //1 min
        });
    });

    Humidity.get(function(d) {
        $scope.loading = false;
        chart.addSeries({
            name: 'Humidity',
            data: d.min,
            yAxis: 1,
            pointStart: pointStart,
            pointInterval: 60 * 1000 //1 min
        });
    });

    Lighting.get(function(d) {
        $scope.loading = false;
        chart.addSeries({
            name: 'Lighting',
            data: d.min,
            yAxis: 1,
            pointStart: pointStart,
            pointInterval: 60 * 1000 //1 min
        });
    });

    $('#picker-month').datetimepicker({
        minView: 3,
        maxView: 3,
        startView: 3,
        format: 'MM yyyy',
        language: 'cs',
        endDate: new Date()
    }).on('changeDate', function(ev){
        //var url = '/DATA/TEMP1/' + utils.formatDate(ev.date, 'yyyy/mm') + '.jso';
        console.log({
            year: utils.formatDate(ev.date, 'yyyy'),
            month: utils.formatDate(ev.date, 'mm')
        });
        /*$.get(url, function(data) {
            console.log(data);
        });*/
    });
}]);