// ia-img/js/galleryManager.js

import { CONFIG } from "./config.js";
import {
  selectedGalleryImages,
  setSelectedGalleryImages,
  currentLightboxIndex,
  setCurrentLightboxIndex,
  originalEditorImage, // Mantenemos la referencia a originalEditorImage de state.js
  setEditingImageUrl,
  setEditorCtx, // Importado para inicializar el contexto del canvas en openImageEditor
  setEditorCurrentFilter, // Para resetear el filtro al abrir
  setEditorTextData, // Para resetear el texto al abrir
} from "./state.js";
import {
  downloadImage,
  showCustomMessage,
  updateLocalStorageUsage,
  DOMElements,
} from "../../js/global.js"; // Importar elementos globales y funciones
import {
  redrawEditorCanvas, // Importadas para ser usadas dentro de openImageEditor, saveEditedImage, etc.
  applyFilterToCanvas,
  addTextToCanvas,
  applyCrop,
  saveEditedImage,
  closeImageEditor as editorCloseImageEditor, // Renombrar para evitar conflicto con closeImageEditor de lightbox
  renderFilterThumbnails,
} from "./editorManager.js"; // Importar funciones del editor

// Funciones relacionadas con la galería
export function saveImageToGallery(imageUrl) {
  let images = JSON.parse(localStorage.getItem("generatedImages")) || [];
  if (
    !imageUrl.includes("placehold.co") &&
    (images.length === 0 || images[0] !== imageUrl)
  ) {
    images.unshift(imageUrl);
  }
  if (images.length > CONFIG.MAX_GALLERY_IMAGES) {
    images = images.slice(0, CONFIG.MAX_GALLERY_IMAGES);
  }
  try {
    localStorage.setItem("generatedImages", JSON.stringify(images));
    updateLocalStorageUsage();
  } catch (e) {
    if (e.name === "QuotaExceededError") {
      showCustomMessage(
        "¡Almacenamiento lleno! Has alcanzado el límite de imágenes guardadas. Por favor, elimina algunas imágenes de la galería para generar más.",
        "error",
        7000
      );
    } else {
      console.error("Error al guardar en localStorage:", e);
    }
  }
}

export function loadGalleryImages() {
  return JSON.parse(localStorage.getItem("generatedImages")) || [];
}

export function renderGallery() {
  const images = loadGalleryImages();
  if (!DOMElements.galleryContainer) return;
  DOMElements.galleryContainer.innerHTML = "";

  const currentSelected = new Set();
  images.forEach((imgUrl) => {
    if (selectedGalleryImages.has(imgUrl)) {
      currentSelected.add(imgUrl);
    }
  });
  setSelectedGalleryImages(currentSelected); // Actualizar el estado global
  updateDownloadSelectedButtonState();

  if (images.length === 0) {
    DOMElements.galleryContainer.innerHTML =
      '<p class="text-gray-500 col-span-full text-center p-4">La galería está vacía. ¡Genera tu primera imagen!</p>';
    return;
  }

  images.forEach((imageUrl, index) => {
    const itemWrapper = document.createElement("div");
    itemWrapper.classList.add(
      "gallery-item-wrapper",
      "relative",
      "rounded-lg",
      "shadow-md",
      "overflow-hidden"
    );
    itemWrapper.dataset.imageUrl = imageUrl;

    const imgElement = document.createElement("img");
    imgElement.src = imageUrl;
    imgElement.alt = `Imagen de galería ${index + 1}`;
    itemWrapper.classList.add(
      "cursor-pointer",
      "transition-transform",
      "duration-200"
    );
    imgElement.onerror = () => {
      imgElement.src = "https://placehold.co/150x150/374151/D1D5DB?text=Error";
    };
    imgElement.addEventListener("click", (e) => {
      if (
        !e.target.closest('input[type="checkbox"]') &&
        !e.target.closest("button")
      ) {
        openLightbox(imageUrl);
      }
    });

    const selectionOverlay = document.createElement("div");
    selectionOverlay.classList.add("selection-overlay", "rounded-lg");
    selectionOverlay.innerHTML = `<svg xmlns="http://www.w3.org/2000/svg" class="h-8 w-8" viewBox="0 0 20 20" fill="currentColor"><path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clip-rule="evenodd" /></svg>`;

    const controlsWrapper = document.createElement("div");
    controlsWrapper.classList.add(
      "absolute",
      "bottom-0",
      "left-0",
      "right-0",
      "bg-gradient-to-t",
      "from-gray-900",
      "to-transparent",
      "p-2",
      "flex",
      "items-center",
      "justify-between"
    );

    const checkbox = document.createElement("input");
    checkbox.type = "checkbox";
    checkbox.classList.add(
      "form-checkbox",
      "h-5",
      "w-5",
      "text-cyan-600",
      "rounded",
      "border-gray-300",
      "focus:ring-cyan-500",
      "bg-gray-700",
      "cursor-pointer"
    );
    checkbox.checked = selectedGalleryImages.has(imageUrl);
    checkbox.addEventListener("change", () =>
      toggleImageSelection(imageUrl, checkbox, itemWrapper)
    );

    const downloadBtn = document.createElement("button");
    // CORRECCIÓN APLICADA AQUÍ: Se ha reemplazado la cadena d del SVG
    downloadBtn.innerHTML =
      '<svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" viewBox="0 0 20 20" fill="currentColor"><path fill-rule="evenodd" d="M3 17a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm3.293-7.707a1 1 0 011.414 0L9 10.586V3a1 1 0 112 0v7.586l1.293-1.293a1 1 0 011.414 0l-3-3a1 1 0 010-1.414z" clip-rule="evenodd" /></svg>';
    downloadBtn.title = "Descargar esta imagen";
    downloadBtn.classList.add(
      "text-white",
      "hover:text-cyan-400",
      "transition-colors",
      "duration-200",
      "p-1",
      "rounded-full",
      "bg-gray-800",
      "bg-opacity-50",
      "hover:bg-opacity-80",
      "cursor-pointer"
    );
    downloadBtn.addEventListener("click", () =>
      downloadImage(imageUrl, `imagen-galeria-${index + 1}.png`)
    );

    const deleteBtn = document.createElement("button");
    deleteBtn.innerHTML =
      '<svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2"><path stroke-linecap="round" stroke-linejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>';
    deleteBtn.title = "Eliminar esta imagen";
    deleteBtn.classList.add(
      "text-red-400",
      "hover:text-red-300",
      "transition-colors",
      "duration-200",
      "p-1",
      "rounded-full",
      "bg-gray-800",
      "bg-opacity-50",
      "hover:bg-opacity-80",
      "cursor-pointer",
      "ml-1"
    );
    deleteBtn.addEventListener("click", () => deleteImageFromGallery(imageUrl));

    const editBtn = document.createElement("button");
    editBtn.innerHTML =
      '<svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2"><path stroke-linecap="round" stroke-linejoin="round" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.172-8.172z" /></svg>';
    editBtn.title = "Editar esta imagen";
    editBtn.classList.add(
      "text-yellow-400",
      "hover:text-yellow-300",
      "transition-colors",
      "duration-200",
      "p-1",
      "rounded-full",
      "bg-gray-800",
      "bg-opacity-50",
      "hover:bg-opacity-80",
      "cursor-pointer",
      "ml-1"
    );
    editBtn.addEventListener("click", () => openImageEditor(imageUrl));

    controlsWrapper.appendChild(checkbox);
    controlsWrapper.appendChild(downloadBtn);
    controlsWrapper.appendChild(deleteBtn);
    controlsWrapper.appendChild(editBtn);

    itemWrapper.appendChild(imgElement);
    itemWrapper.appendChild(selectionOverlay);
    itemWrapper.appendChild(controlsWrapper);

    if (selectedGalleryImages.has(imageUrl)) {
      itemWrapper.classList.add("selected");
    }
    DOMElements.galleryContainer.appendChild(itemWrapper);
  });
}

export function renderRecentGenerations() {
  const images = loadGalleryImages();
  if (
    !DOMElements.recentGenerationsGallery ||
    !DOMElements.downloadLastGeneratedButton
  )
    return;
  DOMElements.recentGenerationsGallery.innerHTML = "";

  if (images.length === 0) {
    DOMElements.recentGenerationsGallery.innerHTML =
      '<p class="text-gray-500 text-sm text-center col-span-2">Genera algunas imágenes para ver tu historial aquí.</p>';
    DOMElements.downloadLastGeneratedButton.disabled = true;
    DOMElements.downloadLastGeneratedButton.classList.add(
      "opacity-50",
      "cursor-not-allowed"
    );
    return;
  }

  const numToShow = Math.min(images.length, 4);
  for (let i = 0; i < numToShow; i++) {
    const imageUrl = images[i];
    const imgElement = document.createElement("img");
    imgElement.src = imageUrl;
    imgElement.alt = `Historial ${i + 1}`;
    imgElement.classList.add(
      "rounded-md",
      "cursor-pointer",
      "border",
      "border-gray-700",
      "hover:border-cyan-500",
      "transition-colors"
    );
    imgElement.addEventListener("click", () => openLightbox(imageUrl));
    imgElement.onerror = () => {
      imgElement.src = "https://placehold.co/80x80/374151/D1D5DB?text=Error";
    };
    DOMElements.recentGenerationsGallery.appendChild(imgElement);
  }

  DOMElements.downloadLastGeneratedButton.disabled = false;
  DOMElements.downloadLastGeneratedButton.classList.remove(
    "opacity-50",
    "cursor-not-allowed"
  );
}

export function updateDownloadSelectedButtonState() {
  if (
    !DOMElements.downloadSelectedButton ||
    !DOMElements.clearSelectionButton ||
    !DOMElements.deleteSelectedButton
  )
    return;

  const isDisabled = selectedGalleryImages.size === 0;
  DOMElements.downloadSelectedButton.disabled = isDisabled;
  DOMElements.downloadSelectedButton.classList.toggle("opacity-50", isDisabled);
  DOMElements.downloadSelectedButton.classList.toggle(
    "cursor-not-allowed",
    isDisabled
  );
  DOMElements.clearSelectionButton.disabled = isDisabled;
  DOMElements.clearSelectionButton.classList.toggle("opacity-50", isDisabled);
  DOMElements.clearSelectionButton.classList.toggle(
    "cursor-not-allowed",
    isDisabled
  );

  DOMElements.deleteSelectedButton.disabled = isDisabled;
  DOMElements.deleteSelectedButton.classList.toggle("opacity-50", isDisabled);
  DOMElements.deleteSelectedButton.classList.toggle(
    "cursor-not-allowed",
    isDisabled
  );
}

export async function downloadSelectedImages() {
  if (selectedGalleryImages.size === 0) {
    showCustomMessage(
      "Por favor, selecciona al menos una imagen para descargar.",
      "error"
    );
    return;
  }
  showCustomMessage(
    `Descargando ${selectedGalleryImages.size} imágenes...`,
    "info",
    4000
  );

  let downloadCount = 0;
  for (const imageUrl of selectedGalleryImages) {
    await new Promise((resolve) => setTimeout(resolve, 300));
    await downloadImage(imageUrl, `seleccion_ia_${downloadCount + 1}.png`);
    downloadCount++;
  }
  clearSelection();
  showCustomMessage(
    `Descarga de ${downloadCount} imágenes completada.`,
    "success"
  );
}

export function deleteImageFromGallery(imageUrlToDelete) {
  let images = loadGalleryImages();
  const initialLength = images.length;
  images = images.filter((url) => url !== imageUrlToDelete);

  if (images.length < initialLength) {
    localStorage.setItem("generatedImages", JSON.stringify(images));
    renderGallery();
    renderRecentGenerations();
    showCustomMessage("Imagen eliminada de la galería.", "success", 2000);
  } else {
    showCustomMessage("No se encontró la imagen para eliminar.", "error", 2000);
  }
}

export function deleteSelectedImagesFromGallery() {
  if (selectedGalleryImages.size === 0) {
    showCustomMessage(
      "Por favor, selecciona al menos una imagen para eliminar.",
      "error"
    );
    return;
  }

  let images = loadGalleryImages();
  const initialLength = images.length;

  images = images.filter((url) => !selectedGalleryImages.has(url));

  if (images.length < initialLength) {
    localStorage.setItem("generatedImages", JSON.stringify(images));
    renderGallery();
    renderRecentGenerations();
    showCustomMessage(
      `Se eliminaron ${initialLength - images.length} imágenes seleccionadas.`,
      "success",
      3000
    );
  } else {
    showCustomMessage(
      "No se encontraron imágenes seleccionadas para eliminar.",
      "error",
      2000
    );
  }
  clearSelection();
}

export function toggleImageSelection(imageUrl, checkbox, itemWrapper) {
  if (checkbox.checked) {
    selectedGalleryImages.add(imageUrl);
    itemWrapper.classList.add("selected");
  } else {
    selectedGalleryImages.delete(imageUrl);
    itemWrapper.classList.remove("selected");
  }
  updateDownloadSelectedButtonState();
}

export function toggleSelectAllImages() {
  const allImages = loadGalleryImages();
  if (!DOMElements.galleryContainer) return;
  const allCheckboxes = DOMElements.galleryContainer.querySelectorAll(
    'input[type="checkbox"]'
  );

  if (selectedGalleryImages.size === allImages.length && allImages.length > 0) {
    clearSelection();
  } else {
    setSelectedGalleryImages(new Set()); // Resetear el Set
    allImages.forEach((imageUrl) => selectedGalleryImages.add(imageUrl));
    allCheckboxes.forEach((checkbox) => {
      checkbox.checked = true;
      checkbox.closest(".gallery-item-wrapper").classList.add("selected");
    });
    updateDownloadSelectedButtonState();
  }
}

export function clearSelection() {
  setSelectedGalleryImages(new Set()); // Resetear el Set
  if (!DOMElements.galleryContainer) return;
  DOMElements.galleryContainer
    .querySelectorAll(".gallery-item-wrapper.selected")
    .forEach((item) => {
      item.classList.remove("selected");
      const checkbox = item.querySelector('input[type="checkbox"]');
      if (checkbox) checkbox.checked = false;
    });
  updateDownloadSelectedButtonState();
}

export function openLightbox(imageUrl) {
  if (!DOMElements.lightbox) return;
  const galleryImages = loadGalleryImages();
  setCurrentLightboxIndex(galleryImages.findIndex((img) => img === imageUrl));

  updateLightboxContent();
  DOMElements.lightbox.classList.add("show");
}

export function closeLightbox() {
  if (!DOMElements.lightbox) return;
  DOMElements.lightbox.classList.remove("show");
}

export function updateLightboxContent() {
  if (!DOMElements.lightboxImage || !DOMElements.lightboxThumbnails) return;

  const galleryImages = loadGalleryImages();
  if (galleryImages.length === 0) {
    DOMElements.lightboxImage.src =
      "https://placehold.co/600x400/374151/D1D5DB?text=Galería+vacía";
    DOMElements.lightboxThumbnails.innerHTML = "";
    return;
  }

  if (currentLightboxIndex < 0) {
    setCurrentLightboxIndex(galleryImages.length - 1);
  } else if (currentLightboxIndex >= galleryImages.length) {
    setCurrentLightboxIndex(0);
  }

  const currentImageUrl = galleryImages[currentLightboxIndex];
  DOMElements.lightboxImage.src = currentImageUrl;
  DOMElements.lightboxImage.alt = `Imagen en grande ${
    currentLightboxIndex + 1
  } de ${galleryImages.length}`;

  DOMElements.lightboxThumbnails.innerHTML = "";
  galleryImages.forEach((url, index) => {
    const thumbImg = document.createElement("img");
    thumbImg.src = url;
    thumbImg.alt = `Miniatura ${index + 1}`;
    thumbImg.classList.add("lightbox-thumbnail-item");
    if (index === currentLightboxIndex) {
      thumbImg.classList.add("active");
    }
    thumbImg.addEventListener("click", () => {
      setCurrentLightboxIndex(index);
      updateLightboxContent();
    });
    thumbImg.onerror = () => {
      thumbImg.src = "https://placehold.co/80x80/374151/D1D5DB?text=Error";
    };
    DOMElements.lightboxThumbnails.appendChild(thumbImg);
  });

  const activeThumbnail = DOMElements.lightboxThumbnails.querySelector(
    ".lightbox-thumbnail-item.active"
  );
  if (activeThumbnail) {
    activeThumbnail.scrollIntoView({ behavior: "smooth", inline: "center" });
  }
}

export function showNextImage() {
  setCurrentLightboxIndex(currentLightboxIndex + 1);
  updateLightboxContent();
}

export function showPrevImage() {
  setCurrentLightboxIndex(currentLightboxIndex - 1);
  updateLightboxContent();
}

// Función para abrir el editor de imágenes, ahora en galleryManager
export function openImageEditor(imageUrl) {
  if (!DOMElements.imageEditorModal || !DOMElements.editorCanvas) {
    showCustomMessage(
      "Error: Elementos del editor de imágenes no encontrados.",
      "error"
    );
    return;
  }

  setEditingImageUrl(imageUrl);
  originalEditorImage.src = imageUrl;
  originalEditorImage.onload = () => {
    const aspectRatio =
      originalEditorImage.naturalWidth / originalEditorImage.naturalHeight;
    const maxCanvasHeight = window.innerHeight * 0.7;
    const maxCanvasWidth = window.innerWidth * 0.7;

    let newWidth = originalEditorImage.naturalWidth;
    let newHeight = originalEditorImage.naturalHeight;

    if (newWidth > maxCanvasWidth) {
      newWidth = maxCanvasWidth;
      newHeight = newWidth / aspectRatio;
    }
    if (newHeight > maxCanvasHeight) {
      newHeight = maxCanvasHeight;
      newWidth = newHeight * aspectRatio;
    }

    DOMElements.editorCanvas.width = newWidth;
    DOMElements.editorCanvas.height = newHeight;
    DOMElements.editorCanvas.style.width = `${newWidth}px`;
    DOMElements.editorCanvas.style.height = `${newHeight}px`;

    if (!DOMElements.editorCanvas.getContext("2d")) {
      console.error("No se pudo obtener el contexto 2D del canvas del editor.");
      return;
    }
    const editorCtxTemp = DOMElements.editorCanvas.getContext("2d");
    setEditorCtx(editorCtxTemp); // Actualiza la variable de estado global

    redrawEditorCanvas(); // Llama a la función de editorManager
    DOMElements.imageEditorModal.classList.add("show");
  };
  renderFilterThumbnails(); // Llama a la función de editorManager

  // Reset editor state when opening a new image
  setEditorCurrentFilter("none");
  setEditorTextData({
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
