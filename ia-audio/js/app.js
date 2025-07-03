// ia-audio/js/app.js

// 1. Importa el inicializador global desde la carpeta raíz de JS.
import { initGlobalApp } from "../../js/global.js";

// 2. Importa el inicializador específico de la página de ia-audio.
import { initApp as initAudioApp } from "./main.js";

// 3. Espera a que el DOM esté listo y ejecuta todo en el orden correcto.
document.addEventListener("DOMContentLoaded", () => {
  // Primero siempre lo global (navbar, modales, etc.).
  initGlobalApp();
  // Luego la lógica específica del generador de audio.
  initAudioApp();
});
