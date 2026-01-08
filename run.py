# run.py - VERSIÓN DEFINITIVA
import http.server
import socketserver
import webbrowser
import sys
from pathlib import Path

def verificar_archivos_esenciales():
    """Verifica que existen los archivos esenciales"""
    esenciales = [
        'index.html',
        'css/styles.css',
        'js/main.js'
    ]
    
    faltantes = []
    for archivo in esenciales:
        if not Path(archivo).exists():
            faltantes.append(archivo)
    
    return faltantes

def main():
    PORT = 8000
    HOST = 'localhost'
    
    print("\n" + "="*60)
    print("🚀 SERVIDOR DE DESARROLLO - CATERCLOUD")
    print("="*60)
    
    # Verificar archivos esenciales
    faltantes = verificar_archivos_esenciales()
    if faltantes:
        print("❌ ARCHIVOS FALTANTES:")
        for archivo in faltantes:
            print(f"   - {archivo}")
        print("\n💡 Solución: Ejecuta primero crear_frontend.py")
        print("   o copia manualmente los archivos a la raíz")
        sys.exit(1)
    
    # Mostrar estructura
    print("📂 ESTRUCTURA DETECTADA:")
    for item in sorted(Path('.').iterdir()):
        if item.name.startswith('__') or item.name.startswith('.'):
            continue
        if item.is_dir():
            print(f"   📁 {item.name}/")
            # Mostrar algunos archivos importantes dentro
            if item.name in ['css', 'js']:
                for subitem in sorted(item.iterdir()):
                    if subitem.suffix in ['.css', '.js']:
                        print(f"      📄 {subitem.name}")
        else:
            # Resaltar archivos importantes
            if item.suffix in ['.html', '.py']:
                print(f"   🌟 {item.name}")
            else:
                print(f"   📄 {item.name}")
    
    print(f"\n🌐 URL: http://{HOST}:{PORT}")
    print("="*60)
    
    # Configurar servidor
    handler = http.server.SimpleHTTPRequestHandler
    
    try:
        with socketserver.TCPServer((HOST, PORT), handler) as httpd:
            # Abrir navegador
            try:
                webbrowser.open(f'http://{HOST}:{PORT}')
                print("✅ Navegador abierto automáticamente")
            except:
                print(f"📋 Abre manualmente: http://localhost:{PORT}")
            
            print("\n⚡ SERVIDOR EN EJECUCIÓN")
            print("   Ctrl+C para detener")
            print("="*60 + "\n")
            
            httpd.serve_forever()
            
    except OSError as e:
        if "Address already in use" in str(e):
            print(f"⚠️  Puerto {PORT} ocupado. Probando 8001...")
            try:
                with socketserver.TCPServer((HOST, 8001), handler) as httpd:
                    webbrowser.open(f'http://{HOST}:8001')
                    print(f"✅ Servidor en http://localhost:8001")
                    httpd.serve_forever()
            except:
                print("❌ No se pudo iniciar en puertos 8000-8001")
                print("   Cierra otros programas o cambia el puerto")
        else:
            print(f"❌ Error: {e}")
        sys.exit(1)
    except KeyboardInterrupt:
        print("\n👋 Servidor detenido")
        sys.exit(0)

if __name__ == "__main__":
    main()