define([], function() {

window.settings = {
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

});