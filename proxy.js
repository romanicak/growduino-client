var http = require('http'),
    httpProxy = require('http-proxy'),
    nodeStatic = require('node-static');

var connect = require('connect');
var bodyParser = connect.bodyParser();

var TARGET = 'arduino.natur.cuni.cz';
// var TARGET = http://78.108.106.180;

var proxy = httpProxy.createProxyServer({target: "http://"+TARGET});
var staticServer = new nodeStatic.Server('./src');

function proxyPost(req, res) {
    bodyParser(req, res, function() {
        var rr = http.request({
            host: TARGET,
            path: req.url,
        }, function(remoteResp) {
            var str = '';
            remoteResp.on('data', function (chunk) {
                str += chunk;
            });
            remoteResp.on('end', function () {
                for (var header in remoteResp.headers) {
                    res.setHeader(header, remoteResp.headers[header]);
                }
                res.statusCode = 200;
                res.write(str);
                res.end();
            });

        });
        rr.write(""+req.body);
        rr.end();
    });
}

var server = require('http').createServer(function(req, res) {
    //console.log(req.url);
    if (req.url.match(/^\/(sensors|triggers|DATA|config.jso)/)) {
        if (req.method == 'POST') {
            proxyPost(req, res);
        } else {
            proxy.proxyRequest(req, res);
        }

    } else {
        req.addListener('end', function () {
            staticServer.serve(req, res);
        }).resume();
    }
});

console.log("listening on port 8000");
server.listen(8000);
