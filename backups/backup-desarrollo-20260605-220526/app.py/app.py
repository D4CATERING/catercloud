import http.server
import socketserver
import os

PORT = 8000
DIRECTORY = "."

class Handler(http.server.SimpleHTTPRequestHandler):
    def __init__(self, *args, **kwargs):
        super().__init__(*args, directory=DIRECTORY, **kwargs)

    def end_headers(self):
        # Habilitar CORS para desarrollo
        self.send_header('Access-Control-Allow-Origin', '*')
        self.send_header('Cache-Control', 'no-cache, no-store, must-revalidate')
        self.send_header('Pragma', 'no-cache')
        self.send_header('Expires', '0')
        super().end_headers()

def main():
    os.chdir(os.path.dirname(os.path.abspath(__file__)))
    
    print(f"🚀 Servidor CaterCloud iniciado en http://localhost:{PORT}")
    print("📁 Sirviendo archivos desde:", os.getcwd())
    print("\n📋 Rutas disponibles:")
    print(f"  • http://localhost:{PORT}/               - Dashboard principal")
    print(f"  • http://localhost:{PORT}/index.html     - Dashboard principal")
    print("\n🛑 Presiona Ctrl+C para detener el servidor\n")
    
    with socketserver.TCPServer(("", PORT), Handler) as httpd:
        try:
            httpd.serve_forever()
        except KeyboardInterrupt:
            print("\n👋 Servidor detenido")
            httpd.shutdown()

if __name__ == "__main__":
    main()