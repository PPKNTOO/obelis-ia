// ia-img/js/editorManager.js

import { DOMElements, showCustomMessage } from "../../js/global.js";
import {
  editorCtx,
  originalEditorImage,
  editorCurrentFilter,
  editorTextData,
  editingImageUrl,
  setEditorCurrentFilter,
  setEditorTextData,
  setEditingImageUrl, // Aunque no se usa directamente aquí, es buena práctica si se necesitara
} from "./state.js";
import {
  loadGalleryImages,
  saveImageToGallery,
  renderGallery,
  renderRecentGenerations,
} from "./galleryManager.js";

export function closeImageEditor() {
  if (!DOMElements.imageEditorModal) return;
  DOMElements.imageEditorModal.classList.remove("show");
  setEditorCurrentFilter("none"); // Reiniciar filtro
  setEditorTextData({
    // Reiniciar datos de texto
    content: "",
    color: "#FFFFFF",
    size: 30,
    position: "bottomRight",
  });
  if (DOMElements.editorTextInput) DOMElements.editorTextInput.value = "";
  if (DOMElements.editorTextColor)
    DOMElements.editorTextColor.value = "#FFFFFF";
  if (DOMElements.editorTextSize) DOMElements.editorTextSize.value = "30";
  if (DOMElements.editorTextPosition)
    DOMElements.editorTextPosition.value = "bottomRight";
  if (DOMElements.cropWidthInput) DOMElements.cropWidthInput.value = "";
  if (DOMElements.cropHeightInput) DOMElements.cropHeightInput.value = "";
}

export function redrawEditorCanvas() {
  if (!editorCtx || !originalEditorImage.complete || !DOMElements.editorCanvas)
    return;

  editorCtx.clearRect(
    0,
    0,
    DOMElements.editorCanvas.width,
    DOMElements.editorCanvas.height
  );

  editorCtx.filter = editorCurrentFilter;

  let drawX = 0,
    drawY = 0,
    drawW = originalEditorImage.naturalWidth,
    drawH = originalEditorImage.naturalHeight;
  let cropW =
    parseInt(DOMElements.cropWidthInput.value) ||
    originalEditorImage.naturalWidth;
  let cropH =
    parseInt(DOMElements.cropHeightInput.value) ||
    originalEditorImage.naturalHeight;

  if (
    cropW < originalEditorImage.naturalWidth ||
    cropH < originalEditorImage.naturalHeight
  ) {
    drawX = (originalEditorImage.naturalWidth - cropW) / 2;
    drawY = (originalEditorImage.naturalHeight - cropH) / 2;
    drawW = cropW;
    drawH = cropH;
  }

  editorCtx.drawImage(
    originalEditorImage,
    drawX,
    drawY,
    drawW,
    drawH,
    0,
    0,
    DOMElements.editorCanvas.width,
    DOMElements.editorCanvas.height
  );

  editorCtx.filter = "none"; // Resetear el filtro para el texto

  if (editorTextData.content) {
    editorCtx.font = `${editorTextData.size}px Arial`;
    editorCtx.fillStyle = editorTextData.color;
    editorCtx.textAlign = "left";
    editorCtx.textBaseline = "top";

    let textX, textY;
    const margin = 20;

    // Medir el texto después de configurar la fuente
    const textMetrics = editorCtx.measureText(editorTextData.content);
    const textWidth = textMetrics.width;
    const textHeight = editorTextData.size; // Aproximación, depende de la fuente

    switch (editorTextData.position) {
      case "topLeft":
        textX = margin;
        textY = margin;
        break;
      case "topRight":
        textX = DOMElements.editorCanvas.width - textWidth - margin;
        textY = margin;
        break;
      case "bottomLeft":
        textX = margin;
        textY = DOMElements.editorCanvas.height - textHeight - margin;
        break;
      case "center":
        textX = (DOMElements.editorCanvas.width - textWidth) / 2;
        textY = (DOMElements.editorCanvas.height - textHeight) / 2;
        break;
      case "bottomRight":
      default:
        textX = DOMElements.editorCanvas.width - textWidth - margin;
        textY = DOMElements.editorCanvas.height - textHeight - margin;
        break;
    }
    editorCtx.fillText(editorTextData.content, textX, textY);
  }
}

export function applyFilterToCanvas(filter) {
  setEditorCurrentFilter(filter); // Actualiza el estado global
  redrawEditorCanvas();
}

export function addTextToCanvas() {
  if (
    !DOMElements.editorTextInput ||
    !DOMElements.editorTextColor ||
    !DOMElements.editorTextSize ||
    !DOMElements.editorTextPosition
  ) {
    showCustomMessage(
      "Error: Elementos de entrada de texto del editor no encontrados.",
      "error"
    );
    return;
  }
  setEditorTextData({
    content: DOMElements.editorTextInput.value,
    color: DOMElements.editorTextColor.value,
    size: parseInt(DOMElements.editorTextSize.value),
    position: DOMElements.editorTextPosition.value,
  });
  redrawEditorCanvas();
  showCustomMessage("Texto añadido a la imagen.", "success", 2000);
}

export function applyCrop() {
  if (
    !DOMElements.cropWidthInput ||
    !DOMElements.cropHeightInput ||
    !DOMElements.editorCanvas
  ) {
    showCustomMessage(
      "Error: Elementos de recorte del editor no encontrados.",
      "error"
    );
    return;
  }

  const width = parseInt(DOMElements.cropWidthInput.value);
  const height = parseInt(DOMElements.cropHeightInput.value);

  if (isNaN(width) || isNaN(height) || width <= 0 || height <= 0) {
    showCustomMessage(
      "Por favor, ingresa dimensiones de recorte válidas.",
      "error"
    );
    return;
  }

  const tempCanvas = document.createElement("canvas");
  const tempCtx = tempCanvas.getContext("2d");

  tempCanvas.width = width;
  tempCanvas.height = height;

  const sourceX = (originalEditorImage.naturalWidth - width) / 2;
  const sourceY = (originalEditorImage.naturalHeight - height) / 2;

  tempCtx.drawImage(
    originalEditorImage,
    sourceX,
    sourceY,
    width,
    height,
    0,
    0,
    width,
    height
  );

  originalEditorImage.src = tempCanvas.toDataURL("image/png");
  originalEditorImage.onload = () => {
    DOMElements.editorCanvas.width = originalEditorImage.naturalWidth;
    DOMElements.editorCanvas.height = originalEditorImage.naturalHeight;
    DOMElements.editorCanvas.style.width = `${originalEditorImage.naturalWidth}px`;
    DOMElements.editorCanvas.style.height = `${originalEditorImage.naturalHeight}px`;

    redrawEditorCanvas();
    showCustomMessage("Imagen recortada con éxito.", "success", 2000);
  };
}

export function saveEditedImage() {
  if (!DOMElements.editorCanvas) return;
  redrawEditorCanvas();
  const editedImageUrl = DOMElements.editorCanvas.toDataURL("image/png");

  let images = loadGalleryImages();
  const indexToUpdate = images.findIndex((url) => url === editingImageUrl);

  if (indexToUpdate !== -1) {
    images[indexToUpdate] = editedImageUrl;
    localStorage.setItem("generatedImages", JSON.stringify(images));
    renderGallery();
    renderRecentGenerations();
    showCustomMessage(
      "Imagen editada y guardada en la galería.",
      "success",
      3000
    );
  } else {
    showCustomMessage(
      "No se pudo encontrar la imagen original en la galería para actualizar.",
      "error",
      3000
    );
  }
  closeImageEditor(); // Llama a la función de este módulo
}

export function renderFilterThumbnails() {
  if (!DOMElements.filterThumbnails || !originalEditorImage.src) return;
  DOMElements.filterThumbnails.innerHTML = "";
  const filters = [
    { name: "none", label: "Original", filter: "none" },
    { name: "grayscale", label: "B/N", filter: "grayscale(100%)" },
    { name: "sepia", label: "Sepia", filter: "sepia(100%)" },
    { name: "brightness", label: "Brillo", filter: "brightness(150%)" },
    { name: "contrast", label: "Contraste", filter: "contrast(150%)" },
    { name: "blur", label: "Desenfoque", filter: "blur(3px)" },
    { name: "saturate", label: "Saturar", filter: "saturate(200%)" },
    { name: "invert", label: "Invertir", filter: "invert(100%)" },
  ];

  filters.forEach((filter) => {
    const img = document.createElement("img");
    img.src = originalEditorImage.src;
    img.alt = filter.label;
    img.classList.add(
      "w-20",
      "h-20",
      "object-cover",
      "rounded-lg",
      "cursor-pointer",
      "border-2",
      "border-gray-700",
      "hover:border-cyan-500",
      "transition-all",
      "duration-200"
    );
    img.style.filter = filter.filter;

    img.addEventListener("click", () => {
      applyFilterToCanvas(filter.filter);
      DOMElements.filterThumbnails.querySelectorAll("img").forEach((thumb) => {
        thumb.classList.remove("border-cyan-500", "ring-2");
      });
      img.classList.add("border-cyan-500", "ring-2");
    });
    DOMElements.filterThumbnails.appendChild(img);
  });
}
