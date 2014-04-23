(function() {

function onComplete() {
    document.title = settings.title;

    window.isTouch = 'ontouchstart' in document.documentElement;

    $(function() {
        if ($('#bootstrap-css-check').css('display') !== 'none') {
            $('<link rel="stylesheet" href="/bower/bs.css">').appendTo('head');
        }
        $('#app-loading').text('Loading backend status…');
        $.get('/sensors/status.jso', function(status) {

            $.extend(window.settings, {
                tzOffset: -status.tz * 60,
                triggerCount: status.triggers
            });

            var sensors = [];
            $.each(status.sensor_list, function(index, resource) {
                if (resource) {
                    var sensor = {resource: resource};
                    if (settings.sensors[resource]) {
                        $.extend(sensor, settings.sensors[resource]);
                    } else {
                        console.warn('Sensor '+ resource + ' is not configured in settings');
                    }
                    sensors[parseInt(index, 10)] = sensor;
                }
            });
            settings.sensors = sensors;
            console.log('Sensors', settings.sensors.map(function(s) { return s.resource;}));

            Highcharts.setOptions({
                /*lang: {
                    months: $.fn.datetimepicker.dates.cs.months,
                    shortMonths: $.fn.datetimepicker.dates.cs.monthsShort,
                    weekdays: $.fn.datetimepicker.dates.cs.days
                },*/
                global: {
                    timezoneOffset: settings.tzOffset
                }
            });

            $('#app-loading').remove();
            $('.container').show();
            angular.bootstrap(document, ['growduino']);
        });

    });
}

function loadApplication() {
    var libs = [];
    if (DIST) {
        libs.push('js/libs.js');
    } else {
        libs = libs.concat([
            'libs/bootstrap-datetimepicker/bootstrap-datetimepicker.js',
            'libs/async.js'
        ]);
    }

    libs = libs.concat([
        'js/settings.js',
        'js/app.js'
    ]);

    loadSerial(libs, function() {
        yepnope({
            load: DIST ? [ 'js/minified.js'] : [
                "js/services/utils.js",
                "js/services/resources.js",
                "js/services/divisors.js",
                "js/services/Trigger.js",
                "js/services/Alert.js",
                "js/controllers/NavigationController.js",
                "js/controllers/ChartController.js",
                "js/controllers/SettingsController.js",
                "js/controllers/RelayController.js",
                "js/controllers/TriggersController.js",
                "js/controllers/AlertsController.js",
                "js/directives/bsHasError.js",
            ],
            complete: onComplete
        });
    });
}

function loadSerial(resources, done) {
    if (resources.length) {
        var res = resources.shift();
        yepnope({
            load: [res],
            complete: function() {
                loadSerial(resources, done);
            }
        });
    } else {
        done();
    }
}

function loadLibsOnline() {
    yepnope({
        load: [
            "//ajax.googleapis.com/ajax/libs/angularjs/1.2.16/angular.min.js",
            "//ajax.googleapis.com/ajax/libs/angularjs/1.2.16/angular-resource.min.js",
            "//ajax.googleapis.com/ajax/libs/angularjs/1.2.16/angular-route.min.js",
            "//netdna.bootstrapcdn.com/bootstrap/3.1.1/js/bootstrap.min.js",
            "//cdnjs.cloudflare.com/ajax/libs/highcharts/3.0.10/highcharts.js",
            "//cdnjs.cloudflare.com/ajax/libs/moment.js/2.5.1/moment.min.js",
        ],
        complete: loadApplication
    });
}


function loadLibsOffline() {
    console.warn('Loading in offline mode.');
    loadSerial([
        "bower/jquery.js",
        "bower/angular.js",
        "bower/ngres.js",
        "bower/ngroute.js",
        "bower/bs.js",
        "bower/hicharts.js",
        "bower/moment.js"
    ], loadApplication);
}



yepnope({
    load: '//ajax.googleapis.com/ajax/libs/jquery/2.1.0/jquery.min.js',
    complete: function () {
        if (window.jQuery) {
            loadLibsOnline();
        } else {
            loadLibsOffline();
        }
    }
});

})();

