# api/run-analysis.py
from flask import Flask, jsonify, request
import sys
import os
import subprocess

# Crea una aplicación Flask simple
app = Flask(__name__)

# Definimos la ruta de la API
@app.route('/api/run-analysis', methods=['POST'])
def run_analysis_endpoint():
    try:
        # La ruta raíz del proyecto donde se ejecuta Vercel
        project_root = os.path.abspath(os.path.join(os.path.dirname(__file__), '..'))
        
        script_path = os.path.join(project_root, 'dashboard', 'py', 'analizar_proyecto.py')

        print(f"Ejecutando script: {script_path}")
        
        result = subprocess.run(
            [sys.executable, script_path],
            capture_output=True,
            text=True,
            cwd=project_root
        )

        if result.returncode != 0:
            print(f"Error en el script de análisis: {result.stderr}")
            raise Exception(result.stderr)
        
        print(f"Salida del script: {result.stdout}")
        return jsonify({"message": "Análisis completado exitosamente."}), 200

    except Exception as e:
        print(f"Error en la API: {str(e)}")
        return jsonify({"message": "Falló la ejecución del script.", "error": str(e)}), 500

# NOTA: El bloque if __name__ == '__main__': se elimina porque Vercel
# no lo usa. Vercel importa directamente la variable 'app'.