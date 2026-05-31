# Plan: Item 27 — Extract sales_module_factory.js

Both `sales_overview.js` (1085 lines) and `ws_sales_overview.js` (1088 lines) are loaded on the
same page (`sales_overview.php`) and are ~93% identical. The goal is to extract shared logic into
a factory, reduce total JS to ~800 lines, and fix two latent bugs introduced by having two files
run on the same page.

---

## Context: Current page load order (sales_overview.php)

```
csrf.js → loading.js → modal.js → nav.js → add_sales_toggle.js
  → sales_overview.js → sales_add_form.js
  → ws_sales_overview.js → ws_sales_add_form.js
```

Both overview files run on the same page. This means:

- `todayDate()` is defined twice globally (second definition silently overwrites first — harmless
  but wasteful).
- The search reveal/hide `DOMContentLoaded` block fires twice, adding duplicate listeners to the
  same DOM elements.
- The refresh button (`#refreshBtn`) gets TWO click listeners: retail always calls
  `refreshSalesTable`; wholesale dispatches based on active tab. The retail listener fires on
  every click regardless of active tab — latent bug.

---

## External dependencies that must be preserved

These window globals are called by other files. Their names must not change.

| Global | Set by | Called by |
|---|---|---|
| `window.refreshSalesTable` | sales_overview.js | sales_add_form.js:284, upload.js:616 |
| `window.refreshWsSalesTable` | ws_sales_overview.js | ws_sales_add_form.js:281 |
| `window.loadWsSalesIfNeeded` | ws_sales_overview.js | add_sales_toggle.js:111 |

`todayDate()` (global function) is called by `sales_add_form.js:171,293` and
`ws_sales_add_form.js:168,290`. It must stay globally accessible.

---

## Complete diff of all differences between the two files

### 1. Config constants (IIFE top)

| | retail | wholesale |
|---|---|---|
| `API_LIST_URL` | `api/sales_table.php` | `api/ws_sales_table.php` |
| `API_DELETE_URL` | `api/sale_delete.php` | `api/ws_sale_delete.php` |
| `API_INLINE_URL` | `api/sale_update_inline.php` | `api/ws_sale_update_inline.php` |
| `tbody` DOM ID | `sales_table` | `ws_sales_table` |
| `subsList` DOM ID | `subsList` | `ws_subsList` |
| `CACHE_KEY` | `cachedSales:v2` | `cachedWsSales:v2` |

### 2. refreshBtn click handler (outside IIFE, ~line 54)

- **retail**: always calls `window.refreshSalesTable?.()`.
- **wholesale**: reads `#retail_page` to check active tab; dispatches to `refreshSalesTable` or
  `refreshWsSalesTable` accordingly.
- **Bug**: both listeners are active simultaneously. The retail listener calls `refreshSalesTable`
  even when the wholesale tab is open.

### 3. buildSaleTr — store color (retail only)

Retail computes `storeClass` from `s.store` value (0-5) and applies it to:
`tr`, `tdNum`, `tdProd`, every `makeEditable` td, `tdPurchased`, `tdExpired`, `tdPrice`,
`tdActions`.

Wholesale uses fixed class names (`"era-row"`, `"era-num"`, etc.) — no store coloring.

Store value map:
```
0 → store-void
1 → store-digimium
2 → store-dmarwal
3 → store-ember
4 → store-violet
5 → store-void
default → store-default
```

### 4. appendNextChunkCards — renew field (retail only)

Retail card HTML includes:
```html
<div class="subs-renew">
  <span class="subs-label">Renew: </span>
  <span>${esc(renew)}</span>
</div>
```
inside `.subs-row-top`, alongside the product name.

Wholesale card `.subs-row-top` contains only the product name — no renew row.

Retail also reads: `const renew = Number.isFinite(+r.renew) ? +r.renew : (r.renew ?? "-");`

### 5. applySearchRender — tab guard (wholesale only)

Retail renders directly:
```js
renderViewport(filterRowsByQuery(allRows, currentQuery));
const wrap = document.querySelector(".era-table-wrap");
if (wrap) wrap.scrollTo({ top: 0, behavior: "instant" });
```

Wholesale wraps the same logic in:
```js
const retailBtn = document.getElementById("retail_page");
const isRetailActive = retailBtn && retailBtn.classList.contains("btn-active");
if (!isRetailActive) { ... }
```

### 6. setupCustomerSearch — blur handler (wholesale only)

Retail has the blur handler **commented out**.

Wholesale has an **active** blur handler:
```js
input.addEventListener("blur", () => {
  setTimeout(() => {
    if (!input.value) {
      currentQuery = "";
      const retailBtn = document.getElementById("retail_page");
      const isRetailActive = retailBtn && retailBtn.classList.contains("btn-active");
      if (!isRetailActive) renderViewport(allRows);
    }
  }, 140);
});
```

### 7. Init and window exports

Retail:
```js
if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", loadSales);
} else {
  loadSales();
}
setupCustomerSearch();
initInlineEditing();
window.refreshSalesTable = refreshCacheAndReload;
```

Wholesale (deferred load):
```js
let wsLoaded = false;
function loadWsSalesIfNeeded() {
  if (wsLoaded) return;
  wsLoaded = true;
  loadSales();
}
setupCustomerSearch();
initInlineEditing();
window.loadWsSalesIfNeeded = loadWsSalesIfNeeded;
window.refreshWsSalesTable = refreshCacheAndReload;
```

Wholesale does NOT call `loadSales()` eagerly — it waits for `add_sales_toggle.js` to call
`window.loadWsSalesIfNeeded()` when the wholesale tab is first opened.

---

## Files to create/change

### New: `js/sales_module_factory.js`

Contains the factory function. Sets `window.createSalesModule`. Loaded before both overview files.

**Config shape:**
```js
// cfg passed to createSalesModule(cfg)
{
  apiList:    string,   // list endpoint URL
  apiDelete:  string,   // delete endpoint URL
  apiInline:  string,   // inline update endpoint URL
  tbodyId:    string,   // table tbody element ID
  subsListId: string,   // mobile cards list element ID
  cacheKey:   string,   // sessionStorage key
  isWholesale: bool,    // false=retail (store colors, renew in cards); true=wholesale
  deferred:   bool,     // false=load on DOMReady; true=export loadKey fn, wait for caller
  refreshKey: string,   // window property name for refreshCacheAndReload
  loadKey:    string|null, // window property name for deferred load fn (null if not deferred)
}
```

**Branching inside the factory:**

| Location | `isWholesale: false` | `isWholesale: true` |
|---|---|---|
| `buildSaleTr` | compute storeClass, apply to all tds | fixed class names, no storeClass |
| `appendNextChunkCards` | include renew row + `renew` var | no renew row |
| `applySearchRender` | render directly | guard with `!isRetailActive` |
| `setupCustomerSearch` | no blur listener | add blur listener with `!isRetailActive` guard |

| Location | `deferred: false` | `deferred: true` |
|---|---|---|
| Init | load on DOMContentLoaded (or immediately if ready) | export `loadWsSalesIfNeeded`, skip eager load |
| `window[cfg.loadKey]` | not set | set to `loadWsSalesIfNeeded` |

### Rewritten: `js/sales_overview.js` (~30 lines)

Responsibilities after refactor:
1. Define `todayDate()` globally (one time, since this file loads first).
2. Attach the one-time search reveal/hide `DOMContentLoaded` handler (moved here from both files).
3. Attach the one-time `refreshBtn` click handler using the dispatch-by-active-tab logic
   (the wholesale version is more complete — use it here as the single handler).
4. Call `createSalesModule(cfg)` with retail config.

```js
"use strict";

function todayDate() {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,"0")}-${String(d.getDate()).padStart(2,"0")}`;
}

document.addEventListener("DOMContentLoaded", () => {
  const btn = document.getElementById("searchBtn");
  const wrap = document.getElementById("searchCustomerWrapper");
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
  loadKey:     null,
});
```

### Rewritten: `js/ws_sales_overview.js` (~15 lines)

No globals, no DOMContentLoaded block, no refreshBtn — all moved to sales_overview.js.

```js
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
  loadKey:     "loadWsSalesIfNeeded",
});
```

### Changed: `sales_overview.php`

Add one `<script>` tag for `sales_module_factory.js` before `sales_overview.js`:

```php
<script src="./js/sales_module_factory.js?v=<?= $v('sales_module_factory.js') ?>"></script>
<script src="./js/sales_overview.js?v=<?= $v('sales_overview.js') ?>"></script>
```

---

## Functionality checklist — nothing must be lost

- [x] Retail table loads on page ready; wholesale loads lazily on first tab activation
- [x] Session cache with ETag background refresh (both variants)
- [x] Cursor pagination (fetchSalesFromNetwork pagination loop)
- [x] Client-side search with `pd:` / `ed:` prefix modes
- [x] 1-second debounce on search input
- [x] Infinite-scroll via IntersectionObserver (table + cards, 100-per-chunk)
- [x] Daily subtotals row after each group
- [x] Mobile card layout (responsive MQ_MOBILE breakpoint)
- [x] Inline editing: dblclick, Enter=save, Escape=cancel, blur=cancel
- [x] Optimistic UI on inline edit with rollback on failure
- [x] Delete via delegated click on tbody and subsList
- [x] LoadingSystem integration (global + button-level)
- [x] Retail: store-based row color classes (0-5 values)
- [x] Retail: renew field shown in mobile card
- [x] Wholesale: search and blur only apply when wholesale tab is active
- [x] Wholesale: deferred load via `window.loadWsSalesIfNeeded`
- [x] `window.refreshSalesTable` — called by sales_add_form.js + upload.js
- [x] `window.refreshWsSalesTable` — called by ws_sales_add_form.js
- [x] `window.loadWsSalesIfNeeded` — called by add_sales_toggle.js
- [x] `todayDate()` global — called by sales_add_form.js + ws_sales_add_form.js
- [x] Single refreshBtn listener with correct tab dispatch (bug fix)
- [x] Single search UI DOMContentLoaded listener (bug fix)

---

## Bugs fixed during refactor

1. **Double refreshBtn listener**: retail listener fires even on wholesale tab. Fix: single
   listener in sales_overview.js using wholesale's dispatch logic.
2. **Double search UI DOMContentLoaded**: duplicate listeners on same elements. Fix: move block
   to sales_overview.js only.

---

## Implementation order

1. Create `js/sales_module_factory.js` — the full factory function
2. Rewrite `js/sales_overview.js` — globals + one-time page setup + retail config call
3. Rewrite `js/ws_sales_overview.js` — wholesale config call only
4. Update `sales_overview.php` — add factory script tag

---

## Line count estimate

| File | Before | After |
|---|---|---|
| sales_overview.js | 1085 | ~55 |
| ws_sales_overview.js | 1088 | ~18 |
| sales_module_factory.js | (new) | ~720 |
| **Total** | **2173** | **~793** |
