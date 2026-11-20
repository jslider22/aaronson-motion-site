"""Local preview server that behaves like GitHub Pages for clean URLs:
/about serves about.html, /d2m serves d2m/index.html, unknown paths get 404.html.
Usage: python3 tools/serve.py [port]   (defaults to 8080, serves the project root)"""
import http.server, os, sys

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))


class Handler(http.server.SimpleHTTPRequestHandler):
    def __init__(self, *a, **k):
        super().__init__(*a, directory=ROOT, **k)

    def send_head(self):
        path = self.path.split("?", 1)[0].split("#", 1)[0]
        local = self.translate_path(path)
        if not os.path.exists(local) and os.path.exists(local + ".html"):
            self.path = path + ".html" + self.path[len(path):]
        elif not os.path.exists(local):
            self.send_response(404)
            body = open(os.path.join(ROOT, "404.html"), "rb").read()
            self.send_header("Content-Type", "text/html; charset=utf-8")
            self.send_header("Content-Length", str(len(body)))
            self.end_headers()
            import io
            return io.BytesIO(body)
        return super().send_head()


if __name__ == "__main__":
    port = int(sys.argv[1]) if len(sys.argv) > 1 else 8080
    http.server.ThreadingHTTPServer(("", port), Handler).serve_forever()
