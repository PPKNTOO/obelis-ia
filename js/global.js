// raiz/js/global.js

// Declare DOMElements as a global variable. It will be populated in initGlobalApp.
let DOMElements = {};

// Helper function to safely get elements (returns null if not found)
function getElement(selector, isQuerySelectorAll = false) {
  const element = isQuerySelectorAll
    ? document.querySelectorAll(selector)
    : document.querySelector(selector);
  if (!element || (isQuerySelectorAll && element.length === 0)) {
    // console.warn(`Elemento(s) con selector "${selector}" no encontrado(s).`);
    return null;
  }
  return element;
}

// --- FUNCIONES DE UTILIDAD GENERAL ---

/**
 * Descarga una imagen dada su URL o Data URL de forma robusta.
 * Convierte la imagen a un Blob para asegurar la descarga directa.
 * @param {string} imageUrl - La URL o Data URL de la imagen.
 * @param {string} filename - El nombre del archivo para la descarga (con extensión).
 * @returns {Promise<void>}
 */
async function downloadImage(imageUrl, filename = "imagen.png") {
  try {
    // Si la URL es una data URL, la convertimos a Blob directamente
    if (imageUrl.startsWith("data:")) {
      const response = await fetch(imageUrl);
      const blob = await response.blob();
      const url = URL.createObjectURL(blob);

      const link = document.createElement("a");
      link.href = url;
      link.download = filename; // Establece el nombre de archivo
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url); // Libera el objeto URL
      console.log(`Descarga iniciada para: ${filename}`);
    } else {
      // Para URLs externas, intentamos un fetch para crear un Blob
      const response = await fetch(imageUrl, {
        mode: "cors", // Asegúrate de que CORS esté habilitado si es una URL externa
      });
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      const blob = await response.blob();
      const url = URL.createObjectURL(blob);

      const link = document.createElement("a");
      link.href = url;
      link.download = filename; // Establece el nombre de archivo
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url); // Libera el objeto URL
      console.log(`Descarga iniciada para: ${filename}`);
    }
  } catch (error) {
    console.error("Error al descargar la imagen:", error);
    // showCustomMessage ya está definido, se usa globalmente.
    showCustomMessage(
      `Error al descargar la imagen: ${error.message}.`,
      "error",
      5000
    );
  }
}

/**
 * Muestra un mensaje personalizado en el modal genérico.
 */
function showCustomMessage(message, type = "info", duration = 3000) {
  if (
    !DOMElements.messageModalText ||
    !DOMElements.messageModalIcon ||
    !DOMElements.messageModal
  ) {
    console.warn(
      "Error: Los elementos del modal de mensajes no están inicializados en DOMElements."
    );
    return;
  }
  DOMElements.messageModalText.textContent = message;
  switch (type) {
    case "success":
      DOMElements.messageModalIcon.textContent = "✔️";
      DOMElements.messageModalIcon.className = "mt-4 text-4xl success";
      break;
    case "error":
      DOMElements.messageModalIcon.textContent = "❌";
      DOMElements.messageModalIcon.className = "mt-4 text-4xl error";
      break;
    case "info":
    default:
      DOMElements.messageModalIcon.textContent = "💡";
      DOMElements.messageModalIcon.className = "mt-4 text-4xl info";
      break;
  }
  DOMElements.messageModal.classList.add("show");
  setTimeout(() => {
    hideCustomMessage();
  }, duration);
}

/** Oculta el modal de mensajes genérico. */
function hideCustomMessage() {
  if (!DOMElements.messageModal) return;
  DOMElements.messageModal.classList.remove("show");
  if (DOMElements.messageModalText)
    DOMElements.messageModalText.textContent = "";
  if (DOMElements.messageModalIcon)
    DOMElements.messageModalIcon.className = "mt-4 text-4xl";
}

/**
 * Calcula y muestra el uso del almacenamiento local.
 */
function updateLocalStorageUsage() {
  if (!DOMElements.localStorageUsage) return;

  let totalBytes = 0;
  for (let i = 0; i < localStorage.length; i++) {
    const key = localStorage.key(i);
    totalBytes += localStorage.getItem(key).length * 2;
  }
  const totalKB = totalBytes / 1024;
  const totalMB = totalKB / 1024;

  let usageText = "";
  if (totalMB >= 1) {
    usageText = `${totalMB.toFixed(2)} MB`;
  } else {
    usageText = `${totalKB.toFixed(2)} KB`;
  }
  DOMElements.localStorageUsage.textContent = `Uso del Almacenamiento Local: ${usageText}`;

  const QUOTA_WARNING_MB = 4;
  if (totalMB >= QUOTA_WARNING_MB) {
    showCustomMessage(
      `¡Advertencia! El almacenamiento local se está llenando (${usageText}). Considera limpiar la galería.`,
      "info",
      7000
    );
  }
}

// --- GESTIÓN DE COOKIES Y SUSCRIPCIÓN ---

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
  if (
    !localStorage.getItem("subscribed") &&
    !localStorage.getItem("noThanksSubscription")
  ) {
    showSubscriptionModal();
  }
}

function showSubscriptionModal() {
  if (
    DOMElements.subscriptionModal &&
    !localStorage.getItem("subscribed") &&
    !localStorage.getItem("noThanksSubscription")
  ) {
    DOMElements.subscriptionModal.classList.add("show");
  }
}

function handleSubscription() {
  if (!DOMElements.emailInput || !DOMElements.subscriptionModal) return;
  const email = DOMElements.emailInput.value.trim();
  if (email) {
    console.log("Correo suscrito:", email);
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

// --- BARRA DE NAVEGACIÓN (ACTIVE CLASS) ---
function updateActiveClass() {
  const navbarContent = document.querySelector(".navbar-inner-content");
  if (!navbarContent) {
    return;
  }

  // Primero, resetea todas las clases 'active-link' de enlaces, submenús y spans de padres
  navbarContent.querySelectorAll("a.active-link").forEach((link) => {
    link.classList.remove("active-link");
    link.removeAttribute("aria-current");
  });
  navbarContent
    .querySelectorAll(".submenu-item.active-link")
    .forEach((item) => {
      item.classList.remove("active-link");
    });
  navbarContent
    .querySelectorAll(".nav-item.group > span.cursor-pointer.active-link")
    .forEach((span) => {
      span.classList.remove("active-link");
    });

  const currentPath = window.location.pathname;

  const normalizePath = (path) => {
    let normalized = path;
    if (normalized.endsWith("/index.html") || normalized.endsWith(".html")) {
      normalized = normalized.replace(/\/[^/]+\.html$/, "/");
    }
    if (!normalized.endsWith("/")) {
      normalized += "/";
    }
    return normalized;
  };

  const normalizedCurrentPath = normalizePath(currentPath);

  // Itera sobre todos los enlaces (<a>) y elementos de submenú (.submenu-item)
  navbarContent.querySelectorAll("a, .submenu-item").forEach((item) => {
    const href = item.getAttribute("href");

    if (href === "#" || !href) {
      return; // Pasa al siguiente elemento del bucle
    }

    const itemPath = normalizePath(
      new URL(href, window.location.origin + window.location.pathname).pathname
    );

    let isActive = false;

    if (itemPath === "/" && normalizedCurrentPath === "/") {
      isActive = true;
    } else if (itemPath !== "/" && normalizedCurrentPath.startsWith(itemPath)) {
      isActive = true;
    }

    if (isActive) {
      item.classList.add("active-link");
      item.setAttribute("aria-current", "page");

      const parentSubmenu = item.closest(".submenu");
      if (parentSubmenu) {
        const parentNavItem = parentSubmenu.closest(".nav-item.group");
        if (parentNavItem) {
          const parentSpan = parentNavItem.querySelector("span.cursor-pointer");
          if (parentSpan) {
            parentSpan.classList.add("active-link");
          }
        }
      }
    }
  });
}

// Función separada para el listener de FAQ para poder removerlo
// Esta función ahora es global para ser reutilizada en todos los módulos
function toggleFaqAnswer(event) {
  const question = event.currentTarget;
  const answer = question.nextElementSibling;
  const arrow = question.querySelector(".faq-arrow");

  // Asegurar que las propiedades de transición estén en su lugar
  answer.style.transition =
    "max-height 0.4s ease-out, padding-top 0.4s ease-out, padding-bottom 0.4s ease-out";

  const currentMaxHeight = getComputedStyle(answer).maxHeight;
  const isOpen = currentMaxHeight !== "0px";

  // Close all other open FAQs (assuming they are in the same faq-container)
  const faqContainer = question.closest(".faq-container");
  if (faqContainer) {
    faqContainer.querySelectorAll(".faq-answer").forEach((otherAnswer) => {
      if (
        otherAnswer !== answer &&
        getComputedStyle(otherAnswer).maxHeight !== "0px"
      ) {
        otherAnswer.style.maxHeight = "0px";
        otherAnswer.style.paddingTop = "0px";
        otherAnswer.style.paddingBottom = "0px";
        const otherArrow =
          otherAnswer.previousElementSibling.querySelector(".faq-arrow");
        if (otherArrow) otherArrow.classList.remove("rotated");
      }
    });
  }

  // Toggle the current FAQ
  if (isOpen) {
    answer.style.maxHeight = "0px";
    answer.style.paddingTop = "0px";
    answer.style.paddingBottom = "0px";
    arrow.classList.remove("rotated");
  } else {
    // Temporarily set max-height to 'auto' to get the true scrollHeight
    // Apply desired paddings BEFORE measuring scrollHeight so it's included
    answer.style.maxHeight = "auto";
    answer.style.paddingTop = "1.5rem"; // Target padding top
    answer.style.paddingBottom = "2rem"; // Target padding bottom

    // Force reflow to get correct scrollHeight immediately
    void answer.offsetWidth;

    const scrollHeight = answer.scrollHeight;

    // Set max-height to the calculated scrollHeight
    answer.style.maxHeight = scrollHeight + "px";

    arrow.classList.add("rotated");
  }
}

// --- initGlobalApp: la función principal de inicialización para scripts generales ---
function initGlobalApp() {
  // Inicialización robusta de DOMElements
  // Aquí recogemos los elementos que deberían existir en TODAS las páginas que usan global.js
  DOMElements.messageModal = getElement("#messageModal");
  DOMElements.messageModalCloseButton = getElement("#messageModalCloseButton");
  DOMElements.messageModalText = getElement("#messageModalText");
  DOMElements.messageModalIcon = getElement("#messageModalIcon");

  DOMElements.cookieConsent = getElement("#cookieConsent");
  DOMElements.acceptCookiesButton = getElement("#acceptCookiesButton");

  DOMElements.subscriptionModal = getElement("#subscriptionModal");
  DOMElements.emailInput = getElement("#emailInput");
  DOMElements.subscribeButton = getElement("#subscribeButton");
  DOMElements.noThanksButton = getElement("#noThanksButton");

  DOMElements.localStorageUsage = getElement("#localStorageUsage"); // Para ia-img

  DOMElements.menuToggle = getElement("#menuToggle");
  DOMElements.navLinksContainer = getElement(
    ".navbar-inner-content .flex-wrap"
  );

  // Elementos del modal de carga global (loadingOverlayModal)
  DOMElements.loadingOverlayModal = getElement("#loadingOverlayModal");
  DOMElements.pocoyoGifModal = getElement("#pocoyoGifModal"); // Puede ser null si solo hay spinner
  DOMElements.loadingSpinnerModal = getElement("#loadingSpinnerModal"); // Puede ser null si solo hay gif
  DOMElements.loadingMessageTextModal = getElement("#loadingMessageTextModal");
  DOMElements.loadingErrorTextModal = getElement("#loadingErrorTextModal");
  DOMElements.loadingModalCloseButton = getElement("#loadingModalCloseButton");

  // Elementos del adModal global (si existe en la página principal y no en los módulos)
  DOMElements.adModal = getElement("#adModal");
  DOMElements.adTimerDisplay = getElement("#adTimer");

  // Inicializaciones condicionales
  if (DOMElements.localStorageUsage) updateLocalStorageUsage();
  if (DOMElements.cookieConsent) showCookieConsent();

  // --- Configuración de Event Listeners Globales ---
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
  if (DOMElements.messageModal) {
    DOMElements.messageModal.addEventListener("click", (event) => {
      if (event.target === DOMElements.messageModal) {
        hideCustomMessage();
      }
    });
  }
  if (DOMElements.loadingModalCloseButton) {
    // Listener para cerrar el modal de carga/error
    DOMElements.loadingModalCloseButton.addEventListener("click", () => {
      DOMElements.loadingOverlayModal.classList.remove("show");
    });
  }

  // Navegación responsive - Solo agrega listeners si AMBOS elementos se encuentran
  if (DOMElements.menuToggle && DOMElements.navLinksContainer) {
    DOMElements.menuToggle.addEventListener("click", () => {
      DOMElements.navLinksContainer.classList.toggle("active");
      const toggleIcon = DOMElements.menuToggle.querySelector("i");
      if (toggleIcon) {
        toggleIcon.classList.toggle("fa-bars");
        toggleIcon.classList.toggle("fa-times");
      }
    });

    document.addEventListener("click", (event) => {
      if (!DOMElements.navLinksContainer || !DOMElements.menuToggle) return;

      const isClickInsideNav = DOMElements.navLinksContainer.contains(
        event.target
      );
      const isClickOnToggle = DOMElements.menuToggle.contains(event.target);

      if (
        !isClickInsideNav &&
        !isClickOnToggle &&
        DOMElements.navLinksContainer.classList.contains("active")
      ) {
        DOMElements.navLinksContainer.classList.remove("active");
        const toggleIcon = DOMElements.menuToggle.querySelector("i");
        if (toggleIcon) {
          toggleIcon.classList.remove("fa-times");
          toggleIcon.classList.add("fa-bars");
        }
      }
    });

    DOMElements.navLinksContainer.querySelectorAll("a").forEach((link) => {
      link.addEventListener("click", () => {
        if (window.innerWidth <= 768) {
          DOMElements.navLinksContainer.classList.remove("active");
          const toggleIcon = DOMElements.menuToggle.querySelector("i");
          if (toggleIcon) {
            toggleIcon.classList.remove("fa-times");
            toggleIcon.classList.add("fa-bars");
          }
        }
      });
    });
  }

  // **NUEVO/REVISADO: Funcionalidad FAQ GLOBAL**
  const faqQuestions = document.querySelectorAll(".faq-question");
  if (faqQuestions.length > 0) {
    faqQuestions.forEach((question) => {
      // Eliminar listeners antiguos si existieran para evitar duplicados
      question.removeEventListener("click", toggleFaqAnswer);
      // Añadir el nuevo listener
      question.addEventListener("click", toggleFaqAnswer);
    });
  }

  updateActiveClass();
}

// Función separada para el listener de FAQ para poder removerlo
// Esta función ahora es global para ser reutilizada en todos los módulos
function toggleFaqAnswer(event) {
  const question = event.currentTarget;
  const answer = question.nextElementSibling;
  const arrow = question.querySelector(".faq-arrow");

  // Forzar un reflow antes de verificar el estado para obtener el valor más actual de maxHeight
  void answer.offsetWidth;

  const currentMaxHeight = getComputedStyle(answer).maxHeight;
  const isOpen = currentMaxHeight !== "0px";

  // Close all other open FAQs (assuming they are in the same faq-container)
  const faqContainer = question.closest(".faq-container");
  if (faqContainer) {
    faqContainer.querySelectorAll(".faq-answer").forEach((otherAnswer) => {
      if (
        otherAnswer !== answer &&
        getComputedStyle(otherAnswer).maxHeight !== "0px"
      ) {
        otherAnswer.style.maxHeight = "0px";
        otherAnswer.style.paddingTop = "0px";
        otherAnswer.style.paddingBottom = "0px";
        const otherArrow =
          otherAnswer.previousElementSibling.querySelector(".faq-arrow");
        if (otherArrow) otherArrow.classList.remove("rotated");
      }
    });
  }

  // Toggle the current FAQ
  if (isOpen) {
    answer.style.maxHeight = "0px";
    answer.style.paddingTop = "0px";
    answer.style.paddingBottom = "0px";
    arrow.classList.remove("rotated");
  } else {
    // Temporarily set max-height to 'auto' to get the true scrollHeight
    // Apply desired paddings BEFORE measuring scrollHeight so it's included
    answer.style.maxHeight = "auto";
    answer.style.paddingTop = "1.5rem"; // Target padding top
    answer.style.paddingBottom = "2rem"; // Target padding bottom

    // Force reflow again after setting paddings to include them in scrollHeight
    void answer.offsetWidth;

    const scrollHeight = answer.scrollHeight;

    // Set max-height to the calculated scrollHeight
    answer.style.maxHeight = scrollHeight + "px";

    arrow.classList.add("rotated");
  }
}

// Llama a initGlobalApp cuando el DOM esté completamente cargado
document.addEventListener("DOMContentLoaded", initGlobalApp);
