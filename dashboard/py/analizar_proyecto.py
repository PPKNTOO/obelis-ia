# dashboard/py/analizar_proyecto.py
import os
import json
import re
import hashlib

# --- Configuración ---
PROYECTO_RAIZ = os.path.abspath(os.path.join(os.path.dirname(__file__), '..', '..'))
ARCHIVOS_A_INCLUIR = ('.js', '.css', '.html', '.md')
DIRECTORIOS_A_IGNORAR = {'node_modules', '.git', '.vercel', 'api', '__pycache__', 'dashboard'}
NOMBRE_REPORTE_JSON = 'reporte_datos.json'

# Configuraciones de Rendimiento
ARCHIVOS_DE_IMAGEN = ('.png', '.jpg', '.jpeg', '.webp', '.gif', '.svg')
LIMITE_TAMANO_IMG_KB = 150  # Límite para considerar una imagen "pesada"
LIMITE_TAMANO_JS_KB = 50   # Límite para considerar un JS "pesado"
# --------------------

def analizar_complejidad(contenido):
    palabras_clave = ['if', 'for', 'while', 'case', 'catch', '&&', '||', '?', 'switch']
    return 1 + sum(contenido.count(palabra) for palabra in palabras_clave)

def analizar_archivo(filepath):
    try:
        with open(filepath, 'r', encoding='utf-8', errors='ignore') as f:
            contenido = f.read()
        
        ruta_relativa = os.path.relpath(filepath, PROYECTO_RAIZ).replace('\\', '/')
        num_lineas = len(contenido.splitlines())
        tamano_kb = round(os.path.getsize(filepath) / 1024, 2)
        complejidad = analizar_complejidad(contenido) if filepath.endswith('.js') else 0
        
        return { 'ruta': ruta_relativa, 'tamano_kb': tamano_kb, 'lineas': num_lineas, 'complejidad': complejidad }
    except Exception:
        return None

def analizar_readme():
    ruta_readme = os.path.join(PROYECTO_RAIZ, 'README.md')
    try:
        with open(ruta_readme, 'r', encoding='utf-8') as f:
            contenido = f.read()
        arbol_match = re.search(r"```(?:\w*\n)(.*?)\n```", contenido, re.DOTALL)
        return arbol_match.group(1).strip().splitlines() if arbol_match else []
    except FileNotFoundError:
        return []

def parse_readme_tree_to_json(tree_lines):
    if not tree_lines: return None
    root_name = tree_lines[0].strip().replace('/', '')
    json_tree = {'name': root_name, 'children': []}
    parent_stack = {0: json_tree}
    for line in tree_lines[1:]:
        indentation = len(line) - len(line.lstrip(' │'))
        level = indentation // 4
        name = line.strip(' │├─└').strip()
        node = {'name': name, 'children': []}
        parent_node = parent_stack.get(level)
        if parent_node: parent_node['children'].append(node)
        parent_stack[level + 1] = node
    return json_tree

def encontrar_tareas_pendientes():
    """ ✅ Escanea todos los archivos en busca de comentarios TODO y FIXME. """
    tareas = []
    for subdir, dirs, files in os.walk(PROYECTO_RAIZ):
        dirs[:] = [d for d in dirs if d not in DIRECTORIOS_A_IGNORAR]
        for filename in files:
            if filename.endswith(('.js', '.css', '.html')):
                filepath = os.path.join(subdir, filename)
                try:
                    with open(filepath, 'r', encoding='utf-8', errors='ignore') as f:
                        for i, linea in enumerate(f, 1):
                            if 'TODO:' in linea or 'FIXME:' in linea:
                                tareas.append({'ruta': os.path.relpath(filepath, PROYECTO_RAIZ).replace('\\', '/'), 'linea_num': i, 'texto': linea.strip()})
                except Exception:
                    continue
    return tareas

def analizar_rendimiento():
    """ ✅ Encuentra archivos de imagen y JS que superen los límites de tamaño. """
    archivos_pesados = {'imagenes': [], 'javascript': []}
    for subdir, dirs, files in os.walk(PROYECTO_RAIZ):
        dirs[:] = [d for d in dirs if d not in DIRECTORIOS_A_IGNORAR]
        for filename in files:
            filepath = os.path.join(subdir, filename)
            try:
                tamano_kb = round(os.path.getsize(filepath) / 1024, 2)
                ruta_relativa = os.path.relpath(filepath, PROYECTO_RAIZ).replace('\\', '/')
                if filename.lower().endswith(ARCHIVOS_DE_IMAGEN) and tamano_kb > LIMITE_TAMANO_IMG_KB:
                    archivos_pesados['imagenes'].append({'ruta': ruta_relativa, 'tamano_kb': tamano_kb})
                elif filename.lower().endswith('.js') and tamano_kb > LIMITE_TAMANO_JS_KB:
                    archivos_pesados['javascript'].append({'ruta': ruta_relativa, 'tamano_kb': tamano_kb})
            except FileNotFoundError:
                continue
    archivos_pesados['imagenes'] = sorted(archivos_pesados['imagenes'], key=lambda x: x['tamano_kb'], reverse=True)
    archivos_pesados['javascript'] = sorted(archivos_pesados['javascript'], key=lambda x: x['tamano_kb'], reverse=True)
    return archivos_pesados


def main():
    print("🚀 Iniciando análisis profesional avanzado del proyecto...")
    
    todos_los_archivos = []
    for subdir, dirs, files in os.walk(PROYECTO_RAIZ):
        dirs[:] = [d for d in dirs if d not in DIRECTORIOS_A_IGNORAR]
        for filename in files:
            if filename.endswith(('.js', '.css', '.html')):
                filepath = os.path.join(subdir, filename)
                analisis = analizar_archivo(filepath)
                if analisis: todos_los_archivos.append(analisis)

    reporte_final = {
        'total_archivos_analizados': len(todos_los_archivos),
        'archivos_mas_complejos': sorted([f for f in todos_los_archivos if f['complejidad'] > 0], key=lambda x: x['complejidad'], reverse=True)[:10],
        'archivos_mas_grandes': sorted(todos_los_archivos, key=lambda x: x['lineas'], reverse=True)[:10],
        'estructura_proyecto_json': parse_readme_tree_to_json(analizar_readme()),
        'tareas_pendientes': encontrar_tareas_pendientes(),       # ✅ Añade las tareas al reporte
        'informe_rendimiento': analizar_rendimiento()        # ✅ Añade el rendimiento al reporte
    }

    ruta_salida_json = os.path.join(PROYECTO_RAIZ, 'reporte_datos.json')
    with open(ruta_salida_json, 'w', encoding='utf-8') as f:
        json.dump(reporte_final, f, indent=2)
        
    print(f"✅ Análisis completado. Datos guardados en: '{ruta_salida_json}'.")

if __name__ == "__main__":
    main()