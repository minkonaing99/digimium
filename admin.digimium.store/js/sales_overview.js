"use strict";

/**
 * Retail sales tab – wires up the shared controller and search toggle UI.
 * Data logic lives in sales_controller.js (createSalesController).
 */

// Search-input reveal/hide UI (shared element, bound once here since retail loads first)
document.addEventListener("DOMContentLoaded", () => {
  const btn   = document.getElementById("searchBtn");
  const wrap  = document.getElementById("searchCustomerWrapper");
  const input = document.getElementById("search_customer");
  if (btn && wrap && input) {
    btn.addEventListener("click", (e) => {
      e.preventDefault();
      btn.classList.add("is-hidden");
      wrap.classList.add("is-visible");
      setTimeout(() => input.focus(), 10);
    });
    input.addEventListener("blur", () => {
      setTimeout(() => {
        input.value = "";
        wrap.classList.remove("is-visible");
        btn.classList.remove("is-hidden");
      }, 120);
    });
    input.addEventListener("keydown", (e) => {
      if (e.key === "Escape") { input.value = ""; input.blur(); }
    });
  }
});

// Retail controller
(() => {
  const retailBtn = () => document.getElementById("retail_page");

  const STORE_CLASSES = {
    0: "store-void",
    1: "store-digimium",
    2: "store-dmarwal",
    3: "store-ember",
    4: "store-violet",
    5: "store-void",
  };

  const ctrl = createSalesController({
    apiList:    "api/sales_table.php",
    apiDelete:  "api/sale_delete.php",
    apiInline:  "api/sale_update_inline.php",
    tbodyId:    "sales_table",
    subsListId: "subsList",
    cacheKey:   "cachedSales:v2",
    refreshKey: "refreshSalesTable",
    isActive:   () => !retailBtn() || retailBtn().classList.contains("btn-active"),
    rowClass:   (s) => STORE_CLASSES[s.store ?? 0] ?? "store-default",
    cardTopRow: (r, esc) => {
      const renew = Number.isFinite(+r.renew) ? +r.renew : (r.renew ?? "-");
      return `<div class="subs-renew"><span class="subs-label">Renew: </span><span>${esc(renew)}</span></div>`;
    },
  });

  if (ctrl) {
    if (document.readyState === "loading") {
      document.addEventListener("DOMContentLoaded", ctrl.loadSales);
    } else {
      ctrl.loadSales();
    }
  }
})();
