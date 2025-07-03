// ia-img/js/main.js

import { DOMElements, downloadImage } from "../../js/global.js";
import {
  generateImage,
  improvePrompt,
  generatePromptSuggestion,
  watchAdForGenerations,
} from "./aiService.js";
import {
  renderGallery,
  renderRecentGenerations,
  toggleSelectAllImages,
  downloadSelectedImages,
  clearSelection,
  deleteSelectedImagesFromGallery,
  closeLightbox,
  showNextImage,
  showPrevImage,
} from "./galleryManager.js";
import {
  closeImageEditor,
  saveEditedImage,
  addTextToCanvas,
  applyCrop,
} from "./editorManager.js";
import {
  updateGenerationCounterUI,
  showPromptSuggestionBox,
} from "./uiUpdater.js";
import { setFreeGenerationsLeft } from "./state.js";
import { CONFIG } from "./config.js";

export function initApp() {
  // Selectores específicos de esta página
  const pageSelectors = {
    // Generación Principal
    promptInput: "#promptInput",
    generateButton: "#generateButton",
    improvePromptButton: "#improvePromptButton",
    toneSelect: "#toneSelect",
    styleSelect: "#styleSelect",
    aspectRatioSelect: "#aspectRatioSelect",
    generationCounter: "#generationCounter",
    watchAdButton: "#watchAdButton",
    generatedImage: "#generatedImage",
    imagePlaceholderText: "#imagePlaceholderText",
    downloadMainImageButton: "#downloadMainImageButton",

    // Sugerencia de Prompt
    promptSuggestionBox: "#promptSuggestionBox",
    generatePromptSuggestionButton: "#generatePromptSuggestionButton",

    // Galería
    galleryContainer: "#galleryContainer",
    selectAllButton: "#selectAllButton",
    downloadSelectedButton: "#downloadSelectedButton",
    clearSelectionButton: "#clearSelectionButton",
    deleteSelectedButton: "#deleteSelectedButton",
    localStorageUsage: "#localStorageUsage",
    recentGenerationsGallery: "#recentGenerationsGallery",
    downloadLastGeneratedButton: "#downloadLastGeneratedButton",

    // Lightbox
    lightbox: "#lightbox",
    lightboxImage: "#lightboxImage",
    lightboxCloseButton: "#lightboxCloseButton",
    lightboxPrevButton: "#lightboxPrevButton",
    lightboxNextButton: "#lightboxNextButton",
    lightboxThumbnails: "#lightboxThumbnails",

    // Editor
    imageEditorModal: "#imageEditorModal",
    editorCanvas: "#editorCanvas",
    editorCloseButton: "#editorCloseButton",
    saveEditedImageButton: "#saveEditedImageButton",
    cancelEditButton: "#cancelEditButton",
    filterThumbnails: "#filterThumbnails",
    editorTextInput: "#editorTextInput",
    editorTextColor: "#editorTextColor",
    editorTextSize: "#editorTextSize",
    editorTextPosition: "#editorTextPosition",
    addTextToCanvasButton: "#addTextToCanvasButton",
    cropWidthInput: "#cropWidthInput",
    cropHeightInput: "#cropHeightInput",
    applyCropButton: "#applyCropButton",
  };

  // Pobla el objeto DOMElements compartido con los elementos de esta página
  for (const key in pageSelectors) {
    const element = document.querySelector(pageSelectors[key]);
    if (element) {
      DOMElements[key] = element;
    }
  }

  if (!DOMElements.generateButton) {
    console.error(
      "Faltan elementos clave. La inicialización de la página se detiene."
    );
    return;
  }

  // --- INICIALIZACIÓN DE ESTADO Y UI ---
  const savedGenerations = localStorage.getItem("freeGenerationsLeft");
  setFreeGenerationsLeft(
    savedGenerations
      ? parseInt(savedGenerations, 10)
      : CONFIG.MAX_FREE_GENERATIONS
  );
  updateGenerationCounterUI();
  renderGallery();
  renderRecentGenerations();
  setTimeout(
    showPromptSuggestionBox,
    CONFIG.PROMPT_SUGGESTION_DELAY_SECONDS * 1000
  );

  // --- ASIGNACIÓN DE EVENT LISTENERS ---

  // Generación
  DOMElements.generateButton.addEventListener("click", generateImage);
  DOMElements.improvePromptButton.addEventListener("click", improvePrompt);
  DOMElements.generatePromptSuggestionButton.addEventListener(
    "click",
    generatePromptSuggestion
  );
  DOMElements.watchAdButton.addEventListener("click", watchAdForGenerations);
  DOMElements.downloadMainImageButton.addEventListener("click", () => {
    const imageUrl = DOMElements.generatedImage.src;
    if (imageUrl && !imageUrl.includes("placehold.co")) {
      downloadImage(imageUrl, "imagen-generada.png");
    }
  });

  // Galería
  DOMElements.selectAllButton.addEventListener("click", toggleSelectAllImages);
  DOMElements.downloadSelectedButton.addEventListener(
    "click",
    downloadSelectedImages
  );
  DOMElements.clearSelectionButton.addEventListener("click", clearSelection);
  DOMElements.deleteSelectedButton.addEventListener(
    "click",
    deleteSelectedImagesFromGallery
  );

  // Lightbox
  DOMElements.lightboxCloseButton.addEventListener("click", closeLightbox);
  DOMElements.lightboxNextButton.addEventListener("click", showNextImage);
  DOMElements.lightboxPrevButton.addEventListener("click", showPrevImage);
  DOMElements.lightbox.addEventListener("click", (e) => {
    if (e.target === DOMElements.lightbox) {
      closeLightbox();
    }
  });

  // Editor
  DOMElements.editorCloseButton.addEventListener("click", closeImageEditor);
  DOMElements.cancelEditButton.addEventListener("click", closeImageEditor);
  DOMElements.saveEditedImageButton.addEventListener("click", saveEditedImage);
  DOMElements.addTextToCanvasButton.addEventListener("click", addTextToCanvas);
  DOMElements.applyCropButton.addEventListener("click", applyCrop);
}
