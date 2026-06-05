# verificar_completitud.py
from pathlib import Path

print("🔍 VERIFICANDO COMPLETITUD DE ARCHIVOS")
print("=" * 60)

archivos_verificar = {
    'index.html': {'min_lines': 100, 'buscar': ['<div id="dashboard"', '<form id="comandaCocinaForm"']},
    'css/styles.css': {'min_lines': 50, 'buscar': ['* {', 'body {', '.loader {']},
    'css/dashboard.css': {'min_lines': 30, 'buscar': ['.dashboard-container', '.dashboard-card']},
    'css/calendar.css': {'min_lines': 30, 'buscar': ['.calendar-container', '.calendar-days']},
    'css/forms.css': {'min_lines': 100, 'buscar': ['.container', '.form-section']},
    'js/main.js': {'min_lines': 50, 'buscar': ['document.addEventListener', 'manejarEnvioFormulario']},
    'js/dashboard.js': {'min_lines': 20, 'buscar': ['mostrarComandaCocina', 'volverAlDashboard']},
    'js/calendar.js': {'min_lines': 50, 'buscar': ['cargarCalendario', 'cambiarMes']},
    'js/comanda-form.js': {'min_lines': 200, 'buscar': ['cargarMenus', 'seleccionarMenu']},
    'js/historial.js': {'min_lines': 100, 'buscar': ['cargarHistorial', 'verDetalleComanda']},
    'js/storage.js': {'min_lines': 50, 'buscar': ['guardarComandaEnHistorial', 'generarCodigoComanda']}
}

todo_ok = True

for archivo, criterios in archivos_verificar.items():
    ruta = Path(archivo)
    
    if not ruta.exists():
        print(f"❌ FALTA: {archivo}")
        todo_ok = False
        continue
    
    with open(ruta, 'r', encoding='utf-8') as f:
        contenido = f.read()
        lineas = contenido.split('\n')
        
    # Verificar longitud
    if len(lineas) < criterios['min_lines']:
        print(f"⚠️  CORTO: {archivo} ({len(lineas)} líneas, mínimo {criterios['min_lines']})")
    
    # Verificar contenido clave
    contenido_ok = True
    for texto in criterios['buscar']:
        if texto not in contenido:
            print(f"   ⚠️  Falta: '{texto}' en {archivo}")
            contenido_ok = False
    
    if contenido_ok:
        print(f"✅ OK: {archivo} ({len(lineas)} líneas)")
    else:
        print(f"❌ INCOMPLETO: {archivo}")
        todo_ok = False

print("=" * 60)
if todo_ok:
    print("🎉 ¡TODOS LOS ARCHIVOS ESTÁN COMPLETOS!")
    print("   Ejecuta: python run.py")
else:
    print("⚠️  Hay archivos faltantes o incompletos.")
    print("   Copia el contenido completo de los archivos que te envié.")

# Mostrar primeras líneas de index.html para debug
print("\n📄 Primeras 5 líneas de index.html:")
try:
    with open('index.html', 'r', encoding='utf-8') as f:
        for i, linea in enumerate(f):
            if i < 5:
                print(f"   {i+1}: {linea.strip()}")
            else:
                break
except:
    print("   No se pudo leer index.html")