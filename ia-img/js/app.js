// ia-img/js/app.js

import { initGlobalApp } from "../../js/global.js";
import { initApp as initIaImgApp } from "./main.js";

// Este es el único lugar en toda la aplicación con un DOMContentLoaded.
// Actúa como el 'initializeApp' de tu archivo original.
document.addEventListener("DOMContentLoaded", () => {
  // 1. Inicializa los componentes globales (modales, navbar, etc.).
  // Esto llenará la primera parte del objeto DOMElements.
  initGlobalApp();

  // 2. Inicializa la lógica específica de esta página (generador de imágenes).
  // Esto completará el objeto DOMElements y asignará los listeners.
  initIaImgApp();
});
