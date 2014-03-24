define([], function() {

window.settings = {

    title: 'Growduino',

    /* TODO read from /sensors/status.jso: timeZoneffset = -tz * 60 */
    tzOffset: -60,

    /*limit number of used triggers on client side
      null = no limit (all firmaware triggers are used, usually 32)
    */
    triggerLimit: null,

    /* load only triggers marked as non-empty on previous save
       if true triggers saved outside app will not be recognized and can be accidentally rewritten
    */
    fastTriggerLoad: true,

    outputs: [
        {name: 'Timer 1'},
        {name: 'Timer 2'},
        {name: 'Pump'},
        {name: 'Fan'},
        {name: 'Humidifier'},
        {name: 'Heating'}
    ],

    sensors: [
        {resource: 'Humidity', divisor: 10},
        {resource: 'Temp1', divisor: 10},
        {resource: 'Light', divisor: '%'},
        {resource: 'Usnd', divisor: 1},
        {resource: 'Temp2', divisor: 10},
        {resource: 'Temp3', divisor: 10}
    ],

    //axis conf is Highcharts configuration
    charts: [
        {
            series: [
                {name: 'Temperature', resource: 'Temp1', yAxis: 0},
                {name: 'Humidity', resource: 'Humidity', yAxis: 1},
                {name: 'Lighting', resource: 'Light', yAxis: 1},
            ],
            yAxis: [
                { title: { text: '°C' }, minRange: 5},
                { title: { text: '%' }, min: 0, minRange: 5},
            ]
        },
        {
            series: [
                {name: 'Temperature 2', resource: 'Temp2', yAxis: 0},
                {name: 'Temperature 3', resource: 'Temp3', yAxis: 0},
            ],
            yAxis: [
                { title: { text: '°C' }, minRange: 5}
            ]
        },
        {
            series: [
                {name: 'Ultrasound', resource: 'Usnd', yAxis: 0}
            ],
            yAxis: [
                { title: { text: 'cm' }, min: 0, minRange: 5},
            ]
        },
    ]
};

});