(() => {
  "use strict";

  let globalOverlay = null;
  let loadingCount = 0;

  function createGlobalOverlay() {
    if (globalOverlay) return globalOverlay;
    globalOverlay = document.createElement("div");
    globalOverlay.className = "loading-overlay";
    globalOverlay.innerHTML =
      '<div class="loading-content">' +
      '<div class="loading-spinner"></div>' +
      '<div class="loading-text">Loading...</div>' +
      "</div>";
    document.body.appendChild(globalOverlay);
    return globalOverlay;
  }

  function showGlobalLoading(message = "Loading...") {
    const overlay = createGlobalOverlay();
    const textEl = overlay.querySelector(".loading-text");
    if (textEl) textEl.textContent = message;
    overlay.classList.add("active");
    loadingCount++;
  }

  function hideGlobalLoading() {
    if (globalOverlay) {
      loadingCount = Math.max(0, loadingCount - 1);
      if (loadingCount === 0) {
        globalOverlay.classList.remove("active");
      }
    }
  }

  function setButtonLoading(button, loading = true, text = null) {
    if (!button) return;
    if (loading) {
      button.disabled = true;
      button.classList.add("btn-loading");
      button.dataset.originalContent = button.innerHTML;
      const textSpan = document.createElement("span");
      textSpan.className = "btn-text";
      textSpan.textContent = text || button.textContent || "Loading...";
      button.innerHTML = "";
      button.appendChild(textSpan);
    } else {
      button.disabled = false;
      button.classList.remove("btn-loading");
      if (button.dataset.originalContent) {
        button.innerHTML = button.dataset.originalContent;
        delete button.dataset.originalContent;
      }
    }
  }

  // Page-level app loader (#appLoader element) used by sales_overview.js and ws_sales_overview.js
  const appLoaderEl = document.getElementById("appLoader");
  window.showLoader = () => appLoaderEl?.classList.remove("hidden");
  window.hideLoader = () => {
    if (!appLoaderEl) return;
    requestAnimationFrame(() => appLoaderEl.classList.add("hidden"));
  };

  window.LoadingSystem = {
    showGlobalLoading,
    hideGlobalLoading,
    setButtonLoading,
  };

  window.addEventListener("error", () => {
    hideGlobalLoading();
  });
  window.addEventListener("unhandledrejection", () => {
    hideGlobalLoading();
  });
})();
