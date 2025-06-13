// edit-img/js/ui.js

/**
 * Muestra un mensaje en el área de mensajes y en un modal.
 * @param {string} text - El texto del mensaje.
 * @param {'success'|'error'|'warning'|'info'} type - El tipo de mensaje.
 * @param {HTMLElement} messageAreaElement - El elemento DOM del área de mensajes principal.
 */
export function showMessage(text, type, messageAreaElement) {
  if (!messageAreaElement) {
    console.warn(
      "Message area element not found, cannot display message:",
      text
    );
    return;
  }
  // Update the main message area
  messageAreaElement.textContent = text;
  messageAreaElement.className = `message ${type}`; // Tailwind classes for styling
  messageAreaElement.classList.remove("hidden");

  // Update the modal message
  const messageModal = document.getElementById("messageModal");
  const messageModalText = document.getElementById("messageModalText");
  const messageModalIcon = document.getElementById("messageModalIcon");

  if (messageModal && messageModalText && messageModalIcon) {
    messageModalText.textContent = text;
    let iconClass = "";
    let contentBgClass = "";
    if (type === "success") {
      iconClass = "fas fa-check-circle text-green-500";
      contentBgClass = "bg-gray-800"; // O un color para éxito
    } else if (type === "error") {
      iconClass = "fas fa-exclamation-circle text-red-500";
      contentBgClass = "bg-red-900";
    } else if (type === "warning") {
      iconClass = "fas fa-exclamation-triangle text-yellow-500";
      contentBgClass = "bg-yellow-900";
    } else {
      // info
      iconClass = "fas fa-info-circle text-blue-500";
      contentBgClass = "bg-gray-800"; // O un color para info
    }
    messageModalIcon.className = iconClass;
    const messageModalContent = document.getElementById("messageModalContent");
    if (messageModalContent)
      messageModalContent.className = `p-8 rounded-xl shadow-2xl max-w-sm w-11/12 text-center relative ${contentBgClass}`;

    messageModal.classList.remove("invisible", "opacity-0");
    messageModal.classList.add("visible", "opacity-100");
  }

  // Auto-hide the main message area if it's not an error (modal has its own close button)
  if (type !== "error") {
    setTimeout(() => {
      hideMessage(messageAreaElement);
      hideMessageModal(messageModal); // Hide modal too after a delay
    }, 4000);
  }
}

/**
 * Oculta el área de mensajes principal.
 * @param {HTMLElement} messageAreaElement - El elemento DOM del área de mensajes principal.
 */
export function hideMessage(messageAreaElement) {
  if (messageAreaElement) {
    messageAreaElement.classList.add("hidden");
  }
}

/**
 * Oculta el modal de mensajes.
 * @param {HTMLElement} messageModalElement - El elemento DOM del modal de mensajes.
 */
export function hideMessageModal(messageModalElement) {
  if (messageModalElement) {
    messageModalElement.classList.remove("visible", "opacity-100");
    messageModalElement.classList.add("invisible", "opacity-0");
  }
}

/**
 * Muestra u oculta el spinner de carga y habilita/deshabilita controles.
 * @param {boolean} show - True para mostrar, false para ocultar.
 * @param {HTMLElement} loadingSpinnerElement - El elemento DOM del spinner.
 * @param {Object} DOMElements - El objeto con todos los elementos DOM.
 */
export function toggleLoading(show, loadingSpinnerElement, DOMElements) {
  if (loadingSpinnerElement)
    loadingSpinnerElement.style.display = show ? "block" : "none";

  const allControls = document.querySelectorAll(
    'button, input[type="file"], input[type="range"], input[type="color"], input[type="text"], select, label[for="imageUpload"]'
  );
  allControls.forEach((control) => {
    if (control.id === "imageUpload" || control.id === "fileUploadLabel") {
      control.disabled = false; // Siempre permitir cargar archivos
    } else if (
      control.id === "undoBtn" ||
      control.id === "redoBtn" ||
      control.id === "menuUndoBtn" ||
      control.id === "menuRedoBtn"
    ) {
      // Deshabilitar deshacer/rehacer solo si se está mostrando loading
      control.disabled = show;
      control.classList.toggle("disabled-btn", show);
    } else {
      // Deshabilitar todos los demás controles
      control.disabled = show;
      control.classList.toggle("disabled-btn", show);
    }
  });

  if (!show) {
    // Re-actualizar el estado de los botones undo/redo y descargas después de que la carga termine
    if (
      DOMElements.undoBtn &&
      DOMElements.redoBtn &&
      DOMElements.history && // Estos deben ser pasados o accesibles globalmente si no son parte de DOMElements
      DOMElements.historyIndex // Estos deben ser pasados o accesibles globalmente si no son parte de DOMElements
    ) {
      updateUndoRedoButtons(
        DOMElements.undoBtn,
        DOMElements.redoBtn,
        DOMElements.historyIndex.current,
        DOMElements.history.current.length
      );
    }
    if (
      DOMElements.downloadCounter &&
      DOMElements.menuDownloadImageBtn &&
      DOMElements.watchAdButton
    ) {
      // Asumiendo que freeDownloadsLeft se mantiene en main.js y se pasa
      const freeDownloadsLeft = parseInt(
        localStorage.getItem("freeDownloadsLeft") || 0
      ); // O obtenerlo de un estado global pasado
      updateDownloadCounterUI(
        DOMElements.downloadCounter,
        DOMElements.menuDownloadImageBtn,
        DOMElements.watchAdButton,
        freeDownloadsLeft,
        showMessage
      );
    }
  }
}

/**
 * Actualiza la interfaz del contador de descargas.
 * @param {HTMLElement} downloadCounterElement - El elemento DOM del contador de descargas.
 * @param {HTMLElement} menuDownloadImageBtn - El botón de descarga del menú.
 * @param {HTMLElement} watchAdButton - El botón para ver anuncio.
 * @param {number} freeDownloadsLeft - Número de descargas gratuitas restantes.
 * @param {function} showMessageCallback - Función para mostrar mensajes.
 */
export function updateDownloadCounterUI(
  downloadCounterElement,
  menuDownloadImageBtn,
  watchAdButton,
  freeDownloadsLeft,
  showMessageCallback
) {
  if (downloadCounterElement)
    downloadCounterElement.textContent = `Descargas gratuitas restantes: ${freeDownloadsLeft}`;

  if (menuDownloadImageBtn) {
    const hasImageLoaded =
      !!document.getElementById("imageCanvas") &&
      document.getElementById("imageCanvas").width > 0;
    menuDownloadImageBtn.disabled = !hasImageLoaded || freeDownloadsLeft <= 0;
    menuDownloadImageBtn.classList.toggle(
      "disabled-btn",
      !hasImageLoaded || freeDownloadsLeft <= 0
    );
  }

  if (freeDownloadsLeft <= 0) {
    if (watchAdButton) watchAdButton.classList.remove("hidden");
    // Asegúrate de que el messageAreaElement exista al llamar showMessageCallback
    showMessageCallback(
      "Has agotado tus descargas gratuitas. Mira un anuncio para obtener más.",
      "warning",
      document.getElementById("messageArea")
    );
  } else {
    if (watchAdButton) watchAdButton.classList.add("hidden");
    const messageArea = document.getElementById("messageArea");
    if (
      messageArea &&
      messageArea.textContent.includes("agotado tus descargas")
    ) {
      hideMessage(messageArea);
    }
  }
}

/**
 * Simula la visualización de un anuncio y otorga descargas adicionales.
 * @param {number} freeDownloadsLeft - Contador actual de descargas.
 * @param {number} downloadsPerAdWatch - Descargas obtenidas por anuncio.
 * @param {HTMLElement} watchAdButton - El botón de ver anuncio.
 * @param {function} updateDownloadCounterUICallback - Función para actualizar la UI del contador.
 * @param {HTMLElement} downloadCounterElement - Elemento DOM del contador.
 * @param {HTMLElement} menuDownloadImageBtn - Botón de descarga.
 * @param {function} showMessageCallback - Función para mostrar mensajes.
 * @param {HTMLElement} messageAreaElement - Elemento DOM del área de mensajes.
 */
export function watchAdForGenerations(
  freeDownloadsLeft,
  downloadsPerAdWatch,
  watchAdButton,
  updateDownloadCounterUICallback,
  downloadCounterElement,
  menuDownloadImageBtn,
  showMessageCallback,
  messageAreaElement
) {
  showMessageCallback(
    "Simulando anuncio... por favor espera.",
    "info",
    messageAreaElement
  );
  if (watchAdButton) watchAdButton.disabled = true;

  setTimeout(() => {
    let updatedDownloads = freeDownloadsLeft + downloadsPerAdWatch;
    localStorage.setItem("freeDownloadsLeft", updatedDownloads);
    updateDownloadCounterUICallback(
      downloadCounterElement,
      menuDownloadImageBtn,
      watchAdButton,
      updatedDownloads,
      showMessageCallback
    );
    if (watchAdButton) watchAdButton.disabled = false;
    showMessageCallback(
      `¡Has obtenido +${downloadsPerAdWatch} descargas!`,
      "success",
      messageAreaElement
    );
  }, 3000); // Simular 3 segundos de anuncio
}

/**
 * Muestra el banner de consentimiento de cookies si no ha sido aceptado.
 * @param {HTMLElement} cookieConsentElement - El elemento DOM del banner de cookies.
 */
export function showCookieConsent(cookieConsentElement) {
  if (cookieConsentElement && !localStorage.getItem("cookieAccepted")) {
    cookieConsentElement.classList.add("show");
  }
}

/**
 * Acepta las cookies y oculta el banner, luego muestra el modal de suscripción.
 * @param {HTMLElement} cookieConsentElement - El elemento DOM del banner de cookies.
 * @param {function} showSubscriptionModalCallback - Función para mostrar el modal de suscripción.
 * @param {HTMLElement} subscriptionModalElement - El elemento DOM del modal de suscripción.
 */
export function acceptCookies(
  cookieConsentElement,
  showSubscriptionModalCallback,
  subscriptionModalElement
) {
  localStorage.setItem("cookieAccepted", "true");
  if (cookieConsentElement) cookieConsentElement.classList.remove("show");
  showSubscriptionModalCallback(subscriptionModalElement);
}

/**
 * Muestra el modal de suscripción si el usuario no se ha suscrito o ha dicho "No, gracias" previamente.
 * @param {HTMLElement} subscriptionModalElement - El elemento DOM del modal de suscripción.
 */
export function showSubscriptionModal(subscriptionModalElement) {
  if (
    subscriptionModalElement &&
    !localStorage.getItem("subscribed") &&
    !localStorage.getItem("noThanksSubscription")
  ) {
    subscriptionModalElement.classList.add("show");
  }
}

/**
 * Maneja el proceso de suscripción.
 * @param {HTMLInputElement} emailInputElement - El input del correo electrónico.
 * @param {HTMLElement} subscriptionModalElement - El elemento DOM del modal de suscripción.
 * @param {function} showMessageCallback - Función para mostrar mensajes.
 * @param {HTMLElement} messageAreaElement - Elemento DOM del área de mensajes.
 */
export function handleSubscription(
  emailInputElement,
  subscriptionModalElement,
  showMessageCallback,
  messageAreaElement
) {
  const email = emailInputElement.value.trim();
  if (email) {
    console.log("Correo suscrito:", email);
    localStorage.setItem("subscribed", "true");
    if (subscriptionModalElement)
      subscriptionModalElement.classList.remove("show");
    showMessageCallback(
      "¡Gracias por suscribirte!",
      "success",
      messageAreaElement
    );
  } else {
    showMessageCallback(
      "Por favor, introduce un correo electrónico válido.",
      "error",
      messageAreaElement
    );
  }
}

/**
 * Descarta el modal de suscripción y guarda la preferencia.
 * @param {HTMLElement} subscriptionModalElement - El elemento DOM del modal de suscripción.
 */
export function dismissSubscription(subscriptionModalElement) {
  localStorage.setItem("noThanksSubscription", "true");
  if (subscriptionModalElement)
    subscriptionModalElement.classList.remove("show");
}

/**
 * Configura el comportamiento de un menú desplegable.
 * @param {HTMLElement} button - El botón que activa el desplegable.
 * @param {HTMLElement} dropdown - El elemento del menú desplegable.
 */
export function setupDropdown(button, dropdown) {
  if (!button || !dropdown) {
    console.warn("setupDropdown: Botón o Dropdown no encontrado.", {
      button,
      dropdown,
    });
    return;
  }

  button.addEventListener("click", (event) => {
    event.stopPropagation(); // Evita que el clic se propague al documento

    // Cierra todos los demás dropdowns abiertos y quita la clase 'active' de sus botones
    document.querySelectorAll(".menu-dropdown.show").forEach((openDropdown) => {
      if (openDropdown && openDropdown !== dropdown) {
        openDropdown.classList.remove("show");
        // Encuentra el botón asociado y quítale la clase 'active'
        const associatedButton = openDropdown.previousElementSibling;
        if (
          associatedButton &&
          associatedButton.classList.contains("menu-item-button")
        ) {
          associatedButton.classList.remove("active");
        }
      }
    });

    // Toggle (alternar) la visibilidad del dropdown actual y la clase 'active' del botón
    dropdown.classList.toggle("show");
    button.classList.toggle("active"); // Añadir/quitar la clase 'active' al botón
  });

  // Cierra el dropdown si se hace clic fuera de él
  document.addEventListener("click", (event) => {
    if (!button.contains(event.target) && !dropdown.contains(event.target)) {
      dropdown.classList.remove("show");
      button.classList.remove("active"); // Quitar la clase 'active' al botón cuando se cierra
    }
  });

  // Cierra el dropdown si se hace clic en un ítem dentro de él (excepto headers y separadores)
  dropdown.querySelectorAll(".menu-dropdown-item").forEach((item) => {
    if (
      !item.classList.contains("header") &&
      !item.classList.contains("separator")
    ) {
      item.addEventListener("click", () => {
        dropdown.classList.remove("show");
        button.classList.remove("active"); // Quitar la clase 'active' al botón cuando se cierra
      });
    }
  });
}

/**
 * Actualiza la clase activa de los enlaces de navegación.
 * @param {HTMLElement} mainNavbarElement - El elemento DOM de la barra de navegación principal.
 */
export function updateActiveClass(mainNavbarElement) {
  if (!mainNavbarElement) {
    console.warn(
      "Navbar principal no encontrada para actualizar la clase activa. Asegúrate de que tenga id='main-navbar'."
    );
    return;
  }

  // Limpiar todas las clases 'active-link' y 'aria-current'
  mainNavbarElement.querySelectorAll("a").forEach((link) => {
    link.classList.remove("active-link");
    link.removeAttribute("aria-current");
  });
  mainNavbarElement.querySelectorAll(".submenu-item").forEach((item) => {
    item.classList.remove("active-link");
  });
  mainNavbarElement.querySelectorAll(".nav-item.group").forEach((group) => {
    const span = group.querySelector("span.cursor-pointer");
    if (span) {
      span.classList.remove("active-link");
    }
  });

  const normalizePath = (path) => {
    let normalized = path;
    if (normalized.endsWith("/index.html")) {
      normalized = normalized.slice(0, -11);
    }
    if (!normalized.endsWith("/")) {
      normalized += "/";
    }
    return normalized;
  };

  const normalizedCurrentPath = normalizePath(window.location.pathname);
  const origin = window.location.origin;

  // Iterar sobre todos los enlaces principales y de submenú para aplicar la clase activa
  mainNavbarElement.querySelectorAll("a").forEach((item) => {
    const href = item.getAttribute("href");
    if (href) {
      const itemPath = normalizePath(new URL(href, origin).pathname);

      if (normalizedCurrentPath === itemPath) {
        item.classList.add("active-link");
        item.setAttribute("aria-current", "page");

        const parentSubmenu = item.closest(".submenu");
        if (parentSubmenu) {
          const parentNavItem = parentSubmenu.closest(".nav-item.group");
          if (parentNavItem) {
            const span = parentNavItem.querySelector("span.cursor-pointer");
            if (span) {
              span.classList.add("active-link");
            }
          }
        }
      }
    }
  });
}

/**
 * Configura la funcionalidad de la barra de navegación responsive.
 * @param {HTMLElement} menuToggleElement - El botón de alternar el menú (hamburguesa).
 * @param {HTMLElement} navLinksContainerElement - El contenedor de enlaces de navegación.
 * @param {HTMLElement} mainNavbarElement - La barra de navegación principal.
 */
export function setupNavbarResponsive(
  menuToggleElement,
  navLinksContainerElement,
  mainNavbarElement
) {
  if (menuToggleElement && navLinksContainerElement) {
    menuToggleElement.addEventListener("click", () => {
      navLinksContainerElement.classList.toggle("active");
      menuToggleElement.querySelector("i").classList.toggle("fa-bars");
      menuToggleElement.querySelector("i").classList.toggle("fa-times");
    });
    // Click fuera para cerrar el menú responsive
    document.addEventListener("click", (event) => {
      const isClickInsideNav = navLinksContainerElement.contains(event.target);
      const isClickOnToggle = menuToggleElement.contains(event.target);
      if (
        !isClickInsideNav &&
        !isClickOnToggle &&
        navLinksContainerElement.classList.contains("active")
      ) {
        navLinksContainerElement.classList.remove("active");
        menuToggleElement.querySelector("i").classList.remove("fa-times");
        menuToggleElement.querySelector("i").classList.add("fa-bars");
      }
    });
    // Cierra el menú responsive al hacer clic en un enlace
    navLinksContainerElement.querySelectorAll("a").forEach((link) => {
      link.addEventListener("click", () => {
        if (window.innerWidth <= 768) {
          navLinksContainerElement.classList.remove("active");
          menuToggleElement.querySelector("i").classList.remove("fa-times");
          menuToggleElement.querySelector("i").classList.add("fa-bars");
        }
      });
    });
  }
  updateActiveClass(mainNavbarElement);
}

/**
 * Actualiza el estado de los botones Deshacer/Rehacer (disabled/enabled).
 * @param {HTMLElement} undoBtn - Botón de deshacer.
 * @param {HTMLElement} redoBtn - Botón de rehacer.
 * @param {number} historyIndex - Índice actual en el historial.
 * @param {number} historyLength - Longitud total del historial.
 */
export function updateUndoRedoButtons(
  undoBtn,
  redoBtn,
  historyIndex,
  historyLength
) {
  if (undoBtn) {
    undoBtn.disabled = historyIndex <= 0;
    undoBtn.classList.toggle("disabled-btn", historyIndex <= 0);
  }
  if (redoBtn) {
    redoBtn.disabled = historyIndex >= historyLength - 1;
    redoBtn.classList.toggle("disabled-btn", historyIndex >= historyLength - 1);
  }
}
