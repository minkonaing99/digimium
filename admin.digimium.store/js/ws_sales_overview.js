"use strict";

createSalesModule({
  apiList:     "api/ws_sales_table.php",
  apiDelete:   "api/ws_sale_delete.php",
  apiInline:   "api/ws_sale_update_inline.php",
  tbodyId:     "ws_sales_table",
  subsListId:  "ws_subsList",
  cacheKey:    "cachedWsSales:v2",
  isWholesale: true,
  deferred:    true,
  refreshKey:  "refreshWsSalesTable",
  prependKey:  "prependWsSaleRow",
  loadKey:     "loadWsSalesIfNeeded",
});
