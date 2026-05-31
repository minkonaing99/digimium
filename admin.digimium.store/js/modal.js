(() => {
  "use strict";

  let root = null;

  function getRoot() {
    if (root) return root;

    root = document.createElement("div");
    root.className = "app-modal";
    root.setAttribute("aria-hidden", "true");
    root.innerHTML =
      '<div class="app-modal-box" role="dialog" aria-modal="true">' +
        '<p class="app-modal-msg"></p>' +
        '<div class="app-modal-actions">' +
          '<button class="app-modal-cancel">Cancel</button>' +
          '<button class="app-modal-ok">OK</button>' +
        '</div>' +
      '</div>';
    document.body.appendChild(root);
    return root;
  }

  function open(msg, isConfirm) {
    return new Promise((resolve) => {
      const el = getRoot();
      el.querySelector(".app-modal-msg").textContent = msg;

      const cancelBtn = el.querySelector(".app-modal-cancel");
      const okBtn     = el.querySelector(".app-modal-ok");
      cancelBtn.style.display = isConfirm ? "" : "none";

      el.classList.add("active");
      el.setAttribute("aria-hidden", "false");
      okBtn.focus();

      const cleanup = (result) => {
        el.classList.remove("active");
        el.setAttribute("aria-hidden", "true");
        okBtn.removeEventListener("click", onOk);
        cancelBtn.removeEventListener("click", onCancel);
        document.removeEventListener("keydown", onKey);
        resolve(result);
      };

      const onOk     = () => cleanup(true);
      const onCancel = () => cleanup(false);
      const onKey    = (e) => {
        if (e.key === "Enter")  { e.preventDefault(); cleanup(true); }
        if (e.key === "Escape") { e.preventDefault(); cleanup(false); }
      };

      okBtn.addEventListener("click", onOk);
      cancelBtn.addEventListener("click", onCancel);
      document.addEventListener("keydown", onKey);
    });
  }

  window.showAlert   = (msg) => open(String(msg), false);
  window.showConfirm = (msg) => open(String(msg), true);
})();
