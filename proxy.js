var http = require('http'),
    httpProxy = require('http-proxy'),
    nodeStatic = require('node-static');

var connect = require('connect');
var bodyParser = connect.bodyParser();
var request = require('request');

//var TARGET = 'arduino.natur.cuni.cz';
var TARGET = '78.108.106.180';

var proxy = httpProxy.createProxyServer({target: "http://"+TARGET});
var staticServer = new nodeStatic.Server('./src');

function proxyPost(req, res) {
    bodyParser(req, res, function() {
        request({
            method: 'POST',
            url: 'http://'+TARGET+req.url,
            json: req.body,
            headers: {
                'Accept': 'application/json, text/plain, */*',
                'Origin': 'http://'+TARGET,
                'Referer': 'http://'+TARGET+'/'
            }
        }, function (error, response, body) {
            res.statusCode = 200;
            res.end();
        });
    });
}

var server = require('http').createServer(function(req, res) {
    //console.log(req.url);
    if (req.method == 'OPTIONS') {
        res.statisCode = 200;
        res.setHeader('Access-Control-Allow-Origin', '*');
        res.end();
        return;
    }

    if (req.url.match(/^\/(sensors|triggers|DATA|config.jso|client.jso)/)) {
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
