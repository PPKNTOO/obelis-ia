# dashboard/py/generate_readme.py
import os

# --- Configuración ---
# Encuentra la ruta raíz del proyecto (subiendo dos niveles desde la ubicación actual del script)
PROYECTO_RAIZ = os.path.abspath(os.path.join(os.path.dirname(__file__), '..', '..'))
DIRECTORIOS_A_IGNORAR = ['.git', 'node_modules', '.vercel', 'api', '__pycache__', 'dashboard']
NOMBRE_README = "README.md"
# --------------------

def generate_tree(dir_path, prefix=""):
    """Función recursiva que genera una línea del árbol de directorios."""
    try:
        # Filtra los elementos ignorados
        items = [item for item in sorted(os.listdir(dir_path)) if item not in DIRECTORIOS_A_IGNORAR]
    except FileNotFoundError:
        return ""

    tree_str = ""
    for i, item in enumerate(items):
        item_path = os.path.join(dir_path, item)
        is_last_item = (i == len(items) - 1)
        
        connector = "└── " if is_last_item else "├── "
        tree_str += prefix + connector + item + "\n"

        if os.path.isdir(item_path):
            new_prefix = prefix + ("    " if is_last_item else "│   ")
            tree_str += generate_tree(item_path, prefix=new_prefix)
            
    return tree_str

def main():
    """Función principal que inicia el script."""
    project_name = os.path.basename(PROYECTO_RAIZ)
    print("Generando la estructura del proyecto para el README...")
    
    # El escaneo comienza desde la raíz del proyecto
    tree_content = generate_tree(PROYECTO_RAIZ)

    # La ruta de salida ahora apunta a la raíz del proyecto
    ruta_salida_readme = os.path.join(PROYECTO_RAIZ, NOMBRE_README)

    with open(ruta_salida_readme, "w", encoding="utf-8") as f:
        f.write(f"# Estructura del Proyecto: {project_name}\n\n")
        f.write("```\n")
        f.write(f"{project_name}/\n")
        f.write(tree_content)
        f.write("```\n")
    
    print(f"✅ README.md generado exitosamente en: {ruta_salida_readme}")

if __name__ == "__main__":
    main()