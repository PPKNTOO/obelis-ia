// js/home-app.js

// 1. Importa la función de inicialización global desde nuestro archivo central.
import { initGlobalApp } from "./global.js";

// 2. Espera a que el DOM de la página principal esté completamente cargado.
document.addEventListener("DOMContentLoaded", () => {
  // 3. Ejecuta la función de inicialización global.
  // Esta función se encargará de encontrar los elementos de la navbar,
  // el carrusel, los modales, etc., y les asignará sus scripts.
  initGlobalApp();
});
// 4. Aquí puedes agregar más lógica específica de la página principal si es necesario.
// Por ejemplo, si tienes un carrusel o algún otro componente específico,
