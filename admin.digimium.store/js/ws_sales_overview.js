"use strict";

/**
 * Wholesale sales tab – lazy-loaded on first tab click.
 * add_sales_toggle.js calls window.initWholesaleSales() on the first wholesale click.
 * Data logic lives in sales_controller.js (createSalesController).
 */

(() => {
  const wholesaleBtn = () => document.getElementById("wholesale_page");

  const ctrl = createSalesController({
    apiList:    "api/ws_sales_table.php",
    apiDelete:  "api/ws_sale_delete.php",
    apiInline:  "api/ws_sale_update_inline.php",
    tbodyId:    "ws_sales_table",
    subsListId: "ws_subsList",
    cacheKey:   "cachedWsSales:v2",
    refreshKey: "refreshWsSalesTable",
    isActive:   () => wholesaleBtn()?.classList.contains("btn-active") ?? false,
    // No rowClass  – wholesale rows have no store colouring
    // No cardTopRow – wholesale mobile card does not show renew
  });

  // Expose initial load for add_sales_toggle.js — called once on first tab click
  if (ctrl) window.initWholesaleSales = ctrl.loadSales;
})();
