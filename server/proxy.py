#!/usr/bin/env python
import SimpleHTTPServer
import urllib

try:
    from settings import RESOURCE_PATH
except ImportError:
    RESOURCE_PATH = "../server/resources"
    # or use remote resources eg.
    # RESOURCE_PATH = "http://growduino-backend"

class Proxy(SimpleHTTPServer.SimpleHTTPRequestHandler):
    def do_GET(self):
        if self.path in ['/config.jso'] or self.path.startswith('/sensors/'):
            self.copyfile(urllib.urlopen(RESOURCE_PATH + self.path), self.wfile)
        else:
            return SimpleHTTPServer.SimpleHTTPRequestHandler.do_GET(self)

    # def do_POST(self):
    #     length = int(self.headers.getheaders("Content-Length")[0])
    #     post_data = urlparse.parse_qs(self.rfile.read(length))
    #     print post_data
    #     #self.copyfile(urllib.urlopen(self.path, urllib.urlencode(post_data)), self.wfile)

if __name__ == '__main__':
    SimpleHTTPServer.test(HandlerClass=Proxy)