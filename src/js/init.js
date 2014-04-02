define([
    "app",
    "services/resources",
    "services/divisors",
    "services/Trigger",
    "services/Alert",
    "controllers/NavigationController",
    "controllers/ChartController",
    "controllers/NetworkConfigController",
    "controllers/RelayController",
    "controllers/TriggersController",
    "controllers/AlertsController",
    "directives/bsHasError",
    "ngtemplates"
], function() {
    document.title = settings.title;

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
});