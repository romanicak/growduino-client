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
    });

    return Alert;
}]);

});