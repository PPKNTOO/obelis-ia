// edit-img/js/ui.js
import {
  DOMElements,
  showCustomMessage as showGlobalMessage,
  hideCustomMessage as hideGlobalMessage,
} from "../../js/global.js";
import { freeDownloadsLeft, setFreeDownloadsLeft } from "./main.js";
import { CONFIG } from "./utils/constants.js";
import { history, historyIndex } from "./history.js";

export function showMessage(text, type = "info") {
  if (DOMElements.messageArea) {
    DOMElements.messageArea.textContent = text;
    DOMElements.messageArea.className = `message ${type}`;
    DOMElements.messageArea.classList.remove("hidden");
    setTimeout(() => DOMElements.messageArea.classList.add("hidden"), 4000);
  }
  // También mostramos el modal global para consistencia
  showGlobalMessage(text, type);
}

export function toggleLoading(show) {
  if (DOMElements.loadingSpinner)
    DOMElements.loadingSpinner.style.display = show ? "block" : "none";
  const controls = document.querySelectorAll("button, input, select, label");
  controls.forEach((control) => {
    if (!control.closest(".loading-spinner")) {
      control.disabled = show;
    }
  });
}

export function updateUndoRedoButtons() {
  if (DOMElements.undoBtn)
    DOMElements.undoBtn.disabled = historyIndex.current <= 0;
  if (DOMElements.redoBtn)
    DOMElements.redoBtn.disabled =
      historyIndex.current >= history.current.length - 1;
}

export function updateDownloadCounterUI() {
  if (DOMElements.downloadCounter)
    DOMElements.downloadCounter.textContent = `Descargas gratuitas restantes: ${freeDownloadsLeft}`;
  if (DOMElements.menuDownloadImageBtn)
    DOMElements.menuDownloadImageBtn.disabled = freeDownloadsLeft <= 0;
  if (DOMElements.watchAdButton)
    DOMElements.watchAdButton.classList.toggle("hidden", freeDownloadsLeft > 0);
}

export function watchAdForGenerations(currentDownloads, onComplete) {
  // ... lógica para el anuncio
  const newCount = currentDownloads + CONFIG.DOWNLOADS_PER_AD_WATCH;
  localStorage.setItem("freeDownloadsLeft", newCount);
  if (onComplete) onComplete(newCount);
  showMessage(
    `¡Has obtenido +${CONFIG.DOWNLOADS_PER_AD_WATCH} descargas!`,
    "success"
  );
}

export function setupDropdown(button, dropdown) {
  if (!button || !dropdown) return;
  button.addEventListener("click", (e) => {
    e.stopPropagation();
    const isShown = dropdown.classList.contains("show");
    document
      .querySelectorAll(".menu-dropdown.show")
      .forEach((d) => d.classList.remove("show"));
    if (!isShown) dropdown.classList.add("show");
  });
}
// Cierre global de dropdowns
document.addEventListener("click", () => {
  document
    .querySelectorAll(".menu-dropdown.show")
    .forEach((d) => d.classList.remove("show"));
});

// ... El resto de funciones de UI (acceptCookies, etc.) pueden ser eliminadas de aquí
// si ya están siendo manejadas por global.js, o mantenidas si tienen lógica específica.
// Por simplicidad, asumimos que son manejadas por global.js
export const {
  acceptCookies,
  dismissSubscription,
  handleSubscription,
  showCookieConsent,
  showSubscriptionModal,
  hideMessageModal,
} = await import("../../js/global.js");
