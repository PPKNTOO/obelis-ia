// js/components/modals.js

// --- SELECTORES DE ELEMENTOS DEL DOM ---
// Este módulo buscará sus propios elementos para ser autocontenido.
const DOMElements = {
  messageModal: document.querySelector("#messageModal"),
  messageModalCloseButton: document.querySelector("#messageModalCloseButton"),
  messageModalText: document.querySelector("#messageModalText"),
  messageModalIcon: document.querySelector("#messageModalIcon"),

  cookieConsent: document.querySelector("#cookieConsent"),
  acceptCookiesButton: document.querySelector("#acceptCookiesButton"),

  subscriptionModal: document.querySelector("#subscriptionModal"),
  emailInput: document.querySelector("#emailInput"),
  subscribeButton: document.querySelector("#subscribeButton"),
  noThanksButton: document.querySelector("#noThanksButton"),

  loadingOverlayModal: document.querySelector("#loadingOverlayModal"),
  loadingMessageTextModal: document.querySelector("#loadingMessageTextModal"),
  loadingModalCloseButton: document.querySelector("#loadingModalCloseButton"),
};

// --- FUNCIONES INTERNAS DEL MÓDULO ---

function showCookieConsent() {
  if (DOMElements.cookieConsent && !localStorage.getItem("cookieAccepted")) {
    DOMElements.cookieConsent.classList.add("show");
  }
}

function acceptCookies() {
  localStorage.setItem("cookieAccepted", "true");
  if (DOMElements.cookieConsent) {
    DOMElements.cookieConsent.classList.remove("show");
  }
  // Muestra el modal de suscripción solo después de aceptar cookies
  if (
    !localStorage.getItem("subscribed") &&
    !localStorage.getItem("noThanksSubscription")
  ) {
    showSubscriptionModal();
  }
}

function showSubscriptionModal() {
  if (DOMElements.subscriptionModal) {
    DOMElements.subscriptionModal.classList.add("show");
  }
}

function handleSubscription() {
  if (!DOMElements.emailInput || !DOMElements.subscriptionModal) return;
  const email = DOMElements.emailInput.value.trim();
  if (email && /\S+@\S+\.\S+/.test(email)) {
    // Simple validación de email
    localStorage.setItem("subscribed", "true");
    DOMElements.subscriptionModal.classList.remove("show");
    showCustomMessage("¡Gracias por suscribirte!", "success");
  } else {
    showCustomMessage(
      "Por favor, introduce un correo electrónico válido.",
      "error"
    );
  }
}

function dismissSubscription() {
  localStorage.setItem("noThanksSubscription", "true");
  if (DOMElements.subscriptionModal) {
    DOMElements.subscriptionModal.classList.remove("show");
  }
}

// --- FUNCIONES PÚBLICAS (EXPORTADAS) ---

export function showCustomMessage(message, type = "info", duration = 3000) {
  if (!DOMElements.messageModal) return;

  DOMElements.messageModalText.textContent = message;
  // Lógica para los iconos
  DOMElements.messageModal.classList.add("show");

  setTimeout(() => {
    hideCustomMessage();
  }, duration);
}

export function hideCustomMessage() {
  if (!DOMElements.messageModal) return;
  DOMElements.messageModal.classList.remove("show");
}

export function showLoadingOverlay(message = "Cargando...") {
  if (!DOMElements.loadingOverlayModal) return;
  DOMElements.loadingMessageTextModal.textContent = message;
  DOMElements.loadingOverlayModal.classList.add("show");
}

export function hideLoadingOverlay() {
  if (!DOMElements.loadingOverlayModal) return;
  DOMElements.loadingOverlayModal.classList.remove("show");
}

// --- FUNCIÓN DE INICIALIZACIÓN DEL MÓDULO ---

export function initializeModals() {
  // Solo se ejecuta si los elementos principales existen
  if (
    !DOMElements.cookieConsent &&
    !DOMElements.messageModal &&
    !DOMElements.subscriptionModal
  ) {
    return;
  }

  showCookieConsent();

  // Asignar Event Listeners
  if (DOMElements.acceptCookiesButton) {
    DOMElements.acceptCookiesButton.addEventListener("click", acceptCookies);
  }
  if (DOMElements.subscribeButton) {
    DOMElements.subscribeButton.addEventListener("click", handleSubscription);
  }
  if (DOMElements.noThanksButton) {
    DOMElements.noThanksButton.addEventListener("click", dismissSubscription);
  }
  if (DOMElements.messageModalCloseButton) {
    DOMElements.messageModalCloseButton.addEventListener(
      "click",
      hideCustomMessage
    );
  }
  // Cerrar modal al hacer clic fuera
  if (DOMElements.messageModal) {
    DOMElements.messageModal.addEventListener("click", (e) => {
      if (e.target === DOMElements.messageModal) hideCustomMessage();
    });
  }
}
