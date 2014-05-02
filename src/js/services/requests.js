//TODO angular module

app.factory('requests', ['$q', function($q) {

    var queue = async.queue(function(task, done) {
        var d = task.deferred;
        task.fn().then(d.resolve, d.reject, d.notify).finally(done);
    }, 1);

    var requests = {};

    requests.push = function(fn) {
        var d = $q.defer();
        queue.push({
            fn: fn,
            deferred: d
        });
        return d.promise;
    };

    requests.clear = function() {
        queue.tasks.splice(0, queue.tasks.length);
    };

    requests.adapt = function(resource) {
        return {
            get: function() {
                var a = arguments;
                return requests.push(function() {
                    return resource.get.apply(resource, a).$promise;
                });
            },
            post: function() {
                return resource.post.apply(resource, arguments);
            }
        };
    };

    return requests;
}]);