# crear_frontend.py
import os
from pathlib import Path

def crear_estructura_frontend():
    """Crea la estructura correcta para el frontend de CaterCloud"""
    
    print("🚀 CREANDO ESTRUCTURA FRONTEND PARA CATERCLOUD")
    print("=" * 50)
    
    # Crear directorios necesarios
    directorios = ['css', 'js', 'assets/icons', 'assets/images']
    
    for directorio in directorios:
        Path(directorio).mkdir(parents=True, exist_ok=True)
        print(f"✅ Carpeta creada: {directorio}/")
    
    # Lista de archivos a crear
    archivos = {
        # HTML
        'index.html': """<!DOCTYPE html>
<html lang="es">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>CaterCloud - Sistema de Comandas</title>
    <link rel="stylesheet" href="css/styles.css">
    <link rel="stylesheet" href="css/dashboard.css">
    <link rel="stylesheet" href="css/calendar.css">
    <link rel="stylesheet" href="css/forms.css">
</head>
<body>
    <div id="dashboard" class="dashboard-container">
        <!-- El contenido se cargará aquí -->
        <h1>🍽️ CaterCloud</h1>
        <p>Cargando aplicación...</p>
    </div>
    
    <script src="js/storage.js"></script>
    <script src="js/calendar.js"></script>
    <script src="js/dashboard.js"></script>
    <script src="js/comanda-form.js"></script>
    <script src="js/historial.js"></script>
    <script src="js/main.js"></script>
</body>
</html>""",
        
        # CSS placeholder
        'css/styles.css': "/* styles.css - Cargar contenido completo después */",
        'css/dashboard.css': "/* dashboard.css - Cargar contenido completo después */",
        'css/calendar.css': "/* calendar.css - Cargar contenido completo después */",
        'css/forms.css': "/* forms.css - Cargar contenido completo después */",
        
        # JS placeholders
        'js/main.js': "// main.js - Cargar contenido completo después",
        'js/dashboard.js': "// dashboard.js - Cargar contenido completo después",
        'js/calendar.js': "// calendar.js - Cargar contenido completo después",
        'js/comanda-form.js': "// comanda-form.js - Cargar contenido completo después",
        'js/historial.js': "// historial.js - Cargar contenido completo después",
        'js/storage.js': "// storage.js - Cargar contenido completo después"
    }
    
    # Crear archivos
    for archivo, contenido in archivos.items():
        with open(archivo, 'w', encoding='utf-8') as f:
            f.write(contenido)
        print(f"✅ Archivo creado: {archivo}")
    
    print("=" * 50)
    print("🎯 ESTRUCTURA CREADA. Ahora copia el contenido real:")
    print("")
    print("1. Copia el CSS de cada archivo que te envié a:")
    print("   - css/styles.css")
    print("   - css/dashboard.css")
    print("   - css/calendar.css")
    print("   - css/forms.css")
    print("")
    print("2. Copia el JavaScript a:")
    print("   - js/main.js")
    print("   - js/dashboard.js")
    print("   - js/calendar.js")
    print("   - js/comanda-form.js")
    print("   - js/historial.js")
    print("   - js/storage.js")
    print("")
    print("3. Copia TODO el contenido HTML a index.html")
    print("")
    print("4. Ejecuta: python run.py")
    print("=" * 50)

if __name__ == "__main__":
    crear_estructura_frontend()