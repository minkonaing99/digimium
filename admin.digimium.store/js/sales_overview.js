"use strict";

// Global utility — also used by sales_add_form.js and ws_sales_add_form.js
function todayDate() {
  const d = new Date();
  return (
    d.getFullYear() +
    "-" +
    String(d.getMonth() + 1).padStart(2, "0") +
    "-" +
    String(d.getDate()).padStart(2, "0")
  );
}

// One-time page setup: search reveal/hide UI
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
      if (e.key === "Escape") {
        input.value = "";
        input.blur();
      }
    });
  }
});

// One-time refresh button — dispatches to whichever tab is active
document.getElementById("refreshBtn")?.addEventListener("click", async function () {
  this.style.setProperty("display", "none", "important");
  this.disabled = true;
  try {
    const retailBtn = document.getElementById("retail_page");
    const isRetailActive = retailBtn && retailBtn.classList.contains("btn-active");
    if (isRetailActive) {
      await (window.refreshSalesTable?.() ?? Promise.resolve());
    } else {
      await (window.refreshWsSalesTable?.() ?? Promise.resolve());
    }
  } finally {
    setTimeout(() => {
      this.disabled = false;
      this.style.setProperty("display", "inline-block", "important");
    }, 5000);
  }
});

createSalesModule({
  apiList:     "api/sales_table.php",
  apiDelete:   "api/sale_delete.php",
  apiInline:   "api/sale_update_inline.php",
  tbodyId:     "sales_table",
  subsListId:  "subsList",
  cacheKey:    "cachedSales:v2",
  isWholesale: false,
  deferred:    false,
  refreshKey:  "refreshSalesTable",
  prependKey:  "prependSaleRow",
  loadKey:     null,
});
