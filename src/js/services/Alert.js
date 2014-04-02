define(['app', 'async'], function(app, async) {

app.factory('Alert', ['$http', function($http) {

    var Alert = function() {
        this.messages = {
            on: '',
            off: ''
        };
        this.target = null;
        this.trigger = null;
    };

    $.extend(Alert, {
        createDisabled: function(index) {
             return {on_message: "", off_message: "", target: "", trigger: -1, index: index};
        },

        loadMany: function(alertIndexes, alertLoaded, success) {
            if (alertIndexes.length === 0) {
                success();
                return;
            }
            var q = async.queue(function(index, done) {
                $http.get('/alerts/'+index+'.jso', {cache: false}).success(function(data) {
                    console.log('alert #'+index+' loaded', data);
                    data.index = index;
                    alertLoaded(data);
                }).finally(done);
            }, 1);
            q.drain = function() {
                success();
            };

            alertIndexes.forEach(function(index) {
                q.push(index);
            });
        },

        save: function(alerts, success)  {
            if (!alerts.length) {
                success();
                return;
            }
            var q = async.queue(function(alert, done) {
                var index = alert.index;
                console.log('Alert #'+index+' saved', alert);
                $http.post('/alerts/'+index+'.jso', alert).finally(done);
            }, 1);
            q.drain = function() {
                success();
            };
            alerts.forEach(function(alert) {
                q.push(alert);
            });
        },
    });

    return Alert;
}]);

});