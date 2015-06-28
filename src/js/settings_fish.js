window.settings = {

    title: 'Fish & Tomatoes',


    /*limit number of used triggers on client side
      null = no limit (all firmaware triggers are used, usually 32)
    */
    triggerLimit: null,

    /* load only triggers marked as non-empty on previous save
       if true triggers saved outside app will not be recognized and can be accidentally rewritten
    */
    fastTriggerLoad: true,

    /* number of triggers reserved for alerts */
    alertLimit: 11,

    outputs: [
        {name: 'Light', partial: 'fish/light.html'},
        {name: 'Fan', partial: 'fish/fan.html'},
        {name: 'Refill', partial: 'fish/refill.html'}
             ],

    sensors: {
        'Humidity': { divisor: 10, name: 'Relative Humidity'},
        'Temp1': { divisor: 10, name: 'Air Temperature'},
        'Temp2': { divisor: 10, name: 'Water Temperature'},
        'Temp3': { divisor: 10, name: 'Bulb Temperature'},
        'Light1': { divisor: 10, name: 'Lighting Outdoor'},
        'Light2': { divisor: 10, name: 'Lighting Indoor'},
        'Usnd': { divisor: 1, name: 'Water Level'}
    },

    //axis conf is Highcharts configuration
    charts: [
        {
            series: [
                {name: 'Air Temperature', resource: 'Temp1', yAxis: 0},
                {name: 'Bulb Temperature', resource: 'Temp3', yAxis: 0},
                {name: 'Relative Humidity', resource: 'Humidity', yAxis: 1}
            ],
            yAxis: [
                { title: { text: '°C' },  minRange: 5},
                { title: { text: '%' }, opposite: true, min: 0, minRange: 5}
            ]
        },
        {
            series: [
                {name: 'Lighting Outdoor', resource: 'Light1', yAxis: 0},
                {name: 'Lighting Indoor', resource: 'Light2', yAxis: 0}
            ],
            yAxis: [
                { title: { text: 'sun' }, min: 0, minRange: 5},
                { title: { text: 'sun' }, linkedTo: 0, opposite: true}
            ]
        },
        {
            series: [
                {name: 'Water Level', resource: 'Usnd', yAxis: 0},
                {name: 'Water Temperature', resource: 'Temp2', yAxis: 1}
            ],
            yAxis: [
                { title: { text: 'cm' }, min: 0, minRange: 5},
                { title: { text: '°C' }, opposite: true, min: 0, minRange: 5}
            ]
        },
    ]
};