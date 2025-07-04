#!/bin/bash
echo "Activando entorno virtual..."
source venv/bin/activate

echo "Iniciando el observador de archivos..."
python3 dashboard/py/run_watcher.py