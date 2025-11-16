document.addEventListener("DOMContentLoaded", () => {
  const hidePreloader = () => {
    const preloader = document.getElementById("logo-preloader");
    if (!preloader || preloader.classList.contains("logo-preloader--hidden")) {
      return;
    }

    requestAnimationFrame(() => {
      preloader.classList.add("logo-preloader--hidden");
      setTimeout(() => {
        preloader.remove();
      }, 400);
    });
  };

  window.addEventListener("load", hidePreloader, { once: true });

  const loadComponents = (root = document) => {
    const containers = root.querySelectorAll('[data-component-src]');

    containers.forEach((container) => {
      const src = container.getAttribute("data-component-src");

      fetch(src, { cache: "no-store" })
        .then((response) => {
          if (!response.ok) {
            throw new Error(`Failed to load component: ${src}`);
          }
          return response.text();
        })
        .then((html) => {
          container.innerHTML = html;
          container.removeAttribute("data-component-src");

          const injected = container.querySelectorAll("script");
          injected.forEach((candidate) => {
            const content = candidate.textContent || "";
            if (content.includes("Live reload enabled.") || content.includes("Code injected by live-server")) {
              candidate.remove();
            }
          });

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

          loadComponents(container);
          if (!document.querySelector('[data-component-src]')) {
            setTimeout(hidePreloader, 0);
          }
        })
        .catch((error) => {
          console.error(error);
        });
    });
  };

  loadComponents();
});
