// dashboard/js/app.js

document.addEventListener("DOMContentLoaded", async () => {
  // Intenta cargar los datos existentes al iniciar
  try {
    const response = await fetch("/reporte_datos.json");
    if (!response.ok) {
      throw new Error(
        "No se pudo cargar el reporte. Ejecuta un análisis para generarlo."
      );
    }
    const data = await response.json();
    updateDashboard(data);
  } catch (error) {
    console.warn("Advertencia al cargar datos iniciales:", error);
    // No es un error crítico si el archivo no existe al principio
    // Se puede mostrar un estado inicial o un mensaje para que el usuario escanee.
  }

  // Asigna el evento al botón de escaneo
  const scanButton = document.getElementById("scan-button");
  if (scanButton) {
    scanButton.addEventListener("click", handleScanButtonClick);
  }
});

/**
 * Rellena todas las secciones del dashboard con los datos del análisis.
 * @param {object} data - El objeto JSON con los datos del reporte.
 */
function updateDashboard(data) {
  populateKPIs(data);
  renderPerformanceReport(data.informe_rendimiento);
  renderTodosReport(data.tareas_pendientes);

  if (data.estructura_proyecto_json) {
    // Limpia el SVG anterior antes de dibujar uno nuevo para evitar duplicados
    d3.select("#project-tree-svg").selectAll("*").remove();
    renderD3Tree(data.estructura_proyecto_json);
  }

  renderBarChart(
    "complexity-chart",
    "Complejidad",
    data.archivos_mas_complejos,
    "ruta",
    "complejidad",
    "#eab308"
  );
  renderBarChart(
    "size-chart",
    "Líneas",
    data.archivos_mas_grandes,
    "ruta",
    "lineas",
    "#38bdf8"
  );
}

/**
 * Maneja el clic en el botón "Escanear Proyecto".
 * Llama a la API para ejecutar el script de análisis y recarga la página.
 */
async function handleScanButtonClick() {
  const scanButton = document.getElementById("scan-button");
  const icon = scanButton.querySelector("i");
  const text = scanButton.querySelector("span");

  // Pone el botón en estado de "cargando"
  scanButton.disabled = true;
  icon.className = "fas fa-sync-alt fa-spin"; // Ícono de carga con animación
  text.textContent = "Analizando...";

  try {
    // Llama a la API que ejecuta el script de Python
    const response = await fetch("/api/run-analysis", { method: "POST" });

    if (!response.ok) {
      const errorResult = await response.json();
      throw new Error(
        errorResult.error || "La respuesta del servidor no fue OK"
      );
    }

    const result = await response.json();
    console.log("Respuesta del servidor:", result.message);

    // Muestra un mensaje de éxito y recarga la página para ver los nuevos datos
    alert("Análisis completado. El dashboard se actualizará.");
    location.reload(); // Recarga la página para obtener el nuevo JSON
  } catch (error) {
    console.error("Error al escanear el proyecto:", error);
    alert(
      `Ocurrió un error al ejecutar el análisis:\n\n${error.message}\n\nRevisa la consola del navegador y del servidor para más detalles.`
    );
    // Restaura el botón al estado original en caso de error
    scanButton.disabled = false;
    icon.className = "fas fa-play";
    text.textContent = "Ejecutar Análisis";
  }
}

// --- FUNCIONES DE RENDERIZADO (sin cambios) ---

function populateKPIs(data) {
  document.getElementById("kpi-total-files").textContent =
    data.total_archivos_analizados || 0;
  const totalLines = (data.archivos_mas_grandes || []).reduce(
    (sum, file) => sum + file.lineas,
    0
  );
  document.getElementById("kpi-total-lines").textContent =
    totalLines.toLocaleString("es-ES");
  document.getElementById("kpi-todos").textContent = (
    data.tareas_pendientes || []
  ).length;
  const heavyAssets =
    (data.informe_rendimiento?.imagenes?.length || 0) +
    (data.informe_rendimiento?.javascript?.length || 0);
  document.getElementById("kpi-heavy-assets").textContent = heavyAssets;
}

function renderPerformanceReport(performanceData) {
  const imagesTbody = document.querySelector("#large-images-table tbody");
  const jsTbody = document.querySelector("#large-js-table tbody");
  if (!performanceData || !imagesTbody || !jsTbody) return;
  imagesTbody.innerHTML = ""; // Limpiar contenido previo
  jsTbody.innerHTML = ""; // Limpiar contenido previo

  if (performanceData.imagenes.length > 0) {
    performanceData.imagenes.forEach((file) => {
      imagesTbody.innerHTML += `<tr><td><span class="file-path">${file.ruta}</span></td><td>${file.tamano_kb} KB</td></tr>`;
    });
  } else {
    imagesTbody.innerHTML =
      '<tr><td colspan="2">No se encontraron imágenes pesadas. ¡Buen trabajo!</td></tr>';
  }

  if (performanceData.javascript.length > 0) {
    performanceData.javascript.forEach((file) => {
      jsTbody.innerHTML += `<tr><td><span class="file-path">${file.ruta}</span></td><td>${file.tamano_kb} KB</td></tr>`;
    });
  } else {
    jsTbody.innerHTML =
      '<tr><td colspan="2">No se encontraron archivos JavaScript pesados.</td></tr>';
  }
}

function renderTodosReport(todosData) {
  const todosTbody = document.querySelector("#todos-table tbody");
  if (!todosData || !todosTbody) return;
  todosTbody.innerHTML = ""; // Limpiar contenido previo

  if (todosData.length > 0) {
    todosData.forEach((task) => {
      todosTbody.innerHTML += `<tr><td><span class="file-path">${task.ruta}</span></td><td><span class="line-num">${task.linea_num}</span></td><td><span class="comment">${task.texto}</span></td></tr>`;
    });
  } else {
    todosTbody.innerHTML =
      '<tr><td colspan="3">¡Felicidades! No hay tareas pendientes.</td></tr>';
  }
}

function renderD3Tree(treeData) {
  const container = document.getElementById("tree-container");
  if (!container) return;

  const svgElement = d3.select("#project-tree-svg");
  const width = container.clientWidth;
  const height = container.clientHeight;

  const svg = svgElement.attr("viewBox", [
    -width / 2,
    -height / 4,
    width,
    height,
  ]);
  const g = svg.append("g");

  const root = d3.hierarchy(treeData);
  const treeLayout = d3.tree().nodeSize([150, 120]);
  treeLayout(root);

  g.append("g")
    .attr("fill", "none")
    .attr("stroke", "#374151")
    .attr("stroke-width", 1.5)
    .selectAll("path")
    .data(root.links())
    .join("path")
    .attr(
      "d",
      d3
        .linkVertical()
        .x((d) => d.x)
        .y((d) => d.y)
    );

  const node = g
    .append("g")
    .selectAll("g")
    .data(root.descendants())
    .join("g")
    .attr("transform", (d) => `translate(${d.x},${d.y})`);

  node
    .append("rect")
    .attr("fill", (d) => (d.children ? "#1f2937" : "#111827"))
    .attr("stroke", "#0891b2")
    .attr("stroke-width", 2)
    .attr("rx", 6)
    .attr("x", -65)
    .attr("y", -13)
    .attr("width", 130)
    .attr("height", 26);

  node
    .append("text")
    .attr("dy", "0.31em")
    .attr("text-anchor", "middle")
    .text((d) => d.data.name)
    .style("font-size", "11px")
    .style("fill", "#e2e8f0")
    .style("paint-order", "stroke")
    .style("stroke", "#1f2937")
    .style("stroke-width", "3px")
    .style("stroke-linecap", "butt");

  const zoom = d3.zoom().on("zoom", (event) => {
    g.attr("transform", event.transform);
  });

  svg.call(zoom);
}

function renderBarChart(canvasId, label, data, labelKey, dataKey, color) {
  const ctx = document.getElementById(canvasId);
  if (!ctx || !data) return;

  // Si ya existe un gráfico en este canvas, lo destruimos primero
  if (Chart.getChart(ctx)) {
    Chart.getChart(ctx).destroy();
  }

  const labels = data.map((item) => item[labelKey]);
  const values = data.map((item) => item[dataKey]);

  new Chart(ctx.getContext("2d"), {
    type: "bar",
    data: {
      labels: labels,
      datasets: [
        {
          label: label,
          data: values,
          backgroundColor: color + "4D",
          borderColor: color,
          borderWidth: 1.5,
          borderRadius: 4,
        },
      ],
    },
    options: {
      indexAxis: "y",
      responsive: true,
      plugins: { legend: { display: false } },
      scales: {
        x: {
          ticks: { color: "#9ca3af", font: { family: "monospace" } },
          grid: { color: "#374151" },
        },
        y: {
          ticks: { color: "#e2e8f0", font: { family: "monospace", size: 10 } },
          grid: { display: false },
        },
      },
    },
  });
}
