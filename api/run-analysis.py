# api/run-analysis.py
from flask import Flask, jsonify, request
import sys
import os
import subprocess

# Crea una aplicación Flask
app = Flask(__name__)

# Definimos la ruta de la API
@app.route('/api/run-analysis', methods=['POST'])
def run_analysis_endpoint():
    try:
        # Obtenemos la ruta raíz del proyecto para que los scripts se ejecuten correctamente
        project_root = os.path.abspath(os.path.join(os.path.dirname(__file__), '..'))
        
        script_path = os.path.join(project_root, 'dashboard', 'py', 'analizar_proyecto.py')

        print(f"Ejecutando script: {script_path}")
        
        # Ejecutamos el script de análisis usando subprocess
        # Esto es más robusto en un entorno de servidor
        result = subprocess.run(
            [sys.executable, script_path],
            capture_output=True,
            text=True,
            cwd=project_root  # Importante: establece el directorio de trabajo a la raíz
        )

        if result.returncode != 0:
            print(f"Error en el script de análisis: {result.stderr}")
            raise Exception(result.stderr)
        
        print(f"Salida del script: {result.stdout}")

        # La respuesta de éxito
        return jsonify({"message": "Análisis completado exitosamente."}), 200

    except Exception as e:
        print(f"Error en la API: {str(e)}")
        # La respuesta de error
        return jsonify({"message": "Falló la ejecución del script.", "error": str(e)}), 500

# Esta parte es para que Vercel sepa cómo manejar la aplicación
# No es necesaria si usas rutas de archivo, pero es una buena práctica
def handler(event, context):
    return app(event, context)