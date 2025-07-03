// ia-text/js/app.js

// 1. Importa el inicializador global desde la carpeta raíz de JS.
import { initGlobalApp } from "../../js/global.js";

// 2. Importa el inicializador específico de la página de ia-text.
import { initApp as initIaTextApp } from "./main.js";

// 3. Espera a que el DOM esté listo y ejecuta todo en orden.
document.addEventListener("DOMContentLoaded", () => {
  initGlobalApp(); // Primero siempre lo global (navbar, modales, etc.).
  initIaTextApp(); // Luego la lógica de la página de texto.
});
