define(['app'], function(app) {

app.factory('divisors', function() {
    // var percentDivisor = function(values) {
    //     return values.map(function(val) {
    //     if (val === null) return null;
    //         return Math.round(val / 1.024) / 10.0;
    //     });
    // };

    var floatDivisor = function(values, divisor) {
        return values.map(function(val) {
            if (val === null) return null;
            return val / parseFloat(divisor);
        });
    };


    return {
        get: function(divisor) {
            // if (divisor === '%') {
            //     return percentDivisor;
            // }
            return function(values) {
                return floatDivisor(values, divisor);
            };
        }
    };
});

});