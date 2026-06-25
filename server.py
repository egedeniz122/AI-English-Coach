import http.server
import socketserver
import sys

port = int(sys.argv[1]) if len(sys.argv) > 1 else 8000

class NoCacheHandler(http.server.SimpleHTTPRequestHandler):
    def end_headers(self):
        # Force the browser to never cache any files
        self.send_header('Cache-Control', 'no-store, no-cache, must-revalidate, max-age=0')
        self.send_header('Pragma', 'no-cache')
        self.send_header('Expires', '0')
        super().end_headers()

socketserver.TCPServer.allow_reuse_address = True
httpd = socketserver.TCPServer(('', port), NoCacheHandler)

print(f"Sunucu basladi: http://localhost:{port}")
print("Onbellek (Cache) devre disi birakildi. Guncellemeleriniz aninda gorunecek!")
print("Kapatmak icin CTRL+C basin veya pencereyi kapatin.")

try:
    httpd.serve_forever()
except KeyboardInterrupt:
    pass
