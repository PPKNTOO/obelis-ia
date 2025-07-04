// dashboard/js/app.js

document.addEventListener("DOMContentLoaded", async () => {
  try {
    const response = await fetch("/reporte_datos.json");
    if (!response.ok) throw new Error("No se encontró el archivo de datos.");
    const data = await response.json();

    // Llama a todas las funciones de renderizado con los datos
    populateKPIs(data);
    renderPerformanceReport(data.informe_rendimiento);
    renderTodosReport(data.tareas_pendientes);

    if (data.estructura_proyecto_json) {
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
  } catch (error) {
    console.error("Error al cargar el dashboard:", error);
    document.body.innerHTML = `<h1>Error al Cargar</h1><p>No se pudo encontrar o leer el archivo <code>reporte_datos.json</code>. Asegúrate de haber ejecutado <code>analizar_proyecto.py</code> primero y de acceder a esta página a través de un servidor local.</p>`;
  }
  const scanButton = document.getElementById("scan-button");
  if (scanButton) {
    scanButton.addEventListener("click", handleScanButtonClick);
  }
});

// ✅ NUEVA FUNCIÓN para manejar el botón de escaneo
async function handleScanButtonClick() {
  const scanButton = document.getElementById("scan-button");
  const icon = scanButton.querySelector("i");
  const text = scanButton.querySelector("span");

  // Poner el botón en estado de "cargando"
  scanButton.disabled = true;
  icon.classList.add("scanning");
  text.textContent = "Escaneando...";

  try {
    const response = await fetch("/api/run-analysis", { method: "POST" });
    if (!response.ok) {
      throw new Error("La respuesta del servidor no fue OK");
    }
    const result = await response.json();
    console.log(result.message);

    // Mostrar un mensaje de éxito y recargar la página para ver los nuevos datos
    alert("Análisis completado. El dashboard se actualizará.");
    location.reload();
  } catch (error) {
    console.error("Error al escanear el proyecto:", error);
    alert(
      "Ocurrió un error al escanear el proyecto. Revisa la consola para más detalles."
    );
  } finally {
    // Restaurar el botón (aunque la página se recargará)
    scanButton.disabled = false;
    icon.classList.remove("scanning");
    text.textContent = "Escanear Proyecto";
  }
}

// ✅ NUEVA FUNCIÓN para poblar los KPIs
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

// ✅ NUEVA FUNCIÓN para renderizar la tabla de rendimiento
function renderPerformanceReport(performanceData) {
  const imagesTbody = document.querySelector("#large-images-table tbody");
  const jsTbody = document.querySelector("#large-js-table tbody");

  if (!performanceData || !imagesTbody || !jsTbody) return;

  // Rellenar tabla de imágenes pesadas
  if (performanceData.imagenes.length > 0) {
    performanceData.imagenes.forEach((file) => {
      imagesTbody.innerHTML += `<tr><td><span class="file-path">${file.ruta}</span></td><td>${file.tamano_kb} KB</td></tr>`;
    });
  } else {
    imagesTbody.innerHTML =
      '<tr><td colspan="2">No se encontraron imágenes pesadas. ¡Buen trabajo!</td></tr>';
  }

  // Rellenar tabla de JS pesados
  if (performanceData.javascript.length > 0) {
    performanceData.javascript.forEach((file) => {
      jsTbody.innerHTML += `<tr><td><span class="file-path">${file.ruta}</span></td><td>${file.tamano_kb} KB</td></tr>`;
    });
  } else {
    jsTbody.innerHTML =
      '<tr><td colspan="2">No se encontraron archivos JavaScript pesados.</td></tr>';
  }
}

// ✅ NUEVA FUNCIÓN para renderizar la tabla de tareas pendientes
function renderTodosReport(todosData) {
  const todosTbody = document.querySelector("#todos-table tbody");
  if (!todosData || !todosTbody) return;

  if (todosData.length > 0) {
    todosData.forEach((task) => {
      todosTbody.innerHTML += `<tr><td><span class="file-path">${task.ruta}</span></td><td><span class="line-num">${task.linea_num}</span></td><td><span class="comment">${task.texto}</span></td></tr>`;
    });
  } else {
    todosTbody.innerHTML =
      '<tr><td colspan="3">¡Felicidades! No hay tareas pendientes.</td></tr>';
  }
}
/**
 * Dibuja el árbol del proyecto con D3.js de forma interactiva
 */
function renderD3Tree(treeData) {
  const container = document.getElementById("tree-container");
  if (!container) return;

  const svgElement = d3.select("#project-tree-svg");

  const width = container.clientWidth;
  const height = container.clientHeight;

  // Configura el SVG y el grupo principal para el zoom
  const svg = svgElement.attr("viewBox", [
    -width / 2,
    -height / 4,
    width,
    height,
  ]);
  const g = svg.append("g");

  // Crea la jerarquía de datos y el layout del árbol
  const root = d3.hierarchy(treeData);
  const treeLayout = d3.tree().nodeSize([150, 120]);
  treeLayout(root);

  // Dibuja las líneas/enlaces entre nodos
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

  // Dibuja los nodos (caja + texto)
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

  // Configura el comportamiento de zoom y arrastre (pan)
  const zoom = d3.zoom().on("zoom", (event) => {
    g.attr("transform", event.transform);
  });

  svg.call(zoom);
}

/**
 * Dibuja un gráfico de barras horizontal con Chart.js
 */
function renderBarChart(canvasId, label, data, labelKey, dataKey, color) {
  const ctx = document.getElementById(canvasId);
  if (!ctx || !data || data.length === 0) return;

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
          backgroundColor: color + "4D", // Color con ~30% de opacidad
          borderColor: color,
          borderWidth: 1.5,
          borderRadius: 4,
        },
      ],
    },
    options: {
      indexAxis: "y", // Hace el gráfico horizontal
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
/**
 * Muestra un mensaje de error si no se encuentra el archivo JSON
 */
function showError(message) {
  const container = document.getElementById("error-container");
  if (container) {
    container.innerHTML = `<h1>Error</h1><p>${message}</p>`;
  } else {
    document.body.innerHTML = `<h1>Error</h1><p>${message}</p>`;
  }
}
/**
 * Muestra un mensaje de carga mientras se obtienen los datos
 */
function showLoading() {
  const container = document.getElementById("loading-container");
  if (container) {
    container.innerHTML = `<h1>Cargando...</h1><p>Por favor, espera mientras se obtienen los datos del proyecto.</p>`;
  } else {
    document.body.innerHTML = `<h1>Cargando...</h1><p>Por favor, espera mientras se obtienen los datos del proyecto.</p>`;
  }
}
