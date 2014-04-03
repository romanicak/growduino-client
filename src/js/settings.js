define([], function() {

/* some keys are loaded from sensor status
    tzOffset
    triggerCount
*/
window.settings = {

    title: 'Growduino',

    /*limit number of used triggers on client side
      null = no limit (all firmaware triggers are used, usually 32)
    */
    triggerLimit: null,

    /* load only triggers marked as non-empty on previous save
       if true triggers saved outside app will not be recognized and can be accidentally rewritten
    */
    fastTriggerLoad: true,

    /* number of triggers reserved for alerts */
    alertLimit: 0,

    outputs: [
        {name: 'Timer 1'},
        {name: 'Timer 2'},
        {name: 'Pump'},
        {name: 'Fan', partial: 'fan.html'},
        {name: 'Humidifier', partial: 'humidifier.html'},
        {name: 'Heating', partial: 'heating.html'}
    ],

    sensors: [
        {resource: 'Humidity', divisor: 10},
        {resource: 'Temp1', divisor: 10},
        {resource: 'Light', divisor: 10},
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
                { title: { text: '' }, min: 0, minRange: 5},
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