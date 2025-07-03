// js/global.js

// 1. Exporta el objeto DOMElements para que sea el 'almacén' de elementos del DOM compartido.
export let DOMElements = {};

// 2. Función auxiliar para obtener elementos del DOM de forma segura.
function getElement(selector, isQuerySelectorAll = false) {
  const element = isQuerySelectorAll
    ? document.querySelectorAll(selector)
    : document.querySelector(selector);
  if (!element || (isQuerySelectorAll && element.length === 0)) {
    return null;
  }
  return element;
}

// 3. Lógica de componentes (Navbar, FAQ, Carrusel, Modales)
// Estas funciones ahora usarán el objeto DOMElements.

function initializeNavbar() {
  const { menuToggle, navLinksContainer, navbarInnerContent } = DOMElements;
  if (menuToggle && navLinksContainer) {
    menuToggle.addEventListener("click", () => {
      navLinksContainer.classList.toggle("active");
      const icon = menuToggle.querySelector("i");
      if (icon) {
        icon.classList.toggle("fa-bars");
        icon.classList.toggle("fa-times");
      }
    });
  }

  if (navbarInnerContent) {
    const currentPath =
      window.location.pathname.replace(/index\.html$/, "") || "/";
    navbarInnerContent
      .querySelectorAll("a.nav-item, a.submenu-item")
      .forEach((link) => {
        const linkPath =
          new URL(link.href, window.location.origin).pathname.replace(
            /index\.html$/,
            ""
          ) || "/";
        if (
          (linkPath === "/" && currentPath === "/") ||
          (linkPath !== "/" && currentPath.startsWith(linkPath))
        ) {
          link.classList.add("active-link");
          const parentGroup = link.closest(".nav-item.group");
          if (parentGroup) {
            parentGroup.querySelector("span")?.classList.add("active-link");
          }
        }
      });
  }
}

function toggleFaqAnswer(event) {
  const question = event.currentTarget;
  const answer = question.nextElementSibling;
  if (!answer) return;
  const isOpen = answer.style.maxHeight && answer.style.maxHeight !== "0px";

  document.querySelectorAll(".faq-answer").forEach((ans) => {
    ans.style.maxHeight = "0px";
    ans.previousElementSibling
      ?.querySelector(".faq-arrow")
      ?.classList.remove("rotated");
  });

  if (!isOpen) {
    answer.style.maxHeight = answer.scrollHeight + "px";
    question.querySelector(".faq-arrow")?.classList.add("rotated");
  }
}

function initializeFAQ() {
  const faqQuestions = getElement(".faq-question", true);
  if (faqQuestions) {
    faqQuestions.forEach((q) => q.addEventListener("click", toggleFaqAnswer));
  }
}

function initializeCarousel() {
  const carousel = getElement("#heroCarousel");
  if (!carousel) return;
  const slidesContainer = getElement("#carouselSlides", false, carousel);
  const slides = getElement(".carousel-slide", true, carousel);
  const prevButton = getElement("#prevSlide", false, carousel);
  const nextButton = getElement("#nextSlide", false, carousel);
  const indicatorsContainer = getElement(
    "#carouselIndicators",
    false,
    carousel
  );

  if (
    !slidesContainer ||
    !slides ||
    !prevButton ||
    !nextButton ||
    !indicatorsContainer
  )
    return;

  let currentIndex = 0;
  const totalSlides = slides.length;
  let slideInterval;

  indicatorsContainer.innerHTML = "";
  for (let i = 0; i < totalSlides; i++) {
    const indicator = document.createElement("div");
    indicator.classList.add("carousel-indicator");
    indicator.dataset.index = i;
    indicatorsContainer.appendChild(indicator);
  }
  const indicators = indicatorsContainer.querySelectorAll(
    ".carousel-indicator"
  );

  const goToSlide = (index) => {
    currentIndex = (index + totalSlides) % totalSlides;
    slidesContainer.style.transform = `translateX(-${currentIndex * 100}%)`;
    indicators.forEach((ind, i) =>
      ind.classList.toggle("active", i === currentIndex)
    );
  };

  const startCarousel = () => {
    clearInterval(slideInterval);
    slideInterval = setInterval(() => goToSlide(currentIndex + 1), 5000);
  };

  nextButton.addEventListener("click", () => {
    goToSlide(currentIndex + 1);
    startCarousel();
  });
  prevButton.addEventListener("click", () => {
    goToSlide(currentIndex - 1);
    startCarousel();
  });
  indicators.forEach((ind) =>
    ind.addEventListener("click", (e) => {
      goToSlide(parseInt(e.target.dataset.index));
      startCarousel();
    })
  );

  goToSlide(0);
  startCarousel();
}

function initializeModals() {
  const {
    acceptCookiesButton,
    cookieConsent,
    subscribeButton,
    noThanksButton,
    messageModal,
    messageModalCloseButton,
    loadingModalCloseButton,
  } = DOMElements;
  if (cookieConsent && !localStorage.getItem("cookieAccepted")) {
    cookieConsent.classList.add("show");
  }
  if (acceptCookiesButton) {
    acceptCookiesButton.addEventListener("click", () => {
      localStorage.setItem("cookieAccepted", "true");
      if (cookieConsent) cookieConsent.classList.remove("show");
      if (
        DOMElements.subscriptionModal &&
        !localStorage.getItem("subscribed") &&
        !localStorage.getItem("noThanksSubscription")
      ) {
        DOMElements.subscriptionModal.classList.add("show");
      }
    });
  }
  if (subscribeButton) {
    subscribeButton.addEventListener("click", () => {
      const email = DOMElements.emailInput?.value.trim();
      if (email && /\S+@\S+\.\S+/.test(email)) {
        localStorage.setItem("subscribed", "true");
        if (DOMElements.subscriptionModal)
          DOMElements.subscriptionModal.classList.remove("show");
        showCustomMessage("¡Gracias por suscribirte!", "success");
      } else {
        showCustomMessage("Por favor, introduce un correo válido.", "error");
      }
    });
  }
  if (noThanksButton) {
    noThanksButton.addEventListener("click", () => {
      localStorage.setItem("noThanksSubscription", "true");
      if (DOMElements.subscriptionModal)
        DOMElements.subscriptionModal.classList.remove("show");
    });
  }
  if (messageModalCloseButton)
    messageModalCloseButton.addEventListener("click", hideCustomMessage);
  if (messageModal)
    messageModal.addEventListener("click", (e) => {
      if (e.target === messageModal) hideCustomMessage();
    });
  if (loadingModalCloseButton)
    loadingModalCloseButton.addEventListener("click", hideLoadingOverlay);
}

// 4. Funciones de utilidad que serán exportadas para que otros módulos las usen.
export function showCustomMessage(message, type = "info", duration = 3000) {
  const { messageModal, messageModalText, messageModalIcon } = DOMElements;
  if (!messageModal) return;
  messageModalText.textContent = message;
  messageModalIcon.className = "mt-4 text-4xl";
  switch (type) {
    case "success":
      messageModalIcon.textContent = "✔️";
      break;
    case "error":
      messageModalIcon.textContent = "❌";
      break;
    default:
      messageModalIcon.textContent = "💡";
      break;
  }
  messageModal.classList.add("show");
  setTimeout(hideCustomMessage, duration);
}

export function hideCustomMessage() {
  if (DOMElements.messageModal)
    DOMElements.messageModal.classList.remove("show");
}

export function showLoadingOverlay(message = "Cargando...") {
  const { loadingOverlayModal, loadingMessageTextModal } = DOMElements;
  if (!loadingOverlayModal) return;
  loadingMessageTextModal.textContent = message;
  loadingOverlayModal.classList.add("show");
}

export function hideLoadingOverlay() {
  if (DOMElements.loadingOverlayModal)
    DOMElements.loadingOverlayModal.classList.remove("show");
}

export async function downloadImage(imageUrl, filename = "imagen.png") {
  try {
    const response = await fetch(
      imageUrl.startsWith("data:")
        ? imageUrl
        : new Request(imageUrl, { mode: "cors" })
    );
    const blob = await response.blob();
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  } catch (error) {
    console.error("Error al descargar la imagen:", error);
    showCustomMessage(`Error al descargar: ${error.message}.`, "error");
  }
}

export function updateLocalStorageUsage() {
  if (!DOMElements.localStorageUsage) return;
  let totalBytes = 0;
  for (let i = 0; i < localStorage.length; i++) {
    const key = localStorage.key(i);
    if (key && localStorage.getItem(key))
      totalBytes += localStorage.getItem(key).length * 2;
  }
  DOMElements.localStorageUsage.textContent = `Uso: ${(
    totalBytes / 1024
  ).toFixed(2)} KB`;
}

// 5. La función de inicialización global que será llamada por app.js.
export function initGlobalApp() {
  // Primero, poblamos DOMElements con todos los elementos comunes que puedan existir.
  Object.assign(DOMElements, {
    messageModal: getElement("#messageModal"),
    messageModalText: getElement("#messageModalText"),
    messageModalIcon: getElement("#messageModalIcon"),
    messageModalCloseButton: getElement("#messageModalCloseButton"),
    loadingOverlayModal: getElement("#loadingOverlayModal"),
    loadingMessageTextModal: getElement("#loadingMessageTextModal"),
    loadingModalCloseButton: getElement("#loadingModalCloseButton"),
    cookieConsent: getElement("#cookieConsent"),
    acceptCookiesButton: getElement("#acceptCookiesButton"),
    subscriptionModal: getElement("#subscriptionModal"),
    emailInput: getElement("#emailInput"),
    subscribeButton: getElement("#subscribeButton"),
    noThanksButton: getElement("#noThanksButton"),
    menuToggle: getElement("#menuToggle"),
    navLinksContainer: getElement(".navbar-inner-content .flex-wrap"),
    navbarInnerContent: getElement(".navbar-inner-content"),
    localStorageUsage: getElement("#localStorageUsage"), // Es usado en ia-img, pero lo podemos buscar globalmente.
  });

  // Luego, inicializamos los componentes que usan estos elementos.
  initializeNavbar();
  initializeFAQ();
  initializeCarousel();
  initializeModals();
}
