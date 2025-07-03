// ia-img/js/state.js

import { CONFIG } from "./config.js"; // Necesario para inicializar freeGenerationsLeft

export let freeGenerationsLeft = CONFIG.MAX_FREE_GENERATIONS;
export let selectedGalleryImages = new Set();
export let currentLightboxIndex = 0;
export let fallbackImageIndex = 0;
export let lastGeneratedImageUrl = null; // Para el botón de descarga rápida

export let editorCtx; // Contexto del canvas del editor
export let originalEditorImage = new Image(); // Imagen original cargada en el editor
export let currentEditorImage = new Image(); // No usado en el script original, pero mantenido por si acaso.
export let editorCurrentFilter = "none";
export let editorTextData = {
  content: "",
  color: "#FFFFFF",
  size: 30,
  position: "bottomRight",
};
export let editingImageUrl = null; // URL de la imagen que se está editando actualmente

// Funciones para actualizar el estado, para que puedan ser importadas
export function setFreeGenerationsLeft(value) {
  freeGenerationsLeft = value;
}

export function setSelectedGalleryImages(newSet) {
  selectedGalleryImages = newSet;
}

export function setCurrentLightboxIndex(index) {
  currentLightboxIndex = index;
}

export function setFallbackImageIndex(index) {
  fallbackImageIndex = index;
}

export function setLastGeneratedImageUrl(url) {
  lastGeneratedImageUrl = url;
}

export function setEditorCtx(ctx) {
  editorCtx = ctx;
}

export function setEditorCurrentFilter(filter) {
  editorCurrentFilter = filter;
}

export function setEditorTextData(data) {
  editorTextData = { ...editorTextData, ...data };
}

export function setEditingImageUrl(url) {
  editingImageUrl = url;
}
