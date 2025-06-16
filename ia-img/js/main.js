// ia-img/js/main.js

// Importaciones desde el directorio global de JS
import {
  DOMElements,
  downloadImage,
  showCustomMessage,
} from "../../js/global.js";

// Importaciones desde los nuevos módulos de ia-img
import { CONFIG } from "./config.js";
import {
  freeGenerationsLeft,
  setFreeGenerationsLeft,
  lastGeneratedImageUrl,
  setLastGeneratedImageUrl,
  originalEditorImage, // Acceso a la Image original del estado
  setEditorCtx,
  setEditorTextData,
  setEditorCurrentFilter,
} from "./state.js";
import {
  renderGallery,
  renderRecentGenerations,
  updateDownloadSelectedButtonState,
  downloadSelectedImages,
  deleteSelectedImagesFromGallery,
  clearSelection,
  openLightbox,
  closeLightbox,
  updateLightboxContent,
  showNextImage,
  showPrevImage,
  openImageEditor, // Importado directamente desde galleryManager
} from "./galleryManager.js";
import {
  generatePromptSuggestion,
  improvePrompt,
  generateImage,
  watchAdForGenerations,
} from "./aiService.js";
import {
  updateGenerationCounterUI,
  showPromptSuggestionBox,
} from "./uiUpdater.js";
import {
  closeImageEditor, // Aquí importamos la función 'closeImageEditor' del editorManager
  redrawEditorCanvas,
  applyFilterToCanvas,
  addTextToCanvas,
  applyCrop,
  saveEditedImage,
  renderFilterThumbnails,
} from "./editorManager.js"; // Importar funciones del editor

// initApp: la función principal de inicialización para este módulo
function initApp() {
  // Inicializa DOMElements aquí, para asegurarte de que el DOM esté completamente cargado.
  // ¡¡IMPORTANTE!! Extiende el DOMElements global con los elementos específicos de ia-img.
  Object.assign(DOMElements, {
    promptInput: document.getElementById("promptInput"),
    generateButton: document.getElementById("generateButton"),
    generatedImage: document.getElementById("generatedImage"),
    imagePlaceholderText: document.getElementById("imagePlaceholderText"),
    downloadMainImageButton: document.getElementById("downloadMainImageButton"),
    galleryContainer: document.getElementById("galleryContainer"),
    selectAllButton: document.getElementById("selectAllButton"),
    downloadSelectedButton: document.getElementById("downloadSelectedButton"),
    clearSelectionButton: document.getElementById("clearSelectionButton"),
    deleteSelectedButton: document.getElementById("deleteSelectedButton"),
    lightbox: document.getElementById("lightbox"),
    lightboxImage: document.getElementById("lightboxImage"),
    lightboxCloseButton: document.getElementById("lightboxCloseButton"),
    lightboxPrevButton: document.getElementById("lightboxPrevButton"),
    lightboxNextButton: document.getElementById("lightboxNextButton"),
    lightboxThumbnails: document.getElementById("lightboxThumbnails"),
    promptSuggestionBox: document.getElementById("promptSuggestionBox"),
    generatePromptSuggestionButton: document.getElementById(
      "generatePromptSuggestionButton"
    ),
    toneSelect: document.getElementById("toneSelect"),
    improvePromptButton: document.getElementById("improvePromptButton"),
    generationCounter: document.getElementById("generationCounter"),
    watchAdButton: document.getElementById("watchAdButton"),
    imageEditorModal: document.getElementById("imageEditorModal"),
    editorCanvas: document.getElementById("editorCanvas"),
    editorCloseButton: document.getElementById("editorCloseButton"),
    filterThumbnails: document.getElementById("filterThumbnails"),
    editorTextInput: document.getElementById("editorTextInput"),
    editorTextColor: document.getElementById("editorTextColor"),
    editorTextSize: document.getElementById("editorTextSize"),
    editorTextPosition: document.getElementById("editorTextPosition"),
    addTextToCanvasButton: document.getElementById("addTextToCanvasButton"),
    applyCropButton: document.getElementById("applyCropButton"),
    cropWidthInput: document.getElementById("cropWidthInput"),
    cropHeightInput: document.getElementById("cropHeightInput"),
    saveEditedImageButton: document.getElementById("saveEditedImageButton"),
    cancelEditButton: document.getElementById("cancelEditButton"),
    styleSelect: document.getElementById("styleSelect"),
    aspectRatioSelect: document.getElementById("aspectRatioSelect"),
    recentGenerationsGallery: document.getElementById(
      "recentGenerationsGallery"
    ),
    downloadLastGeneratedButton: document.getElementById(
      "downloadLastGeneratedButton"
    ),
  });

  // Cargar estado inicial y actualizar UI
  const storedGenerations = localStorage.getItem("freeGenerationsLeft");
  if (storedGenerations !== null) {
    setFreeGenerationsLeft(parseInt(storedGenerations, 10));
  } else {
    setFreeGenerationsLeft(CONFIG.MAX_FREE_GENERATIONS);
    localStorage.setItem("freeGenerationsLeft", freeGenerationsLeft);
  }
  updateGenerationCounterUI();

  const lastImageUrlFromStorage = localStorage.getItem(
    "lastGeneratedImageUrlDisplayed"
  );
  if (lastImageUrlFromStorage) {
    DOMElements.generatedImage.src = lastImageUrlFromStorage;
    DOMElements.generatedImage.alt = `Última imagen generada`;
    DOMElements.generatedImage.classList.remove("hidden");
    DOMElements.imagePlaceholderText.classList.add("hidden");
    DOMElements.downloadMainImageButton.classList.remove("hidden");
    setLastGeneratedImageUrl(lastImageUrlFromStorage); // Asegura que lastGeneratedImageUrl también se actualice
  } else {
    DOMElements.generatedImage.classList.add("hidden");
    DOMElements.imagePlaceholderText.classList.remove("hidden");
    DOMElements.downloadMainImageButton.classList.add("hidden");
  }

  renderGallery();
  renderRecentGenerations();

  setTimeout(
    showPromptSuggestionBox,
    CONFIG.PROMPT_SUGGESTION_DELAY_SECONDS * 1000
  );

  // --- Configuración de Event Listeners ---
  if (DOMElements.generateButton)
    DOMElements.generateButton.addEventListener("click", () => generateImage());
  if (DOMElements.downloadMainImageButton) {
    DOMElements.downloadMainImageButton.addEventListener("click", () => {
      const imageUrl = DOMElements.generatedImage.src;
      if (imageUrl && !imageUrl.includes("placehold.co")) {
        downloadImage(imageUrl, "imagen-generada.png");
      } else {
        showCustomMessage("No hay una imagen válida para descargar.", "error");
      }
    });
  }
  if (DOMElements.selectAllButton)
    DOMElements.selectAllButton.addEventListener("click", () =>
      toggleSelectAllImages()
    );
  if (DOMElements.downloadSelectedButton)
    DOMElements.downloadSelectedButton.addEventListener("click", () =>
      downloadSelectedImages()
    );
  if (DOMElements.clearSelectionButton)
    DOMElements.clearSelectionButton.addEventListener("click", () =>
      clearSelection()
    );
  if (DOMElements.deleteSelectedButton)
    DOMElements.deleteSelectedButton.addEventListener("click", () =>
      deleteSelectedImagesFromGallery()
    );

  if (DOMElements.lightboxCloseButton)
    DOMElements.lightboxCloseButton.addEventListener("click", () =>
      closeLightbox()
    );
  if (DOMElements.lightbox) {
    DOMElements.lightbox.addEventListener("click", (e) => {
      if (e.target === DOMElements.lightbox) {
        closeLightbox();
      }
    });
  }
  if (DOMElements.lightboxPrevButton)
    DOMElements.lightboxPrevButton.addEventListener("click", () =>
      showPrevImage()
    );
  if (DOMElements.lightboxNextButton)
    DOMElements.lightboxNextButton.addEventListener("click", () =>
      showNextImage()
    );

  if (DOMElements.generatePromptSuggestionButton)
    DOMElements.generatePromptSuggestionButton.addEventListener("click", () =>
      generatePromptSuggestion()
    );
  if (DOMElements.improvePromptButton)
    DOMElements.improvePromptButton.addEventListener("click", () =>
      improvePrompt()
    );

  if (DOMElements.promptInput) {
    DOMElements.promptInput.addEventListener("input", () => {
      if (DOMElements.promptSuggestionBox)
        DOMElements.promptSuggestionBox.classList.remove("show");
    });
  }

  if (DOMElements.watchAdButton)
    DOMElements.watchAdButton.addEventListener("click", () =>
      watchAdForGenerations()
    );

  if (DOMElements.downloadLastGeneratedButton) {
    DOMElements.downloadLastGeneratedButton.addEventListener("click", () => {
      if (
        lastGeneratedImageUrl &&
        !lastGeneratedImageUrl.includes("placehold.co")
      ) {
        downloadImage(lastGeneratedImageUrl, "ultima-imagen-ia.png");
        showCustomMessage("Última imagen descargada.", "success");
      } else {
        showCustomMessage(
          "No hay una última imagen generada para descargar.",
          "info"
        );
      }
    });
  }

  // Editor de imagen (event listeners)
  if (DOMElements.editorCanvas) {
    const ctx = DOMElements.editorCanvas.getContext("2d");
    if (ctx) setEditorCtx(ctx); // Asigna el contexto al estado global
  }

  // Usar la función importada directamente dentro del callback
  if (DOMElements.editorCloseButton)
    DOMElements.editorCloseButton.addEventListener("click", () =>
      closeImageEditor()
    );
  if (DOMElements.cancelEditButton)
    DOMElements.cancelEditButton.addEventListener("click", () =>
      closeImageEditor()
    );
  if (DOMElements.saveEditedImageButton)
    DOMElements.saveEditedImageButton.addEventListener("click", () =>
      saveEditedImage()
    );
  if (DOMElements.addTextToCanvasButton)
    DOMElements.addTextToCanvasButton.addEventListener("click", () =>
      addTextToCanvas()
    );
  if (DOMElements.applyCropButton)
    DOMElements.applyCropButton.addEventListener("click", () => applyCrop());

  if (DOMElements.editorTextInput) {
    DOMElements.editorTextInput.addEventListener("input", () => {
      setEditorTextData({ content: DOMElements.editorTextInput.value });
      redrawEditorCanvas();
    });
  }
  if (DOMElements.editorTextColor) {
    DOMElements.editorTextColor.addEventListener("input", () => {
      setEditorTextData({ color: DOMElements.editorTextColor.value });
      redrawEditorCanvas();
    });
  }
  if (DOMElements.editorTextSize) {
    DOMElements.editorTextSize.addEventListener("input", () => {
      setEditorTextData({ size: parseInt(DOMElements.editorTextSize.value) });
      redrawEditorCanvas();
    });
  }
  if (DOMElements.editorTextPosition) {
    DOMElements.editorTextPosition.addEventListener("change", () => {
      setEditorTextData({ position: DOMElements.editorTextPosition.value });
      redrawEditorCanvas();
    });
  }
  if (DOMElements.cropWidthInput)
    DOMElements.cropWidthInput.addEventListener("input", () =>
      redrawEditorCanvas()
    );
  if (DOMElements.cropHeightInput)
    DOMElements.cropHeightInput.addEventListener("input", () =>
      redrawEditorCanvas()
    );
}

// Llama a initApp cuando el DOM esté completamente cargado
document.addEventListener("DOMContentLoaded", initApp);
