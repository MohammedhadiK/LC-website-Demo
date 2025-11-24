document.addEventListener("DOMContentLoaded", () => {
  const isPreloaderDisabled = () => window.LC_DISABLE_PRELOADER === true || document.documentElement.hasAttribute("data-disable-preloader");
  const PRELOADER_HIDE_DELAY_MS = 2000;

  const hidePreloader = (forceRemove = false) => {
    const preloader = document.getElementById("logo-preloader");
    if (!preloader) {
      return;
    }

    if (forceRemove || isPreloaderDisabled()) {
      preloader.remove();
      return;
    }

    if (preloader.classList.contains("logo-preloader--hidden")) {
      return;
    }

    requestAnimationFrame(() => {
      preloader.classList.add("logo-preloader--hidden");
      setTimeout(() => {
        preloader.remove();
      }, 400);
    });
  };

  const scheduleHidePreloader = (withDelay = true) => {
    if (isPreloaderDisabled()) {
      hidePreloader(true);
      return;
    }

    const delay = withDelay ? PRELOADER_HIDE_DELAY_MS : 0;
    setTimeout(() => hidePreloader(false), delay);
  };

  window.addEventListener("load", () => scheduleHidePreloader(true), { once: true });

  const loadComponents = async (root = document) => {
    const containers = root.querySelectorAll('[data-component-src]');

    for (const container of containers) {
      const src = container.getAttribute("data-component-src");

      try {
        const response = await fetch(src, { cache: "no-store" });
        
        if (!response.ok) {
          throw new Error(`Failed to load component: ${src}`);
        }

        const html = await response.text();
        container.innerHTML = html;
        container.removeAttribute("data-component-src");

        // Remove live-server injected scripts
        const injected = container.querySelectorAll("script");
        injected.forEach((candidate) => {
          const content = candidate.textContent || "";
          // Check for various live reload signatures
          if (
            content.includes("Live reload enabled.") || 
            content.includes("Code injected by live-server") ||
            content.includes("For SVG support") ||
            content.includes("refreshCSS") ||
            content.includes("WebSocket") && content.includes("window.location.reload")
          ) {
            candidate.remove();
          }
        });

        // Re-execute scripts
        const scripts = container.querySelectorAll("script");
        scripts.forEach((oldScript) => {
          const newScript = document.createElement("script");

          Array.from(oldScript.attributes).forEach((attr) => {
            newScript.setAttribute(attr.name, attr.value);
          });

          if (oldScript.src) {
            newScript.src = oldScript.src;
          } else {
            newScript.textContent = oldScript.textContent;
          }

          oldScript.replaceWith(newScript);
        });

        // Recursively load nested components
        await loadComponents(container);

        // Reinitialize Alpine.js for dynamically loaded content
        if (window.Alpine) {
          try {
            window.Alpine.initTree(container);
          } catch (e) {
            console.warn("Alpine initTree failed:", e);
          }
        }

      } catch (error) {
        console.error(error);
      }
    }

    // Hide preloader when all components are loaded
    if (!document.querySelector('[data-component-src]')) {
      scheduleHidePreloader(true);
    }
  };

  loadComponents();
  
  if (isPreloaderDisabled()) {
    hidePreloader(true);
  }
});
