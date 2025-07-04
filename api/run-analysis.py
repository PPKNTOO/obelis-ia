# api/run-analysis.py
from http.server import BaseHTTPRequestHandler
import json
import sys
import os

# Añadimos la ruta a los scripts del dashboard para poder importarlos
# Esto le dice a Python: "Busca también en la carpeta dashboard/py"
sys.path.append(os.path.join(os.getcwd(), 'dashboard', 'py'))

# Importamos las funciones 'main' de tus scripts
from analizar_proyecto import main as analizar
from generate_readme import main as generar_readme

class handler(BaseHTTPRequestHandler):
    def do_POST(self):
        try:
            print("Iniciando análisis desde la función de API de Python...")
            
            # Ejecuta las funciones de tus scripts
            analizar()
            generar_readme()
            
            # Envía una respuesta de éxito
            self.send_response(200)
            self.send_header('Content-type', 'application/json')
            self.end_headers()
            response = {'message': 'Análisis completado exitosamente desde Python.'}
            self.wfile.write(json.dumps(response).encode('utf-8'))
            
        except Exception as e:
            # Si algo falla, envía una respuesta de error
            self.send_response(500)
            self.send_header('Content-type', 'application/json')
            self.end_headers()
            response = {'message': 'Falló la ejecución del script.', 'error': str(e)}
            self.wfile.write(json.dumps(response).encode('utf-8'))