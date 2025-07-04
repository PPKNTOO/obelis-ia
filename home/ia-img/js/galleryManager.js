// ia-img/js/galleryManager.js

import {
  DOMElements,
  downloadImage,
  showCustomMessage,
  updateLocalStorageUsage,
} from "../../js/global.js";
import { CONFIG } from "./config.js";
import {
  selectedGalleryImages,
  setSelectedGalleryImages,
  currentLightboxIndex,
  setCurrentLightboxIndex,
  originalEditorImage,
  setEditingImageUrl,
  setEditorCtx,
  setEditorCurrentFilter,
  setEditorTextData,
} from "./state.js";
import { redrawEditorCanvas, renderFilterThumbnails } from "./editorManager.js";

// --- Funciones de Gestión de Almacenamiento ---
export function saveImageToGallery(imageUrl) {
  let images = JSON.parse(localStorage.getItem("generatedImages")) || [];
  if (!imageUrl.includes("placehold.co") && !images.includes(imageUrl)) {
    images.unshift(imageUrl);
  }
  if (images.length > CONFIG.MAX_GALLERY_IMAGES) {
    images = images.slice(0, CONFIG.MAX_GALLERY_IMAGES);
  }
  try {
    localStorage.setItem("generatedImages", JSON.stringify(images));
    updateLocalStorageUsage();
  } catch (e) {
    showCustomMessage("¡Almacenamiento lleno!", "error");
  }
}

export function loadGalleryImages() {
  return JSON.parse(localStorage.getItem("generatedImages")) || [];
}

// --- Funciones de Renderizado y UI ---
export function renderGallery() {
  if (!DOMElements.galleryContainer) return;
  const images = loadGalleryImages();
  DOMElements.galleryContainer.innerHTML = "";

  const currentSelected = new Set(
    [...selectedGalleryImages].filter((url) => images.includes(url))
  );
  setSelectedGalleryImages(currentSelected);
  updateDownloadSelectedButtonState();

  if (images.length === 0) {
    DOMElements.galleryContainer.innerHTML =
      '<p class="text-gray-500 col-span-full text-center p-4">La galería está vacía.</p>';
    return;
  }

  images.forEach((imageUrl) => {
    const itemWrapper = document.createElement("div");
    itemWrapper.className =
      "gallery-item-wrapper relative rounded-lg shadow-md overflow-hidden";
    itemWrapper.dataset.imageUrl = imageUrl;
    if (selectedGalleryImages.has(imageUrl))
      itemWrapper.classList.add("selected");

    const imgElement = document.createElement("img");
    imgElement.src = imageUrl;
    imgElement.alt = "Imagen de la galería";
    imgElement.className =
      "w-full h-full object-cover cursor-pointer transition-transform duration-200";
    imgElement.loading = "lazy";
    imgElement.addEventListener("click", (e) => {
      if (!e.target.closest("input, button")) openLightbox(imageUrl);
    });

    const controlsWrapper = document.createElement("div");
    controlsWrapper.className =
      "absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/70 to-transparent p-1.5 flex justify-between items-center";

    const checkbox = document.createElement("input");
    checkbox.type = "checkbox";
    checkbox.className =
      "form-checkbox h-5 w-5 text-cyan-600 rounded border-gray-500 bg-gray-900/50 focus:ring-cyan-500";
    checkbox.checked = selectedGalleryImages.has(imageUrl);
    checkbox.addEventListener("change", () =>
      toggleImageSelection(imageUrl, itemWrapper)
    );

    const buttonsDiv = document.createElement("div");
    buttonsDiv.className = "flex items-center gap-1";

    const editBtn = document.createElement("button");
    editBtn.title = "Editar";
    editBtn.className =
      "text-white hover:text-cyan-400 p-1 transition-colors duration-200";
    editBtn.innerHTML =
      '<svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" viewBox="0 0 20 20" fill="currentColor"><path d="M17.414 2.586a2 2 0 00-2.828 0L7 10.172V13h2.828l7.586-7.586a2 2 0 000-2.828z" /><path fill-rule="evenodd" d="M2 6a2 2 0 012-2h4a1 1 0 010 2H4v10h10v-4a1 1 0 112 0v4a2 2 0 01-2 2H4a2 2 0 01-2-2V6z" clip-rule="evenodd" /></svg>';
    editBtn.addEventListener("click", () => openImageEditor(imageUrl));

    buttonsDiv.append(editBtn);
    controlsWrapper.append(checkbox, buttonsDiv);
    itemWrapper.append(imgElement, controlsWrapper);
    DOMElements.galleryContainer.appendChild(itemWrapper);
  });
}

export function renderRecentGenerations() {
  if (
    !DOMElements.recentGenerationsGallery ||
    !DOMElements.downloadLastGeneratedButton
  )
    return;
  const images = loadGalleryImages();
  DOMElements.recentGenerationsGallery.innerHTML = "";
  if (images.length === 0) {
    DOMElements.recentGenerationsGallery.innerHTML =
      '<p class="text-gray-500 text-xs text-center col-span-2">No hay historial.</p>';
    DOMElements.downloadLastGeneratedButton.disabled = true;
    DOMElements.downloadLastGeneratedButton.classList.add(
      "opacity-50",
      "cursor-not-allowed"
    );
    return;
  }
  images.slice(0, 4).forEach((imageUrl) => {
    const imgElement = document.createElement("img");
    imgElement.src = imageUrl;
    imgElement.className =
      "w-full h-full object-cover rounded-md cursor-pointer border-2 border-gray-700 hover:border-cyan-500 transition-all";
    imgElement.addEventListener("click", () => openLightbox(imageUrl));
    DOMElements.recentGenerationsGallery.appendChild(imgElement);
  });
  DOMElements.downloadLastGeneratedButton.disabled = false;
  DOMElements.downloadLastGeneratedButton.classList.remove(
    "opacity-50",
    "cursor-not-allowed"
  );
}

export function updateDownloadSelectedButtonState() {
  if (!DOMElements.downloadSelectedButton) return;
  const isDisabled = selectedGalleryImages.size === 0;
  const buttons = [
    DOMElements.downloadSelectedButton,
    DOMElements.clearSelectionButton,
    DOMElements.deleteSelectedButton,
  ];
  buttons.forEach((button) => {
    if (button) {
      button.disabled = isDisabled;
      button.classList.toggle("opacity-50", isDisabled);
      button.classList.toggle("cursor-not-allowed", isDisabled);
    }
  });
}

// --- Lógica de Acciones de Galería ---
export function toggleImageSelection(imageUrl, itemWrapper) {
  const checkbox = itemWrapper.querySelector('input[type="checkbox"]');
  if (selectedGalleryImages.has(imageUrl)) {
    selectedGalleryImages.delete(imageUrl);
    itemWrapper.classList.remove("selected");
    if (checkbox) checkbox.checked = false;
  } else {
    selectedGalleryImages.add(imageUrl);
    itemWrapper.classList.add("selected");
    if (checkbox) checkbox.checked = true;
  }
  updateDownloadSelectedButtonState();
}

export function clearSelection() {
  selectedGalleryImages.clear();
  if (DOMElements.galleryContainer) {
    DOMElements.galleryContainer
      .querySelectorAll(".gallery-item-wrapper.selected")
      .forEach((item) => {
        item.classList.remove("selected");
        const checkbox = item.querySelector('input[type="checkbox"]');
        if (checkbox) checkbox.checked = false;
      });
  }
  updateDownloadSelectedButtonState();
}

export function toggleSelectAllImages() {
  if (!DOMElements.galleryContainer) return;
  const allImages = loadGalleryImages();
  const allAreSelected = selectedGalleryImages.size === allImages.length;

  allImages.forEach((imageUrl) => {
    if (allAreSelected) {
      selectedGalleryImages.delete(imageUrl);
    } else {
      selectedGalleryImages.add(imageUrl);
    }
  });

  DOMElements.galleryContainer
    .querySelectorAll(".gallery-item-wrapper")
    .forEach((itemWrapper) => {
      itemWrapper.classList.toggle("selected", !allAreSelected);
      const checkbox = itemWrapper.querySelector('input[type="checkbox"]');
      if (checkbox) checkbox.checked = !allAreSelected;
    });

  updateDownloadSelectedButtonState();
}

export async function downloadSelectedImages() {
  if (selectedGalleryImages.size === 0) return;
  showCustomMessage(
    `Descargando ${selectedGalleryImages.size} imágenes...`,
    "info"
  );
  for (const imageUrl of selectedGalleryImages) {
    await downloadImage(imageUrl, `obelisia_img_${Date.now()}.png`);
    await new Promise((res) => setTimeout(res, 200));
  }
  showCustomMessage("Descarga completada.", "success");
  clearSelection();
}

export function deleteImageFromGallery(imageUrl) {
  let images = loadGalleryImages();
  images = images.filter((url) => url !== imageUrl);
  localStorage.setItem("generatedImages", JSON.stringify(images));
  renderGallery();
  renderRecentGenerations();
  showCustomMessage("Imagen eliminada.", "success");
}

export function deleteSelectedImagesFromGallery() {
  if (selectedGalleryImages.size === 0) return;
  let images = loadGalleryImages();
  const originalSize = images.length;
  images = images.filter((url) => !selectedGalleryImages.has(url));
  localStorage.setItem("generatedImages", JSON.stringify(images));
  showCustomMessage(
    `${originalSize - images.length} imágenes eliminadas.`,
    "success"
  );
  clearSelection();
  renderGallery();
  renderRecentGenerations();
}

// --- Lógica del Lightbox y Editor ---
export function openLightbox(imageUrl) {
  if (!DOMElements.lightbox) return;
  const galleryImages = loadGalleryImages();
  setCurrentLightboxIndex(galleryImages.findIndex((img) => img === imageUrl));
  updateLightboxContent();
  DOMElements.lightbox.classList.add("show");
}

export function closeLightbox() {
  if (DOMElements.lightbox) DOMElements.lightbox.classList.remove("show");
}

export function updateLightboxContent() {
  if (!DOMElements.lightboxImage || !DOMElements.lightboxThumbnails) return;
  const galleryImages = loadGalleryImages();
  if (galleryImages.length === 0 || currentLightboxIndex === -1) {
    closeLightbox();
    return;
  }
  if (currentLightboxIndex >= galleryImages.length) setCurrentLightboxIndex(0);
  if (currentLightboxIndex < 0)
    setCurrentLightboxIndex(galleryImages.length - 1);

  DOMElements.lightboxImage.src = galleryImages[currentLightboxIndex];

  DOMElements.lightboxThumbnails.innerHTML = "";
  galleryImages.forEach((url, index) => {
    const thumb = document.createElement("img");
    thumb.src = url;
    thumb.className = "lightbox-thumbnail-item";
    if (index === currentLightboxIndex) thumb.classList.add("active");
    thumb.addEventListener("click", () => {
      setCurrentLightboxIndex(index);
      updateLightboxContent();
    });
    DOMElements.lightboxThumbnails.appendChild(thumb);
  });
  const activeThumb = DOMElements.lightboxThumbnails.querySelector(".active");
  if (activeThumb)
    activeThumb.scrollIntoView({
      behavior: "smooth",
      block: "nearest",
      inline: "center",
    });
}

export function showNextImage() {
  setCurrentLightboxIndex(currentLightboxIndex + 1);
  updateLightboxContent();
}

export function showPrevImage() {
  setCurrentLightboxIndex(currentLightboxIndex - 1);
  updateLightboxContent();
}

export function openImageEditor(imageUrl) {
  if (!DOMElements.imageEditorModal || !DOMElements.editorCanvas) return;
  setEditingImageUrl(imageUrl);
  originalEditorImage.src = imageUrl;
  originalEditorImage.crossOrigin = "Anonymous";
  originalEditorImage.onload = () => {
    const editorCtx = DOMElements.editorCanvas.getContext("2d");
    if (!editorCtx) return;
    setEditorCtx(editorCtx);

    const maxCanvasHeight = window.innerHeight * 0.6;
    const maxCanvasWidth =
      DOMElements.editorCanvas.parentElement.clientWidth * 0.9;
    const aspectRatio =
      originalEditorImage.naturalWidth / originalEditorImage.naturalHeight;

    let newWidth = Math.min(originalEditorImage.naturalWidth, maxCanvasWidth);
    let newHeight = newWidth / aspectRatio;

    if (newHeight > maxCanvasHeight) {
      newHeight = maxCanvasHeight;
      newWidth = newHeight * aspectRatio;
    }

    DOMElements.editorCanvas.width = newWidth;
    DOMElements.editorCanvas.height = newHeight;

    redrawEditorCanvas();
    DOMElements.imageEditorModal.classList.add("show");
    renderFilterThumbnails();
  };
  setEditorCurrentFilter("none");
  setEditorTextData({
    content: "",
    color: "#FFFFFF",
    size: 30,
    position: "bottomRight",
  });
}
