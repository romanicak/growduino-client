//TODO angular module

app.factory('utils', function() {

    var utils = {};

    utils.fixNull = function(values) {
        return values.map(function(val) {
            return val == -999 ? null : val;
        });
    };


    utils.daysInMonth = function daysInMonth(month, year) {
        return new Date(year, month+1, 0).getDate();
    };

    utils.arrayPad = function(arr, size, value) {
        var missing = size - arr.length;
        var a = arr.slice();
        while (missing-- > 0) {
            a.push(value);
        }
        return a;
    };

    utils.timeToMinutes = function(val) {
        if ($.type(val) !== 'string') return null;
        var t = val.split(':');
        return parseInt(t[0], 10)*60+parseInt(t[1], 10);
    };

    utils.minutesToTime = function(val) {
        if (!$.isNumeric(val)) return null;
        var h = parseInt(val / 60, 10), m = val % 60;
        //TODO padstr fn
        return (h < 10 ? '0': '') + h + ":" + (m < 10 ? '0' : '') + m;
    };

    utils.generateId = function() {
        var randLetter = String.fromCharCode(65 + Math.floor(Math.random() * 26));
        var uniqid = randLetter + Date.now();
        return 'id_'+uniqid;
    };

    utils.seq = function(size) {
        var r = [];
        for (var i = 0; i < size; i++) r.push(i);
        return r;
    };

    utils.arrayUnique = function(a) {
        return a.reduce(function(p, c) {
            if (p.indexOf(c) < 0) p.push(c);
            return p;
        }, []);
    };

    utils.newArray = function(n, val) {
        return Array.apply(null, new Array(n)).map(function() { return val; })
    }

    //http://stackoverflow.com/questions/1068834/object-comparison-in-javascript
    utils.deepCompare = function() {
      var leftChain, rightChain;

      function compare2Objects (x, y) {
        var p;

        // remember that NaN === NaN returns false
        // and isNaN(undefined) returns true
        if (isNaN(x) && isNaN(y) && typeof x === 'number' && typeof y === 'number') {
             return true;
        }

        // Compare primitives and functions.
        // Check if both arguments link to the same object.
        // Especially useful on step when comparing prototypes
        if (x === y) {
            return true;
        }

        // Works in case when functions are created in constructor.
        // Comparing dates is a common scenario. Another built-ins?
        // We can even handle functions passed across iframes
        if ((typeof x === 'function' && typeof y === 'function') ||
           (x instanceof Date && y instanceof Date) ||
           (x instanceof RegExp && y instanceof RegExp) ||
           (x instanceof String && y instanceof String) ||
           (x instanceof Number && y instanceof Number)) {
            return x.toString() === y.toString();
        }

        // At last checking prototypes as good a we can
        if (!(x instanceof Object && y instanceof Object)) {
            return false;
        }

        if (x.isPrototypeOf(y) || y.isPrototypeOf(x)) {
            return false;
        }

        if (x.constructor !== y.constructor) {
            return false;
        }

        if (x.prototype !== y.prototype) {
            return false;
        }

        // check for infinitive linking loops
        if (leftChain.indexOf(x) > -1 || rightChain.indexOf(y) > -1) {
             return false;
        }

        // Quick checking of one object beeing a subset of another.
        // todo: cache the structure of arguments[0] for performance
        for (p in y) {
            if (y.hasOwnProperty(p) !== x.hasOwnProperty(p)) {
                return false;
            }
            else if (typeof y[p] !== typeof x[p]) {
                return false;
            }
        }

        for (p in x) {
            if (y.hasOwnProperty(p) !== x.hasOwnProperty(p)) {
                return false;
            }
            else if (typeof y[p] !== typeof x[p]) {
                return false;
            }

            switch (typeof (x[p])) {
                case 'object':
                case 'function':

                    leftChain.push(x);
                    rightChain.push(y);

                    if (!compare2Objects (x[p], y[p])) {
                        return false;
                    }

                    leftChain.pop();
                    rightChain.pop();
                    break;

                default:
                    if (x[p] !== y[p]) {
                        return false;
                    }
                    break;
            }
        }

        return true;
      }

      if (arguments.length < 1) {
        return true; //Die silently? Don't know how to handle such case, please help...
        // throw "Need two or more arguments to compare";
      }

      for (var i = 1, l = arguments.length; i < l; i++) {

          leftChain = []; //todo: this can be cached
          rightChain = [];

          if (!compare2Objects(arguments[0], arguments[i])) {
              return false;
          }
      }

      return true;
    };

    return utils;
});