// raiz/js/matrix-effect.js

// No necesitamos importar DOMElements aquí si no lo usamos directamente en este archivo.
// Se asume que initMatrixEffect se llama desde global.js que sí maneja DOMElements.

export function initMatrixEffect() {
  const body = document.body;

  // Si el contenedor ya existe, no hagas nada para evitar duplicados.
  if (document.querySelector(".matrix-rain")) {
    // console.log("Matrix effect already initialized."); // Minimalismo: eliminar logs
    return;
  }

  const matrixRainContainer = document.createElement("div");
  matrixRainContainer.classList.add("matrix-rain");
  body.insertBefore(matrixRainContainer, body.firstChild); // Añadir como el primer hijo del body

  const characters = "01";
  const fontSize = 16;
  const dropSpeed = 0.15; // Ajusta este valor para la densidad

  // Dimensiones del viewport, ya no necesitamos document.documentElement.scrollHeight
  let viewportWidth = window.innerWidth;
  let viewportHeight = window.innerHeight;

  // Calculamos la longitud máxima de caracteres para llenar aproximadamente 1.5 viewports de alto
  // Esto es para que las columnas tengan suficiente "cuerpo" visual
  const maxColumnCharacters = Math.ceil((viewportHeight * 1.5) / fontSize);

  // Limitar el número máximo de columnas visibles simultáneamente para rendimiento
  const maxActiveColumnsFactor = 1.0;
  let maxVisibleColumns =
    Math.floor(viewportWidth / fontSize) * maxActiveColumnsFactor;
  maxVisibleColumns = Math.max(maxVisibleColumns, 50); // Mínimo de columnas para que se vea el efecto

  const columnPool = [];
  // Pre-llenar el pool con una cantidad suficiente para evitar creación dinámica constante
  for (let i = 0; i < maxVisibleColumns * 1.5; i++) {
    columnPool.push(createColumnElement());
  }

  function createColumnElement() {
    const column = document.createElement("div");
    column.classList.add("matrix-column");
    return column;
  }

  let animationFrameId; // Para controlar requestAnimationFrame
  let isEffectActive = false; // Para controlar si el efecto está en ejecución

  function startMatrixEffect() {
    cancelAnimationFrame(animationFrameId); // Detener animación previa
    isEffectActive = true; // El efecto está ahora activo

    // Con position: fixed, el contenedor siempre cubre el viewport.
    // No necesitamos establecer su altura en JS basada en scrollHeight.
    // matrixRainContainer.style.height = `${currentDocumentHeight}px`; // ELIMINAR

    // Limpieza más eficiente: Mueve los hijos activos al pool antes de limpiar.
    while (matrixRainContainer.firstChild) {
      const child = matrixRainContainer.removeChild(
        matrixRainContainer.firstChild
      );
      columnPool.push(child);
    }
    // Asegurarse de que el pool tenga suficientes elementos después de la limpieza.
    while (columnPool.length < maxVisibleColumns * 1.5) {
      columnPool.push(createColumnElement());
    }

    const currentColumnsToDisplay = Math.floor(viewportWidth / fontSize);
    const activeColumnsPositions = new Set(); // Rastrea las posiciones activas para evitar superposición.

    function animate() {
      if (!isEffectActive) return; // Si el efecto fue desactivado, salir.

      // Procesar solo las columnas que están actualmente en el contenedor.
      const currentActiveDomColumns = Array.from(matrixRainContainer.children);

      for (let i = 0; i < currentActiveDomColumns.length; i++) {
        const col = currentActiveDomColumns[i];
        if (!col.parentNode) continue; // Si la columna ya no está en el DOM, saltar.

        const fallDuration = parseFloat(col.style.animationDuration);
        const currentTime = (performance.now() / 1000) % fallDuration;
        const progress = currentTime / fallDuration;

        // Condición de eliminación: casi al final de la animación y casi transparente
        if (
          progress >= 0.99 &&
          parseFloat(getComputedStyle(col).opacity) < 0.05
        ) {
          col.remove(); // Remueve del DOM
          columnPool.push(col); // Devuelve al pool
          const leftPos = parseFloat(
            col.style.getPropertyValue("--column-left")
          );
          activeColumnsPositions.delete(leftPos); // Libera la posición
        }
      }

      // Control de densidad y aparición de nuevas columnas
      const currentActiveCount = matrixRainContainer.children.length; // Conteo real de elementos en el DOM
      let actualDropSpeed = dropSpeed;

      // Reducir la velocidad de aparición si hay demasiadas columnas
      if (currentActiveCount > maxVisibleColumns * 0.8) {
        actualDropSpeed = dropSpeed * 0.5;
      }
      if (currentActiveCount > maxVisibleColumns) {
        actualDropSpeed = 0; // Detener completamente si se excede el límite
      }
      // isScrolling logic is removed as it's less critical for fixed elements
      // and simplifies the code.

      if (Math.random() < actualDropSpeed) {
        let availableLeft = [];
        for (let i = 0; i < currentColumnsToDisplay; i++) {
          const leftPos = i * fontSize;
          if (!activeColumnsPositions.has(leftPos)) {
            availableLeft.push(leftPos);
          }
        }

        // Si hay posiciones disponibles y no hemos excedido el límite de columnas activas
        if (
          availableLeft.length > 0 &&
          currentActiveCount < maxVisibleColumns * 1.1
        ) {
          const randomLeft =
            availableLeft[Math.floor(Math.random() * availableLeft.length)];
          let column;

          if (columnPool.length > 0) {
            column = columnPool.pop();
            matrixRainContainer.appendChild(column); // Añadir al DOM cuando se usa
          } else {
            // console.warn("Column pool exhausted, creating new element."); // Minimalismo: eliminar logs
            column = createColumnElement();
            matrixRainContainer.appendChild(column);
          }

          column.style.setProperty("--column-left", `${randomLeft}px`);

          // Duración de la caída basada solo en la altura del viewport.
          // Esto simplifica el cálculo ya que el efecto es fijo.
          const baseFallDuration = Math.random() * 8 + 4; // Duración base de 4 a 12 segundos
          const finalFallDuration = baseFallDuration; // No se escala con la altura del documento

          const minAllowedFallDuration = 8;
          const maxAllowedFallDuration = 40; // Mantener un límite superior razonable
          const regulatedFallDuration = Math.min(
            Math.max(finalFallDuration, minAllowedFallDuration),
            maxAllowedFallDuration
          );

          column.style.setProperty(
            "--fall-duration",
            `${regulatedFallDuration}s`
          );

          let columnContent = "";
          for (let i = 0; i < maxColumnCharacters; i++) {
            columnContent +=
              characters[Math.floor(Math.random() * characters.length)] +
              "<br>";
          }
          column.innerHTML = columnContent;

          // Reiniciar la animación (esto fuerza un reflow, es inevitable para reiniciar)
          column.style.animation = "none";
          void column.offsetWidth;
          column.style.animation = `fall linear infinite`;
          column.style.animationDuration = `${regulatedFallDuration}s`;
          column.style.left = `${randomLeft}px`;

          activeColumnsPositions.add(randomLeft);
        }
      }
      animationFrameId = requestAnimationFrame(animate);
    }
    // Iniciar el bucle de animación
    animate();
  }

  // Función para detener el efecto completamente (liberar recursos)
  function stopMatrixEffect() {
    if (!isEffectActive) return;
    cancelAnimationFrame(animationFrameId);
    isEffectActive = false;
    // Limpiar el contenedor y devolver todos los elementos al pool.
    while (matrixRainContainer.firstChild) {
      const child = matrixRainContainer.removeChild(
        matrixRainContainer.firstChild
      );
      columnPool.push(child);
    }
  }

  // --- Manejo de eventos y debounce/throttle ---
  let resizeTimeout;
  const updateMatrixDimensions = () => {
    clearTimeout(resizeTimeout);
    resizeTimeout = setTimeout(() => {
      viewportWidth = window.innerWidth;
      viewportHeight = window.innerHeight;
      // No necesitamos currentDocumentHeight aquí.
      maxVisibleColumns =
        Math.floor(viewportWidth / fontSize) * maxActiveColumnsFactor;
      maxVisibleColumns = Math.max(maxVisibleColumns, 50); // Mínimo
      startMatrixEffect(); // Reiniciar completamente para adaptarse
    }, 300);
  };
  window.addEventListener("resize", updateMatrixDimensions);

  // Pausar animación cuando la pestaña no está activa
  document.addEventListener("visibilitychange", () => {
    if (document.hidden) {
      cancelAnimationFrame(animationFrameId);
      isEffectActive = false;
    } else {
      startMatrixEffect(); // Reanudar
    }
  });

  // El MutationObserver es mucho menos crítico con fixed, ya que no afecta la altura del efecto.
  // Podemos eliminarlo para mayor minimalismo si no hay cambios en el DOM que afecten el viewport
  // o si no hay un comportamiento muy dinámico que haga que las columnas se "pierdan".
  // Sin embargo, si quieres mantener una robustez extrema ante cambios de dimensiones del viewport
  // (ej. barra de direcciones del móvil que aparece/desaparece), puedes mantenerlo y ajustar el debounce.
  // Para este objetivo de minimalismo, lo eliminamos.
  /*
    let mutationDebounceTimeout;
    const observer = new MutationObserver((mutations) => {
      clearTimeout(mutationDebounceTimeout);
      mutationDebounceTimeout = setTimeout(() => {
        // ... (lógica del observer si es necesario) ...
      }, 500);
    });
    observer.observe(document.body, { childList: true, subtree: true, attributes: true });
    */

  // Evento 'load' es menos crítico con fixed, ya que el efecto no espera el contenido para calcular su altura.
  // Puede eliminarse si no hay razones específicas para reiniciar el efecto después de la carga completa de recursos.
  // Pero lo mantendremos para el primer inicio si hay algún retraso en el cálculo inicial de viewport.
  window.addEventListener("load", startMatrixEffect); // Llamamos directamente a startMatrixEffect

  // Llama a startMatrixEffect justo al final para iniciar el efecto.
  // La carga inicial también se gestiona por el 'load' listener.
  // Pero esto asegura que se inicie incluso si 'load' ya se disparó.
  // Lo mejor es que global.js lo llame justo cuando el DOM está listo.
  startMatrixEffect();
}
