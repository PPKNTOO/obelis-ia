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
} from "./state.js";
import {
  loadGalleryImages,
  renderGallery,
  renderRecentGenerations,
} from "./galleryManager.js";

export function closeImageEditor() {
  if (DOMElements.imageEditorModal) {
    DOMElements.imageEditorModal.classList.remove("show");
  }
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

  editorCtx.drawImage(
    originalEditorImage,
    0,
    0,
    DOMElements.editorCanvas.width,
    DOMElements.editorCanvas.height
  );

  editorCtx.filter = "none";

  if (editorTextData.content) {
    editorCtx.font = `${editorTextData.size}px Arial`;
    editorCtx.fillStyle = editorTextData.color;
    editorCtx.textAlign = "left";
    editorCtx.textBaseline = "top";

    const textMetrics = editorCtx.measureText(editorTextData.content);
    const textWidth = textMetrics.width;
    const textHeight = editorTextData.size;
    const margin = 20;
    let textX, textY;

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
  setEditorCurrentFilter(filter);
  redrawEditorCanvas();
}

export function addTextToCanvas() {
  const {
    editorTextInput,
    editorTextColor,
    editorTextSize,
    editorTextPosition,
  } = DOMElements;
  if (!editorTextInput) return;

  setEditorTextData({
    content: editorTextInput.value,
    color: editorTextColor.value,
    size: parseInt(editorTextSize.value),
    position: editorTextPosition.value,
  });
  redrawEditorCanvas();
  showCustomMessage("Texto aplicado.", "success", 2000);
}

export function applyCrop() {
  const { cropWidthInput, cropHeightInput, editorCanvas } = DOMElements;
  if (!cropWidthInput || !cropHeightInput || !editorCanvas) return;

  const width = parseInt(cropWidthInput.value);
  const height = parseInt(cropHeightInput.value);

  if (isNaN(width) || isNaN(height) || width <= 0 || height <= 0) {
    showCustomMessage("Dimensiones de recorte inválidas.", "error");
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

  originalEditorImage.onload = () => {
    editorCanvas.width = originalEditorImage.naturalWidth;
    editorCanvas.height = originalEditorImage.naturalHeight;
    redrawEditorCanvas();
    showCustomMessage("Imagen recortada.", "success", 2000);
  };
  originalEditorImage.src = tempCanvas.toDataURL("image/png");
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
    showCustomMessage("Imagen guardada en la galería.", "success");
  } else {
    showCustomMessage(
      "No se pudo encontrar la imagen para actualizar.",
      "error"
    );
  }
  closeImageEditor();
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
    const wrapper = document.createElement("div");
    wrapper.className = "flex flex-col items-center gap-1 cursor-pointer";
    const img = document.createElement("img");
    img.src = originalEditorImage.src;
    img.alt = filter.label;
    img.className =
      "w-16 h-16 object-cover rounded-md border-2 border-transparent hover:border-cyan-500 transition-all";
    img.style.filter = filter.filter;

    const label = document.createElement("p");
    label.className = "text-xs text-gray-400";
    label.textContent = filter.label;

    wrapper.addEventListener("click", () => {
      applyFilterToCanvas(filter.filter);
      DOMElements.filterThumbnails
        .querySelectorAll("img")
        .forEach((thumb) =>
          thumb.classList.remove(
            "border-cyan-500",
            "ring-2",
            "ring-offset-2",
            "ring-offset-gray-800"
          )
        );
      img.classList.add(
        "border-cyan-500",
        "ring-2",
        "ring-offset-2",
        "ring-offset-gray-800"
      );
    });
    wrapper.append(img, label);
    DOMElements.filterThumbnails.appendChild(wrapper);
  });
}
