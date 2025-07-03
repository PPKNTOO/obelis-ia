# generate_readme.py
# ejecuta en la raiz "python3 generate-readme.py"

import os

def generate_tree(dir_path, prefix="", is_last=False):
    """
    Función recursiva que genera una línea del árbol de directorios.
    """
    # Ignorar directorios y archivos específicos
    ignore_list = ['.git', 'node_modules', '.vercel', '__pycache__', '.env', '.env.local', 'generate_readme.py', 'README.md']
    
    try:
        # Obtener una lista de todos los archivos y directorios, excluyendo los ignorados
        items = [item for item in sorted(os.listdir(dir_path)) if item not in ignore_list]
    except FileNotFoundError:
        return ""

    tree_str = ""
    for i, item in enumerate(items):
        item_path = os.path.join(dir_path, item)
        is_last_item = (i == len(items) - 1)
        
        # Elige el conector correcto (└── para el último, ├── para los demás)
        connector = "└── " if is_last_item else "├── "
        tree_str += prefix + connector + item + "\n"

        # Si es un directorio, llama a la función de forma recursiva
        if os.path.isdir(item_path):
            # Elige el prefijo para la siguiente línea (con o sin la línea vertical)
            new_prefix = prefix + ("    " if is_last_item else "│   ")
            tree_str += generate_tree(item_path, prefix=new_prefix)
            
    return tree_str

def main():
    """
    Función principal que inicia el script.
    """
    project_root = os.getcwd() # Obtiene la ruta de la carpeta actual
    project_name = os.path.basename(project_root)

    print("Generando la estructura del proyecto...")
    
    # Genera el contenido del árbol
    tree_content = generate_tree(project_root)

    # Escribe el contenido en el archivo README.md
    with open("README.md", "w", encoding="utf-8") as f:
        f.write(f"# Estructura del Proyecto: {project_name}\n\n")
        f.write("```\n")
        f.write(f"{project_name}/\n")
        f.write(tree_content)
        f.write("```\n")
    
    print("✅ README.md generado exitosamente.")

if __name__ == "__main__":
    main()