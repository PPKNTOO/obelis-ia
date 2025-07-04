// js/components/navbar.js

function updateActiveClass() {
  const navbarContent = document.querySelector(".navbar-inner-content");
  if (!navbarContent) return;

  // Resetea todas las clases activas
  navbarContent.querySelectorAll(".active-link").forEach((link) => {
    link.classList.remove("active-link");
    link.removeAttribute("aria-current");
  });

  const currentPath =
    window.location.pathname.replace(/index\.html$/, "") || "/";

  // Itera sobre todos los enlaces
  navbarContent
    .querySelectorAll("a.nav-item, a.submenu-item")
    .forEach((link) => {
      const linkPath =
        new URL(link.href).pathname.replace(/index\.html$/, "") || "/";

      // Comprueba si la ruta actual coincide o es sub-ruta
      if (
        (linkPath === "/" && currentPath === "/") ||
        (linkPath !== "/" && currentPath.startsWith(linkPath))
      ) {
        link.classList.add("active-link");
        link.setAttribute("aria-current", "page");

        // Si es un enlace de submenú, resalta también el padre
        const parentSubmenu = link.closest(".submenu");
        if (parentSubmenu) {
          const parentNavItem = parentSubmenu.closest(".nav-item.group");
          if (parentNavItem) {
            parentNavItem.querySelector("span").classList.add("active-link");
          }
        }
      }
    });
}

function handleResponsiveMenu() {
  const menuToggle = document.querySelector("#menuToggle");
  const navLinksContainer = document.querySelector(
    ".navbar-inner-content .flex-wrap"
  );

  if (!menuToggle || !navLinksContainer) return;

  menuToggle.addEventListener("click", () => {
    navLinksContainer.classList.toggle("active");
    const toggleIcon = menuToggle.querySelector("i");
    if (toggleIcon) {
      toggleIcon.classList.toggle("fa-bars");
      toggleIcon.classList.toggle("fa-times");
    }
  });
}

// La única función que este módulo exporta. Se encarga de todo.
export function initializeNavbar() {
  updateActiveClass();
  handleResponsiveMenu();
}
