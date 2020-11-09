window.settings = {

    title: 'Growduino',


    /*limit number of used triggers on client side
      null = no limit (all firmaware triggers are used, usually 32)
    */
    triggerLimit: null,

    /* load only triggers marked as non-empty on previous save
       if true triggers saved outside app will not be recognized and can be accidentally rewritten
    */
    fastTriggerLoad: false,

    /* number of triggers reserved for alerts, 20160613 battery % alert included */
    alertLimit: 18,

    outputs: [
        {name: 'Light', partial: 'light.html'},
        {name: 'Fan', partial: 'fan.html'},
        {name: 'Humidifier', partial: 'humidifier.html'},
        {name: 'Watering', partial: 'watering.html'},
        {name: 'Refill', partial: 'refill.html'},
        {name: 'Heating', partial: 'heating.html'},
        {name: 'Water_Heating', partial: 'water_heating.html'},
        {name: 'Dehumidifier', partial: 'dehumidifier.html'},
        {name: 'CO2_Dispenser', partial: 'co2.html'},
        {name: 'FreeTimer', partial: 'freetimer.html'}
    ],

    sensors: {
        'Humidity': { divisor: 10, name: 'Relative Humidity'},
        'Temp1': { divisor: 10, name: 'Air Temperature'},
        'Temp2': { divisor: 10, name: 'Water Temperature'},
        'Temp3': { divisor: 10, name: 'Bulb Temperature'},
        'ECFan': { divisor: 1, name: 'EC Fan'},
        'Light1': { divisor: 1, name: 'Lighting Outdoor'},
        'Light2': { divisor: 1, name: 'Lighting Indoor'},
        'Usnd': { divisor: 1, name: 'Water Level'},
        'EC': { divisor: 100, name: 'Electric Conductivity'},
        'pH': { divisor: 100, name: 'Acidity'},
        'CO2': { divisor: 1, name: 'Carbon Dioxyde'},
        'Battery': { divisor: 1, name: 'Battery percent'}
    },

    //axis conf is Highcharts configuration
    charts: [
        {
            series: [
                {name: 'Air Temperature', resource: 'Temp1', yAxis: 0},
                {name: 'Water Temperature', resource: 'Temp2', yAxis: 0},
                {name: 'Relative Humidity', resource: 'Humidity', yAxis: 1},
                {name: 'Bulb Temperature', resource: 'Temp3', yAxis: 0},
            ],
            yAxis: [
                { title: { text: '°C' },  minRange: 5},
                { title: { text: '%' }, opposite: true, min: 0, minRange: 5}
            ]
        },
        {
            series: [
                {name: 'EC Fan', resource: 'ECFan', yAxis: 0}
            ],
            yAxis: [
                { title: { text: '%' },  min: 0, minRange: 5},
                { title: { text: '%' },  linkedTo: 0, opposite: true, min: 0, minRange: 5}
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
                {name: 'Water Level Distance', resource: 'Usnd', yAxis: 0}
            ],
            yAxis: [
                { title: { text: 'cm' }, min: 0, minRange: 5},
                { title: { text: 'cm' }, linkedTo: 0, opposite: true, min: 0, minRange: 5}
            ]
        },
        {
            series: [
                {name: 'EC', resource: 'EC', yAxis: 0},
                {name: 'pH', resource: 'pH', yAxis: 1}
            ],
            yAxis: [
                { title: { text: 'EC' },  min: 0, minRange: 5},
                { title: { text: 'pH' }, opposite: true, min: 0, minRange: 5}
            ]
        },
        {
            series: [
                {name: 'CO2 PPM', resource: 'CO2', yAxis: 0}
            ],
            yAxis: [
                { title: { text: 'CO2 PPM' },  min: 0, minRange: 5},
                { title: { text: 'CO2 PPM' },  linkedTo: 0, opposite: true, min: 0, minRange: 5}
            ]
        },
        {
            series: [
                {name: 'Battery', resource: 'Battery', yAxis: 0}
            ],
            yAxis: [
                { title: { text: '%' },  min: 0, minRange: 5},
                { title: { text: '%' },  linkedTo: 0, opposite: true, min: 0, minRange: 5}
            ]
        },
    ]
};
