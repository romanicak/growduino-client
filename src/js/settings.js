(function() {

window.settings = {
    /* TODO read from /sensors/status.jso: timeZoneffset = -tz * 60 */
    tzOffset: -60,

    /*limit number of used triggers on client side
      null = no limit (all firmaware triggers are used, usually 32)
    */
    triggerLimit: 10,

    outputs: [
        'Timer 1',
        'Timer 2',
        'Pump',
        'Fan',
        'Humidifier',
        'Heating'
    ],

    sensors: [
        'Humidity',
        'Temp1',
        'Light',
        'Usnd',
        'Temp2',
        'Temp3'
    ]
};

})();