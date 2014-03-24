define([], function() {

window.settings = {

    title: 'Fish & Tomatoes',

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
        'Light',
        'Fan',
        'Water level',
    ],

    //0 : Light - cas + Light1 <
    //1: Fan - Temp1, Humidity1
    //2: Water level - dopousteni vody - Usnd > dokud < 0

    sensors: [
        {resource: 'Humidity', divisor: 10},
        {resource: 'Temp1', divisor: 10}, //air
        {resource: 'Temp2', divisor: 10}, //water
        {resource: 'Light1', divisor: '%'}, //out
        {resource: 'Light2', divisor: '%'}, //indoor
        {resource: 'Usnd', divisor: 1}
    ],

    //cs pryc

    //axis conf is Highcharts configuration
    charts: [
        {
            series: [
                {name: 'Air Temperature', resource: 'Temp1', yAxis: 0},
                {name: 'Water Temperature', resource: 'Temp2', yAxis: 0},
                {name: 'Humidity', resource: 'Humidity', yAxis: 1},
            ],
            yAxis: [
                { title: { text: '°C' }, minRange: 5},
                { title: { text: '%' }, min: 0, minRange: 5},
            ]
        },
        {
            series: [
                {name: 'Lighting Outdoor', resource: 'Light1', yAxis: 0},
                {name: 'Lighting Indoor', resource: 'Light2', yAxis: 0},
            ],
            yAxis: [
                { title: { text: '%' }, minRange: 5}
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