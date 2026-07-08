from http.server import SimpleHTTPRequestHandler, ThreadingHTTPServer


class NoCacheHandler(SimpleHTTPRequestHandler):
    def _drop_cache_conditionals(self):
        for header in ("If-Modified-Since", "If-None-Match"):
            if header in self.headers:
                self.headers.replace_header(header, "")

    def do_GET(self):
        self._drop_cache_conditionals()
        super().do_GET()

    def do_HEAD(self):
        self._drop_cache_conditionals()
        super().do_HEAD()

    def end_headers(self):
        self.send_header("Cache-Control", "no-store, max-age=0")
        self.send_header("Pragma", "no-cache")
        self.send_header("Expires", "0")
        super().end_headers()


if __name__ == "__main__":
    server = ThreadingHTTPServer(("", 4321), NoCacheHandler)
    print("Serving landing page with no-cache headers on http://localhost:4321")
    server.serve_forever()
