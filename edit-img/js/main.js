// edit-img/js/main.js

import { DOMElements } from "../../js/global.js";
import { CONFIG } from "./utils/constants.js";
import {
  showMessage,
  toggleLoading,
  updateUndoRedoButtons,
  setupDropdown,
  hideMessageModal,
  watchAdForGenerations,
  updateDownloadCounterUI,
  acceptCookies,
  dismissSubscription,
  handleSubscription,
  showCookieConsent,
  showSubscriptionModal,
} from "./ui.js";
import {
  drawImageOnCanvas,
  getMousePos,
  clearCanvas,
  editorCtx,
  imageCanvas,
} from "./canvas.js";
import { saveState, undo, redo, setHistoryState } from "./history.js";
import { activateTool, activeToolState } from "./tools/toolManager.js";
import { applyFilter } from "./filters/filterManager.js";
import {
  applyAdjustments,
  resetAdjustments,
} from "./adjustments/colorAdjustments.js";
import { startBrush, drawBrush, endBrush } from "./tools/brushTool.js";
import { startEraser, drawEraser, endEraser } from "./tools/eraserTool.js";
import { drawText } from "./tools/textTool.js";
import { pickColor } from "./tools/eyedropperTool.js";
import {
  handleCropStart,
  handleCropMove,
  handleCropEnd,
  applyCrop,
  cancelCrop,
} from "./tools/cropTool.js";

// --- Variables de Estado del Módulo ---
export let originalImage = null;
export let currentImageBuffer = null;
export let freeDownloadsLeft = CONFIG.MAX_FREE_DOWNLOADS;

export function setOriginalImage(img) {
  originalImage = img;
}
export function setCurrentImageBuffer(buffer) {
  currentImageBuffer = buffer;
}
export function setFreeDownloadsLeft(count) {
  freeDownloadsLeft = count;
}

// --- Lógica de Manejo de Archivos (Restaurada aquí) ---
function handleImageUpload(event) {
  toggleLoading(true);
  const file = event.target.files[0];
  if (!file) {
    toggleLoading(false);
    return;
  }
  const reader = new FileReader();
  reader.onload = (e) => {
    const img = new Image();
    img.onload = () => {
      setOriginalImage(img);
      currentImageBuffer = document.createElement("canvas");
      currentImageBuffer.width = img.width;
      currentImageBuffer.height = img.height;
      currentImageBuffer.getContext("2d").drawImage(img, 0, 0);

      drawImageOnCanvas(img);
      setHistoryState([]);
      saveState(currentImageBuffer);
      showMessage("Imagen cargada.", "success");
      toggleLoading(false);
      updateDownloadCounterUI();
    };
    img.onerror = () => {
      showMessage("Error: El archivo no es una imagen válida.", "error");
      toggleLoading(false);
    };
    img.src = e.target.result;
  };
  reader.readAsDataURL(file);
}

function downloadCurrentImage() {
  if (!currentImageBuffer) {
    showMessage("No hay imagen para descargar.", "error");
    return;
  }
  if (freeDownloadsLeft <= 0) {
    showMessage("Has agotado tus descargas gratuitas.", "error");
    return;
  }
  const dataURL = DOMElements.imageCanvas.toDataURL("image/png");
  const link = document.createElement("a");
  link.href = dataURL;
  link.download = "editado-obelisia.png";
  link.click();

  setFreeDownloadsLeft(freeDownloadsLeft - 1);
  localStorage.setItem("freeDownloadsLeft", freeDownloadsLeft);
  updateDownloadCounterUI();
}

function findAndAssignDOMElements() {
  const selectors = {
    imageUpload: "#imageUpload",
    imageCanvas: "#imageCanvas",
    placeholderText: "#placeholderText",
    fileUploadLabel: "#fileUploadLabel",
    menuDownloadImageBtn: "#menuDownloadImageBtn",
    menuResetImageBtn: "#menuResetImageBtn",
    menuClearCanvasBtn: "#menuClearCanvasBtn",
    // ... (el resto de tus selectores... son muchos, así que los omito aquí por brevedad,
    // pero deben estar todos los de la versión que te di antes)
    undoBtn: "#undoBtn",
    redoBtn: "#redoBtn",
    downloadCounter: "#downloadCounter",
    watchAdButton: "#watchAdButton",
    messageArea: "#messageArea",
  };
  for (const key in selectors) {
    DOMElements[key] = document.querySelector(selectors[key]);
  }
  // Asignar todos los elementos de los menús desplegables también
  DOMElements.fileMenuBtn = document.getElementById("fileMenuBtn");
  DOMElements.editMenuBtn = document.getElementById("editMenuBtn");
  // ... y así sucesivamente para todos los elementos.
}

function setupEventListeners() {
  DOMElements.imageUpload.addEventListener("change", handleImageUpload);
  DOMElements.menuDownloadImageBtn.addEventListener(
    "click",
    downloadCurrentImage
  );
  // ... El resto de tus event listeners...
}

export function initApp() {
  findAndAssignDOMElements(); // Esta función debe poblar el DOMElements importado

  if (!DOMElements.imageCanvas) {
    console.error("Canvas no encontrado. El editor no puede inicializarse.");
    return;
  }

  // Asigna el canvas y el contexto a los módulos que los exportan
  imageCanvas.current = DOMElements.imageCanvas;
  editorCtx.current = DOMElements.imageCanvas.getContext("2d");

  const storedDownloads = localStorage.getItem("freeDownloadsLeft");
  setFreeDownloadsLeft(
    storedDownloads ? parseInt(storedDownloads, 10) : CONFIG.MAX_FREE_DOWNLOADS
  );

  updateDownloadCounterUI();
  updateUndoRedoButtons();
  toggleLoading(false);

  setupEventListeners();

  activateTool("brush");
}
