# dashboard/py/run_watcher.py
import time
import subprocess
import os
from watchdog.observers import Observer
from watchdog.events import FileSystemEventHandler

# --- Configuración ---
PROYECTO_RAIZ = os.path.abspath(os.path.join(os.path.dirname(__file__), '..', '..'))
ARCHIVOS_A_OBSERVAR = ('.js', '.css', '.html')
DIRECTORIOS_A_IGNORAR = {'node_modules', '.git', '.vercel', 'api', '__pycache__', 'dashboard'}
SCRIPT_ANALISIS = 'analizar_proyecto.py'
SCRIPT_README = 'generate_readme.py'
# --------------------

class ChangeHandler(FileSystemEventHandler):
    """Clase que maneja los eventos de cambio en el sistema de archivos."""
    
    # Usamos un set para evitar ejecuciones múltiples muy seguidas
    _scripts_to_run = set()
    _last_run_time = 0

    def on_any_event(self, event):
        """Se activa con cualquier evento (creación, modificación, eliminación)."""
        # Ignora los eventos en directorios ignorados
        if any(ignored_dir in event.src_path for ignored_dir in DIRECTORIOS_A_IGNORAR):
            return

        # Solo nos interesan los archivos con las extensiones que definimos
        if event.is_directory or not event.src_path.endswith(ARCHIVOS_A_INCLUIR):
            return

        # Añade los scripts a la cola de ejecución
        self._scripts_to_run.add(SCRIPT_ANALISIS)
        self._scripts_to_run.add(SCRIPT_README)
        
        # Ejecuta los análisis si ha pasado al menos 2 segundos desde la última vez
        # Esto evita que se ejecute muchas veces si guardas varios archivos a la vez
        current_time = time.time()
        if current_time - self._last_run_time > 2 and self._scripts_to_run:
            print("\n🔄 Archivos modificados detectados. Ejecutando análisis...")
            
            # Ejecuta cada script en la cola
            for script in list(self._scripts_to_run):
                try:
                    # Llama al script de Python usando el intérprete de Python
                    subprocess.run(['python3', script], check=True, cwd=os.path.dirname(__file__))
                except subprocess.CalledProcessError as e:
                    print(f"❌ Error al ejecutar {script}: {e}")
                except FileNotFoundError:
                    # Intenta con 'python' si 'python3' no se encuentra
                    try:
                        subprocess.run(['python', script], check=True, cwd=os.path.dirname(__file__))
                    except Exception as e:
                         print(f"❌ Error crítico al ejecutar {script}. Asegúrate de que Python esté instalado y en el PATH.")

            self._scripts_to_run.clear()
            self._last_run_time = current_time
            print("✨ Observando cambios...")


def main():
    """Función principal que inicia el observador."""
    event_handler = ChangeHandler()
    observer = Observer()
    # Le decimos al observador que vigile la carpeta raíz del proyecto de forma recursiva
    observer.schedule(event_handler, PROYECTO_RAIZ, recursive=True)
    
    print("✨ Observador iniciado. Esperando cambios en los archivos...")
    print(f"   (Vigilando la carpeta: {PROYECTO_RAIZ})")
    print("   (Presiona Ctrl+C para detener)")
    
    observer.start()
    try:
        while True:
            time.sleep(1)
    except KeyboardInterrupt:
        observer.stop()
    observer.join()
    print("\n🛑 Observador detenido.")


if __name__ == "__main__":
    main()