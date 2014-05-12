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

    requests.adapt = function(resource, methods) {
        if (typeof methods === "undefined") {
            methods = ['get', 'save', 'post'];
        }
        var proxy = {};
        methods.forEach(function(method) {
            proxy[method] = function() {
                var a = arguments;
                return requests.push(function() {
                    return resource[method].apply(resource, a).$promise;
                });
            };
        });
        // proxy.post = function() {
        //     return resource.post.apply(resource, arguments);
        // }
        return proxy;
    };

    return requests;
}]);