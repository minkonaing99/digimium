/* csrf.js */
"use strict";

(() => {
  const getMeta = () =>
    document.querySelector('meta[name="csrf-token"]')?.content ?? "";

  window.csrfFetch = function (resource, init = {}) {
    const method = (init.method || "GET").toUpperCase();
    const safeMethods = ["GET", "HEAD", "OPTIONS"];
    if (safeMethods.includes(method)) {
      return fetch(resource, init);
    }
    const headers = new Headers(init.headers ?? {});
    if (!headers.has("X-CSRF-Token")) {
      headers.set("X-CSRF-Token", getMeta());
    }
    return fetch(resource, { ...init, headers });
  };
})();;
/* loading.js */
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
})();;
/* modal.js */
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
})();;
/* nav.js */
/**
 * Module: Shared navigation behavior.
 * Purpose: Handles active-link highlighting, mobile burger toggle, and logout.
 */
(function () {
  // Small DOM helpers for this file only.
  const $ = (s, c = document) => c.querySelector(s);
  const $$ = (s, c = document) => Array.from(c.querySelectorAll(s));

  /** Normalizes URL-like href input to a consistent pathname key. */
  function normalize(href) {
    try {
      const url = new URL(href, location.href);
      let p = url.pathname.toLowerCase().replace(/\/+$/, "");
      p = p.replace(/\/(index|default)\.(html|php)$/, ""); // treat index as folder
      return p || "/";
    } catch {
      return href;
    }
  }

  // -> "sales_overview.html" | "product_catalog.html" | "index"
  /** Extracts comparable page key from URL/path for nav highlighting. */
  function pageKey(href) {
    const p = normalize(href);
    if (p === "/") return "index";
    const segs = p.split("/").filter(Boolean);
    return segs.pop() || "index";
  }

  /** Marks the current page link as active in the navigation menu. */
  function setActiveNav() {
    // We match by normalized "page key" so links work consistently with
    // `/foo`, `/foo/`, and `/foo/index.php` style URLs.
    const hereKey = pageKey(location.pathname);

    $$("nav .nav-links a[href]").forEach((a) => {
      a.classList.remove("active");
      a.removeAttribute("aria-current");

      const href = a.getAttribute("href");
      if (!href || href.startsWith("#") || href.startsWith("javascript:"))
        return;

      const targetKey = pageKey(href);
      if (hereKey === targetKey) {
        a.classList.add("active");
        a.setAttribute("aria-current", "page");
      }
    });
  }

  /** Binds burger-menu open/close behavior for small screens. */
  function initNavigationToggle() {
    const burger = $("#burger");
    const navLinks = $("#navLinks");
    if (!burger || !navLinks) return;

    burger.addEventListener("click", () => {
      burger.classList.toggle("open");
      navLinks.classList.toggle("active");
    });

    $$("nav .nav-links a").forEach((link) => {
      link.addEventListener("click", () => {
        navLinks.classList.remove("active");
        burger.classList.remove("open");
      });
    });
  }

  document.addEventListener("DOMContentLoaded", () => {
    initNavigationToggle();
    setActiveNav();
  });
  // Keep highlighting in sync for browser navigation/history changes.
  document.addEventListener("DOMContentLoaded", setActiveNav);

  window.addEventListener("popstate", setActiveNav);
  window.addEventListener("hashchange", setActiveNav);
})();

// Global logout action shared across all authenticated pages.
document.getElementById("logoutBtn")?.addEventListener("click", async (e) => {
  e.preventDefault();

  if (!await showConfirm("Are you sure you want to log out?")) return;

  try {
    const resp = await csrfFetch("./api/logout.php", {
      method: "POST",
      credentials: "same-origin",
      headers: { "X-Requested-With": "XMLHttpRequest" }, // optional, but nice
    });

    if (resp.ok) {
      window.location.href = "./index.php";
    } else {
      console.error("Logout failed", await resp.text());
      await showAlert("Logout failed. Try again.");
    }
  } catch (err) {
    console.error("Logout failed", err);
    await showAlert("Network error during logout.");
  }
});;
/* add_sales_toggle.js */
"use strict";

/**
 * Module: Sales form/tabs visibility controller.
 * Purpose: Coordinates retail/wholesale page tabs and which add-sale form is visible.
 * Used on: `sales_overview.php`.
 */
document.addEventListener("DOMContentLoaded", () => {
  const addSaleBtn = document.getElementById("addSaleBtn");
  const formMount = document.getElementById("salesFormMount");
  const retailTpl = document.getElementById("tpl_add_sales_retail");
  const wholesaleTpl = document.getElementById("tpl_add_sales_wholesale");

  const retailBtn = document.getElementById("retail_page");
  const wholesaleBtn = document.getElementById("wholesale_page");

  let formsRendered = false;

  const getAddSalesSection = () => document.getElementById("add_sales");
  const getAddWsSalesSection = () => document.getElementById("add_ws_sales");
  const getRetailSections = () => document.querySelectorAll(".retail_page");
  const getWholesaleSections = () => document.querySelectorAll(".wholesale_page");

  /** Injects retail + wholesale forms on first demand and initializes handlers. */
  const ensureFormsRendered = () => {
    if (formsRendered) return;
    if (!formMount || !retailTpl || !wholesaleTpl) return;

    formMount.appendChild(retailTpl.content.cloneNode(true));
    formMount.appendChild(wholesaleTpl.content.cloneNode(true));
    formsRendered = true;

    if (typeof window.initRetailAddForm === "function") {
      window.initRetailAddForm();
    }
    if (typeof window.initWholesaleAddForm === "function") {
      window.initWholesaleAddForm();
    }
    hideForms();
  };

  /** Hides both retail and wholesale add-sale forms. */
  const hideForms = () => {
    const addSalesSection = getAddSalesSection();
    const addWsSalesSection = getAddWsSalesSection();
    if (addSalesSection) addSalesSection.style.display = "none";
    if (addWsSalesSection) addWsSalesSection.style.display = "none";
  };

  /** Toggles visibility for one form section. */
  const toggleSection = (section) => {
    if (!section) return;
    const currentDisplay = section.style.display;
    section.style.display =
      currentDisplay === "none" || currentDisplay === "" ? "block" : "none";
  };

  /** Switches retail/wholesale tab state and visible sections. */
  const showPage = (page) => {
    if (!retailBtn || !wholesaleBtn) return;

    if (page === "retail") {
      retailBtn.classList.add("btn-active");
      retailBtn.classList.remove("btn-inactive");
      wholesaleBtn.classList.add("btn-inactive");
      wholesaleBtn.classList.remove("btn-active");

      getRetailSections().forEach((el) => (el.style.display = "block"));
      getWholesaleSections().forEach((el) => (el.style.display = "none"));
    } else {
      wholesaleBtn.classList.add("btn-active");
      wholesaleBtn.classList.remove("btn-inactive");
      retailBtn.classList.add("btn-inactive");
      retailBtn.classList.remove("btn-active");

      getWholesaleSections().forEach((el) => (el.style.display = "block"));
      getRetailSections().forEach((el) => (el.style.display = "none"));
    }

    hideForms();
  };

  // Default state: hide forms and start on retail view.
  hideForms();

  if (addSaleBtn) {
    addSaleBtn.addEventListener("click", () => {
      ensureFormsRendered();

      const addSalesSection = getAddSalesSection();
      const addWsSalesSection = getAddWsSalesSection();
      const isRetailActive = retailBtn?.classList.contains("btn-active");

      if (isRetailActive) {
        toggleSection(addSalesSection);
        if (addWsSalesSection) addWsSalesSection.style.display = "none";
      } else {
        toggleSection(addWsSalesSection);
        if (addSalesSection) addSalesSection.style.display = "none";
      }
    });
  }

  if (retailBtn) {
    retailBtn.addEventListener("click", () => showPage("retail"));
  }

  if (wholesaleBtn) {
    wholesaleBtn.addEventListener("click", () => {
      showPage("wholesale");
      window.loadWsSalesIfNeeded?.();
    });
  }

  window.hideRetailForm = () => {
    const addSalesSection = getAddSalesSection();
    if (addSalesSection) addSalesSection.style.display = "none";
  };

  window.hideWholesaleForm = () => {
    const addWsSalesSection = getAddWsSalesSection();
    if (addWsSalesSection) addWsSalesSection.style.display = "none";
  };

  if (retailBtn && wholesaleBtn) {
    showPage("retail");
  }
});;
/* sales_module_factory.js */
"use strict";

/**
 * Factory for retail and wholesale sales table/cards modules.
 *
 * cfg = {
 *   apiList, apiDelete, apiInline,
 *   tbodyId, subsListId,
 *   cacheKey,
 *   isWholesale: bool,   false=store colors + renew in cards; true=wholesale variant
 *   deferred:    bool,   false=load on DOMReady; true=expose loadKey fn for lazy activation
 *   refreshKey:  string, window property name for refreshCacheAndReload
 *   loadKey:     string|null, window property name for deferred load fn
 * }
 */
window.createSalesModule = function createSalesModule(cfg) {
  const API_LIST_URL    = cfg.apiList;
  const API_DELETE_URL  = cfg.apiDelete;
  const API_INLINE_URL  = cfg.apiInline;
  const API_FETCH_LIMIT = 200;

  const tbody    = document.getElementById(cfg.tbodyId);
  const subsList = document.getElementById(cfg.subsListId);
  const tableWrap = document.querySelector(".era-table-wrap");
  if (!tbody && !subsList) return;

  const MQ_MOBILE = window.matchMedia("(max-width: 640px)");

  const COLSPAN  = 9;
  const CACHE_KEY = cfg.cacheKey;
  const PAGE_SIZE = 100;

  // --- data cache ---
  let allRows = [];

  // --- TABLE state ---
  let flatRowsTable      = [];
  let renderedCountTable = 0;
  let totalsByDate       = new Map();
  let countsByDate       = new Map();
  let renderedByDate     = new Map();
  let rowNumBase         = 0;
  let ioTable            = null;

  // --- CARDS state ---
  let flatRowsCards      = [];
  let renderedCountCards = 0;
  let ioCards            = null;

  // --- inline editor state ---
  let activeEditor = null;

  // --- search state ---
  let currentQuery = "";

  // ---------------- cache helpers ----------------
  function readCachePacket() {
    const raw = sessionStorage.getItem(CACHE_KEY);
    if (!raw) return { data: null, etag: null };
    try {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed)) return { data: parsed, etag: null };
      if (parsed && Array.isArray(parsed.data)) {
        return { data: parsed.data, etag: parsed.etag || null };
      }
    } catch {}
    return { data: null, etag: null };
  }

  function writeCachePacket(data, etag = null) {
    sessionStorage.setItem(CACHE_KEY, JSON.stringify({ data, etag, ts: Date.now() }));
  }

  // ---------------- helpers ----------------
  const svgTrash = () =>
    `<span class="era-icon"><img src="./assets/delete.svg" alt=""></span>`;

  function formatKyat(n) {
    const num = Number(n);
    if (!Number.isFinite(num)) return "";
    return new Intl.NumberFormat("en-US", { maximumFractionDigits: 0 }).format(
      Math.round(num),
    );
  }

  function formatDate(d) {
    if (!d) return "";
    const parts = String(d).split("-");
    if (parts.length !== 3) return "";
    const dt = new Date(Date.UTC(+parts[0], +parts[1] - 1, +parts[2]));
    return new Intl.DateTimeFormat("en-GB", {
      day: "2-digit",
      month: "short",
      year: "numeric",
    }).format(dt);
  }

  function formatDateShort(d) {
    if (!d) return "";
    const parts = String(d).split("-");
    if (parts.length !== 3) return "";
    const dt = new Date(Date.UTC(+parts[0], +parts[1] - 1, +parts[2]));
    return new Intl.DateTimeFormat("en-GB", {
      day: "2-digit",
      month: "short",
    }).format(dt);
  }

  function daysFromNow(ymd) {
    if (!ymd) return null;
    const parts = String(ymd).split("-");
    if (parts.length !== 3) return null;
    const target = Date.UTC(+parts[0], +parts[1] - 1, +parts[2]);
    const now = new Date();
    const today = Date.UTC(now.getFullYear(), now.getMonth(), now.getDate());
    return Math.round((target - today) / 86_400_000);
  }

  function relativeLabel(endYmd) {
    const d = daysFromNow(endYmd);
    if (d === null) return "";
    if (d === 0) return "expires today";
    if (d > 0 && d <= 60) return `in ${d}d`;
    if (d < 0 && d >= -60) return `${-d}d ago`;
    return "";
  }

  const esc = (s) =>
    String(s ?? "").replace(
      /[&<>"']/g,
      (m) =>
        ({
          "&": "&amp;",
          "<": "&lt;",
          ">": "&gt;",
          '"': "&quot;",
          "'": "&#39;",
        })[m],
    );

  function placeholderRow(text) {
    const tr = document.createElement("tr");
    const td = document.createElement("td");
    td.className = "era-muted";
    td.colSpan = COLSPAN;
    const isError = /^(Failed|Error)/i.test(text);
    const isEmpty = /no\s+sales\s+found/i.test(text);
    if (isError || isEmpty) {
      const wrap = document.createElement("div");
      wrap.className = "era-empty" + (isError ? " era-error" : "");
      const icon = document.createElement("div");
      icon.className = "era-empty-icon";
      icon.textContent = isError ? "!" : "—";
      const title = document.createElement("div");
      title.className = "era-empty-title";
      title.textContent = isError ? "Couldn't load sales" : "No sales yet";
      const sub = document.createElement("div");
      sub.textContent = isError ? text : "Add a sale or adjust filters to see records here.";
      wrap.appendChild(icon);
      wrap.appendChild(title);
      wrap.appendChild(sub);
      td.appendChild(wrap);
    } else {
      td.textContent = text;
    }
    tr.appendChild(td);
    return tr;
  }

  function skeletonRows(count = 6) {
    const frag = document.createDocumentFragment();
    const widths = ["w-40", "w-60", "w-80", "w-60", "w-40"];
    for (let i = 0; i < count; i++) {
      const tr = document.createElement("tr");
      tr.className = "era-skeleton-row";
      for (let c = 0; c < COLSPAN; c++) {
        const td = document.createElement("td");
        const span = document.createElement("span");
        span.className = "skel " + widths[c % widths.length];
        td.appendChild(span);
        tr.appendChild(td);
      }
      frag.appendChild(tr);
    }
    return frag;
  }

  function debounce(fn, ms = 1000) {
    let t;
    return (...args) => {
      clearTimeout(t);
      t = setTimeout(() => fn(...args), ms);
    };
  }

  function buildSearchKey(r) {
    const tokenizeDate = (ymd) => {
      if (!ymd) return [];
      const parts = String(ymd).split("-");
      if (parts.length !== 3) return [];
      const [y, m, d] = parts.map((n) => parseInt(n, 10));
      if (!y || !m || !d) return [];
      const dt = new Date(Date.UTC(y, m - 1, d));
      const monShort = dt.toLocaleString("en-US", { month: "short" }).toLowerCase();
      const monLong  = dt.toLocaleString("en-US", { month: "long" }).toLowerCase();
      const mm   = String(m).padStart(2, "0");
      const dd   = String(d).padStart(2, "0");
      const yyyy = String(y);
      return [
        `${dd} ${monShort} ${yyyy}`,
        `${dd} ${monLong} ${yyyy}`,
        `${monShort} ${yyyy}`,
        `${monLong} ${yyyy}`,
        `${mm} ${yyyy}`,
        `${yyyy}-${mm}`,
        `${yyyy}-${mm}-${dd}`,
        monShort,
        monLong,
        mm,
        yyyy,
      ];
    };

    const purchasedTokens = tokenizeDate(r.purchased_date);
    const expiredTokens   = tokenizeDate(r.expired_date);

    r._qPD  = purchasedTokens.join("|").toLowerCase();
    r._qED  = expiredTokens.join("|").toLowerCase();
    r._qAll = [
      r.customer ?? "",
      r.email ?? "",
      r.sale_product ?? "",
      r.manager ?? "",
      ...purchasedTokens,
      ...expiredTokens,
    ]
      .join("|")
      .toLowerCase();
    r._q = r._qAll;
  }

  function updateLocalRow(id, patch) {
    const idStr = String(id);
    const touchesSearch =
      "customer" in patch ||
      "email" in patch ||
      "manager" in patch ||
      "sale_product" in patch ||
      "renew" in patch ||
      "purchased_date" in patch ||
      "expired_date" in patch;

    allRows = allRows.map((r) => {
      if (String(r.sale_id) === idStr) {
        const nr = { ...r, ...patch };
        if (touchesSearch) buildSearchKey(nr);
        return nr;
      }
      return r;
    });

    const packet = readCachePacket();
    if (packet.data) {
      try {
        const data = packet.data;
        const idx = data.findIndex((r) => String(r.sale_id) === idStr);
        if (idx >= 0) {
          data[idx] = { ...data[idx], ...patch };
          if (touchesSearch) buildSearchKey(data[idx]);
          writeCachePacket(data, packet.etag);
        }
      } catch {}
    }
  }

  // ---------------- TABLE ROW BUILDERS (desktop) ----------------
  function storeClassFor(storeValue) {
    switch (storeValue) {
      case 0: return "store-void";
      case 1: return "store-digimium";
      case 2: return "store-dmarwal";
      case 3: return "store-ember";
      case 4: return "store-violet";
      case 5: return "store-void";
      default: return "store-default";
    }
  }

  function storeLabelFor(storeValue) {
    switch (storeValue) {
      case 0: return "Void";
      case 1: return "Digimium";
      case 2: return "D Mar Wal";
      case 3: return "Ember";
      case 4: return "Violet";
      case 5: return "Void";
      default: return "";
    }
  }

  function buildSaleTr(s, displayNum) {
    const tr = document.createElement("tr");

    const storeClass = cfg.isWholesale
      ? ""
      : storeClassFor(s.store ?? 0);

    tr.className = cfg.isWholesale ? "era-row" : `era-row ${storeClass}`;
    if (s.sale_id != null) tr.dataset.id = String(s.sale_id);
    if (s.manager) tr.dataset.manager = String(s.manager);
    if (s.note) tr.dataset.note = String(s.note);

    const tdNum = document.createElement("td");
    tdNum.className = cfg.isWholesale ? "era-num" : `era-num ${storeClass}`;
    tdNum.textContent = String(displayNum);

    const tdProd = document.createElement("td");
    tdProd.className = "era-cell-product" + (cfg.isWholesale ? "" : ` ${storeClass}`);
    tdProd.textContent = s.sale_product ?? "";

    const makeEditable = (field, text, extraClass = "") => {
      const td = document.createElement("td");
      const scPart = cfg.isWholesale ? "" : ` ${storeClass}`;
      td.className =
        `td-scrollable editable-cell editable-${field}${scPart} ${extraClass}`.trim();
      td.dataset.id    = String(s.sale_id || "");
      td.dataset.field = field;
      const span = document.createElement("span");
      span.className = "inline-text";
      span.textContent = text ?? "";
      td.appendChild(span);
      if (field === "note" || field === "customer") td.title = text ?? "";
      return td;
    };

    const tdCustomer = makeEditable("customer", s.customer, "era-cell-customer");

    const tdEmail = makeEditable("email", s.email, "era-email");

    const tdRange = document.createElement("td");
    tdRange.className = "era-cell-range" + (cfg.isWholesale ? "" : ` ${storeClass}`);
    tdRange.textContent =
      `${formatDateShort(s.purchased_date)} → ${formatDate(s.expired_date)}`;

    const tdManager = makeEditable("manager", s.manager, "era-cell-manager");
    const tdNote    = makeEditable("note", s.note, "era-cell-note");

    const tdPrice = document.createElement("td");
    tdPrice.className = cfg.isWholesale ? "era-price" : `era-price ${storeClass}`;
    tdPrice.textContent = formatKyat(s.price);

    const tdActions = document.createElement("td");
    tdActions.className = cfg.isWholesale ? "era-actions" : `era-actions ${storeClass}`;
    const delBtn = document.createElement("button");
    delBtn.className = "era-icon-btn";
    delBtn.type = "button";
    delBtn.dataset.action = "delete";
    delBtn.title = "Delete";
    delBtn.setAttribute("aria-label", `Delete row ${displayNum}`);
    delBtn.innerHTML = svgTrash();
    tdActions.appendChild(delBtn);

    tr.append(
      tdNum,
      tdProd,
      tdCustomer,
      tdEmail,
      tdRange,
      tdManager,
      tdNote,
      tdPrice,
      tdActions,
    );

    return tr;
  }

  const TOTAL_COLS      = 9;
  const PRICE_COL_INDEX = TOTAL_COLS - 2; // 7

  function buildSubtotalTr(dateKey) {
    const tr = document.createElement("tr");
    tr.className = "era-subtotal-row";

    const tdLabel = document.createElement("td");
    tdLabel.className = "era-subtotal-label";
    tdLabel.colSpan = TOTAL_COLS - 2;
    tdLabel.textContent = `${formatDate(dateKey)} · ${countsByDate.get(dateKey) || 0} sales`;
    tr.appendChild(tdLabel);

    const tdSum = document.createElement("td");
    tdSum.className = "era-subtotal-sum";
    tdSum.textContent = formatKyat(totalsByDate.get(dateKey) || 0);
    tr.appendChild(tdSum);

    const tdEmpty = document.createElement("td");
    tr.appendChild(tdEmpty);

    return tr;
  }

  function buildDailyStats(rows) {
    totalsByDate  = new Map();
    countsByDate  = new Map();
    renderedByDate = new Map();
    rows.forEach((r) => {
      const d = r.purchased_date || "";
      const p = Number(r.price) || 0;
      totalsByDate.set(d, (totalsByDate.get(d) || 0) + p);
      countsByDate.set(d, (countsByDate.get(d) || 0) + 1);
    });
  }

  // ---------------- INLINE EDITING (table only) ----------------
  function startInlineEdit(td) {
    if (!td || td.classList.contains("editing")) return;
    if (activeEditor && activeEditor.td !== td) cancelInline(activeEditor.td);

    const span = td.querySelector(".inline-text");
    if (!span) return;

    const field   = td.dataset.field;
    const initial = (span.textContent || "").trim();

    td.style.width  = td.offsetWidth + "px";
    td.style.height = td.offsetHeight + "px";
    td.classList.add("editing");
    span.style.display = "none";

    const input = document.createElement("input");
    input.type = field === "email" ? "email" : "text";
    input.className = "inline-input";
    input.value = initial === "-" ? "" : initial;
    input.style.cssText =
      "width:100%;height:100%;box-sizing:border-box;padding:0;margin:0;border:none;outline:none;background:transparent;font:inherit;color:inherit;";

    td.appendChild(input);
    activeEditor = { td, input, span, prev: initial };
    input.focus();
    input.select();
  }

  function unlockCellSize(td) {
    td.style.width  = "";
    td.style.height = "";
  }

  function cancelInline(td) {
    if (!td || !td.classList.contains("editing")) return;
    const input = td.querySelector(".inline-input");
    const span  = td.querySelector(".inline-text");

    if (input) td.removeChild(input);
    if (span) {
      span.textContent = activeEditor?.prev ?? span.textContent;
      span.style.display = "";
    }

    if (td.dataset.field === "note" || td.dataset.field === "customer") {
      td.title = activeEditor?.prev || "";
    }

    unlockCellSize(td);
    td.classList.remove("editing");
    if (activeEditor?.td === td) activeEditor = null;
  }

  async function saveInline(td) {
    const input = td.querySelector(".inline-input");
    const span  = td.querySelector(".inline-text");
    const id    = td.dataset.id;
    const field = td.dataset.field;
    if (!input || !span || !id || !field) return;

    const next = input.value.trim();
    const prev = activeEditor?.prev ?? span.textContent.trim();

    if (next === prev) {
      td.removeChild(input);
      span.style.display = "";
      unlockCellSize(td);
      td.classList.remove("editing");
      if (activeEditor?.td === td) activeEditor = null;
      return;
    }

    if (field === "email" && next && !/^\S+@\S+\.\S+$/.test(next)) {
      await showAlert("Please enter a valid email.");
      input.focus();
      return;
    }
    if (field === "customer" && !next) {
      await showAlert("Customer cannot be empty.");
      input.focus();
      return;
    }

    // optimistic UI
    span.textContent = next || "-";
    span.style.display = "";
    if (field === "note" || field === "customer") td.title = next || "";
    td.removeChild(input);
    unlockCellSize(td);
    td.classList.remove("editing");
    if (activeEditor?.td === td) activeEditor = null;

    updateLocalRow(id, { [field]: next || null });

    try {
      const payload = { id };
      payload[field] = next || null;

      if (window.LoadingSystem) window.LoadingSystem.setButtonLoading(td, true);

      const res  = await csrfFetch(API_INLINE_URL, {
        method: "POST",
        headers: { "Content-Type": "application/json", Accept: "application/json" },
        body: JSON.stringify(payload),
      });
      const json = await res.json().catch(() => ({}));
      if (!res.ok || !json.success) throw new Error(json.error || `HTTP ${res.status}`);

      if (currentQuery) {
        renderViewport(filterRowsByQuery(allRows, currentQuery));
      }
    } catch (err) {
      span.textContent = prev || "-";
      if (field === "note" || field === "customer") td.title = prev || "";
      updateLocalRow(id, { [field]: prev || null });
      await showAlert(`Failed to save : `);
    } finally {
      if (window.LoadingSystem) window.LoadingSystem.setButtonLoading(td, false);
    }
  }

  function initInlineEditing() {
    if (!tbody) return;

    tbody.addEventListener("dblclick", (e) => {
      const td = e.target.closest(".editable-cell");
      if (td) startInlineEdit(td);
    });

    tbody.addEventListener("keydown", (e) => {
      if (!e.target.matches(".inline-input")) return;
      if (e.key === "Enter") {
        e.preventDefault();
        const td = e.target.closest(".editable-cell");
        if (td) saveInline(td);
      } else if (e.key === "Escape") {
        const td = e.target.closest(".editable-cell");
        if (td) cancelInline(td);
      }
    });

    tbody.addEventListener(
      "blur",
      (e) => {
        if (e.target.matches(".inline-input")) {
          const td = e.target.closest(".editable-cell");
          setTimeout(() => td && cancelInline(td), 100);
        }
      },
      true,
    );
  }

  // ---------------- search ----------------
  function filterRowsByQuery(rows, q) {
    if (!q) return rows;
    let raw = q.trim().toLowerCase();
    if (!raw) return rows;

    let mode = "all";
    if (raw.startsWith("pd:")) {
      mode = "pd";
      raw  = raw.slice(3).trim();
    } else if (raw.startsWith("ed:")) {
      mode = "ed";
      raw  = raw.slice(3).trim();
    }

    if (!raw) return rows;

    const getter =
      mode === "pd"
        ? (r) => r._qPD || ""
        : mode === "ed"
          ? (r) => r._qED || ""
          : (r) => r._qAll || r._q || "";

    return rows.filter((r) => getter(r).includes(raw));
  }

  function isRetailTabActive() {
    const retailBtn = document.getElementById("retail_page");
    return retailBtn && retailBtn.classList.contains("btn-active");
  }

  function applySearchRender() {
    const input = document.getElementById("search_customer");
    currentQuery = (input?.value || "").trim();

    // wholesale only renders when wholesale tab is active
    if (cfg.isWholesale && isRetailTabActive()) return;

    renderViewport(filterRowsByQuery(allRows, currentQuery));
    const wrap = document.querySelector(".era-table-wrap");
    if (wrap) wrap.scrollTo({ top: 0, behavior: "instant" });
  }

  function setupCustomerSearch() {
    const input = document.getElementById("search_customer");
    if (!input) return;

    input.addEventListener("input", debounce(applySearchRender, 1000));

    input.addEventListener("keydown", (e) => {
      if (e.key === "Enter") {
        e.preventDefault();
        applySearchRender();
      }
    });

    if (cfg.isWholesale) {
      input.addEventListener("blur", () => {
        setTimeout(() => {
          if (!input.value && !isRetailTabActive()) {
            currentQuery = "";
            renderViewport(allRows);
          }
        }, 140);
      });
    }
  }

  // ---------------- TABLE RENDER (desktop) ----------------
  function appendNextChunkTable() {
    if (!tbody) return;
    if (renderedCountTable >= flatRowsTable.length) return;

    const frag  = document.createDocumentFragment();
    const start = renderedCountTable;
    const end   = Math.min(flatRowsTable.length, start + PAGE_SIZE);

    for (let i = start; i < end; i++) {
      const s = flatRowsTable[i];
      const d = s.purchased_date || "";

      frag.appendChild(buildSaleTr(s, ++rowNumBase));

      renderedByDate.set(d, (renderedByDate.get(d) || 0) + 1);
      if (renderedByDate.get(d) === (countsByDate.get(d) || 0)) {
        frag.appendChild(buildSubtotalTr(d));
      }
    }

    tbody.appendChild(frag);
    hideLoader();
    renderedCountTable = end;

    if (renderedCountTable >= flatRowsTable.length && ioTable) {
      ioTable.disconnect();
      ioTable = null;
    }
  }

  function renderRowsProgressive(rows) {
    if (!tbody) return;

    if (ioCards) { ioCards.disconnect(); ioCards = null; }

    tbody.innerHTML = "";
    if (!Array.isArray(rows) || rows.length === 0) {
      tbody.appendChild(placeholderRow("No sales found."));
      flatRowsTable = [];
      return;
    }

    flatRowsTable = rows.slice();
    buildDailyStats(flatRowsTable);
    renderedCountTable = 0;
    rowNumBase = 0;
    appendNextChunkTable();

    const sentinel = document.getElementById("scrollSentinel");
    if (!sentinel) return;

    if (ioTable) ioTable.disconnect();
    ioTable = new IntersectionObserver(
      (entries) => entries.forEach((e) => e.isIntersecting && appendNextChunkTable()),
      { root: null, rootMargin: "0px 0px 200px 0px", threshold: 0 },
    );
    ioTable.observe(sentinel);
  }

  // ---------------- CARD RENDER (mobile) ----------------
  function appendNextChunkCards() {
    if (!subsList) return;
    if (renderedCountCards >= flatRowsCards.length) return;

    const frag  = document.createDocumentFragment();
    const start = renderedCountCards;
    const end   = Math.min(flatRowsCards.length, start + PAGE_SIZE);

    for (let i = start; i < end; i++) {
      const r         = flatRowsCards[i];
      const product   = esc(r.sale_product ?? "-");
      const name      = esc(r.customer ?? "-");
      const email     = esc(r.email ?? "-");
      const manager   = esc(r.manager ?? "-");
      const purchased = formatDate(r.purchased_date);
      const expired   = formatDate(r.expired_date);
      const price     = formatKyat(r.price);

      const topRow = cfg.isWholesale
        ? `<div class="subs-row subs-row-top"><div class="subs-product">${product}</div></div>`
        : (() => {
            const renew = Number.isFinite(+r.renew) ? +r.renew : (r.renew ?? "-");
            return `<div class="subs-row subs-row-top">
          <div class="subs-product">${product}</div>
          <div class="subs-renew"><span class="subs-label">Renew: </span><span>${esc(renew)}</span></div>
        </div>`;
          })();

      const article = document.createElement("article");
      article.className = "subs-card";
      article.innerHTML = `
        ${topRow}

        <div class="subs-row subs-name">
          <span class="subs-label">Name:</span>
          <span class="subs-customer-value" title="${name}">${name}</span>
        </div>
        <div class="subs-row subs-name">
          <span class="subs-label">Email:</span>
          <span>${email}</span>
        </div>
        <div class="subs-row subs-name">
          <span class="subs-label">Manager:</span>
          <span>${manager}</span>
        </div>

        <div class="subs-row subs-dates">
          <div class="subs-purchased">
            <span class="subs-label">Purchased:</span>
            <span>${purchased}</span>
          </div>
          <div class="subs-expire">
            <span class="subs-label">Expire: </span>
            <span>${expired}</span>
          </div>
        </div>

        <div class="subs-row subs-price">${price}</div>
      `;
      frag.appendChild(article);
    }

    subsList.appendChild(frag);
    hideLoader();
    renderedCountCards = end;

    if (renderedCountCards >= flatRowsCards.length && ioCards) {
      ioCards.disconnect();
      ioCards = null;
    }
  }

  function renderCardsProgressive(rows) {
    if (!subsList) return;

    if (ioTable) { ioTable.disconnect(); ioTable = null; }

    subsList.innerHTML = "";
    if (!rows || rows.length === 0) {
      subsList.innerHTML = `<article class="subs-card"><div class="subs-row">No sales found.</div></article>`;
      flatRowsCards = [];
      return;
    }

    flatRowsCards = rows.slice();
    renderedCountCards = 0;
    appendNextChunkCards();

    const sentinel = document.getElementById("scrollSentinel");
    if (!sentinel) return;

    if (ioCards) ioCards.disconnect();
    ioCards = new IntersectionObserver(
      (entries) => entries.forEach((e) => e.isIntersecting && appendNextChunkCards()),
      { root: null, rootMargin: "0px 0px 200px 0px", threshold: 0 },
    );
    ioCards.observe(sentinel);
  }

  // ---------------- Viewport dispatcher ----------------
  function setContainersForViewport() {
    if (tableWrap) tableWrap.style.display = MQ_MOBILE.matches ? "none" : "block";
    if (subsList)  subsList.style.display  = MQ_MOBILE.matches ? "block" : "none";
  }

  function renderViewport(rows) {
    setContainersForViewport();
    if (MQ_MOBILE.matches) {
      renderCardsProgressive(rows);
    } else {
      renderRowsProgressive(rows);
    }
  }

  // ---------------- data ----------------
  async function fetchSalesFromNetwork(etag = null) {
    let cursor   = null;
    let firstEtag = etag || null;
    let isFirst  = true;
    const all    = [];

    while (true) {
      const params = new URLSearchParams();
      params.set("limit", String(API_FETCH_LIMIT));
      if (cursor) params.set("cursor", cursor);
      const headers = { Accept: "application/json" };
      if (isFirst && etag) headers["If-None-Match"] = etag;

      const r = await csrfFetch(`${API_LIST_URL}?${params.toString()}`, { headers });
      if (isFirst && r.status === 304) {
        return { notModified: true, data: null, etag };
      }

      const json = await r.json().catch(() => ({}));
      if (!r.ok || !json.success) throw new Error(json.error || `HTTP ${r.status}`);

      const pageRows = Array.isArray(json.data) ? json.data : [];
      all.push(...pageRows);
      if (isFirst) firstEtag = r.headers.get("ETag");

      const meta      = json.meta || {};
      const hasMore   = !!meta.has_more;
      const nextCursor = meta.next_cursor || null;
      if (!hasMore || !nextCursor) break;

      cursor  = nextCursor;
      isFirst = false;
    }

    return { notModified: false, data: all, etag: firstEtag };
  }

  async function loadSales() {
    if (window.LoadingSystem) {
      window.LoadingSystem.showGlobalLoading("Loading sales data...");
    }

    showLoader();

    if (!MQ_MOBILE.matches && tbody) {
      tbody.innerHTML = "";
      tbody.appendChild(skeletonRows(6));
    } else if (subsList) {
      subsList.innerHTML = `<article class="subs-card"><div class="subs-row">Loading…</div></article>`;
    }

    const cachePacket = readCachePacket();
    if (cachePacket.data) {
      try {
        const data = cachePacket.data;
        allRows = Array.isArray(data) ? data : [];
        allRows.forEach(buildSearchKey);
        renderViewport(filterRowsByQuery(allRows, currentQuery));

        fetchSalesFromNetwork(cachePacket.etag)
          .then((freshResult) => {
            if (freshResult.notModified) return;
            const fresh = freshResult.data || [];
            writeCachePacket(fresh, freshResult.etag || null);
            allRows = Array.isArray(fresh) ? fresh : [];
            allRows.forEach(buildSearchKey);
            renderViewport(filterRowsByQuery(allRows, currentQuery));
          })
          .catch(() => {});

        if (window.LoadingSystem) window.LoadingSystem.hideGlobalLoading();
        hideLoader();
        return;
      } catch {
        sessionStorage.removeItem(CACHE_KEY);
      }
    }

    try {
      const freshResult = await fetchSalesFromNetwork();
      const fresh = freshResult.data || [];
      writeCachePacket(fresh, freshResult.etag || null);
      allRows = Array.isArray(fresh) ? fresh : [];
      allRows.forEach(buildSearchKey);
      renderViewport(filterRowsByQuery(allRows, currentQuery));

      if (window.LoadingSystem) window.LoadingSystem.hideGlobalLoading();
      hideLoader();
    } catch (err) {
      console.error("Failed to load sales:", err);
      if (!MQ_MOBILE.matches && tbody) {
        tbody.innerHTML = "";
        tbody.appendChild(placeholderRow(`Failed to load: ${err.message}`));
      } else if (subsList) {
        subsList.innerHTML = `<article class="subs-card"><div class="subs-row">Failed to load: ${esc(err.message)}</div></article>`;
      }
      if (window.LoadingSystem) window.LoadingSystem.hideGlobalLoading();
      hideLoader();
    }
  }

  function refreshCacheAndReload() {
    sessionStorage.removeItem(CACHE_KEY);
    return loadSales();
  }

  function prependRow(newRow) {
    buildSearchKey(newRow);
    allRows = [newRow, ...allRows];
    writeCachePacket(allRows, null);
    renderViewport(filterRowsByQuery(allRows, currentQuery));
  }

  function removeRow(id) {
    const idStr = String(id);
    allRows = allRows.filter((r) => String(r.sale_id) !== idStr);
    writeCachePacket(allRows, null);
    renderViewport(filterRowsByQuery(allRows, currentQuery));
  }

  // ---------------- delete (delegated) ----------------
  tbody?.addEventListener("click", async (e) => {
    const btn = e.target.closest('button.era-icon-btn[data-action="delete"]');
    if (!btn) return;

    const tr = btn.closest("tr.era-row");
    if (!tr) return;

    const id = Number(tr.dataset.id);
    if (!id) return await showAlert("Missing sale_id for this row.");

    const name = tr.children[1]?.textContent?.trim() || `#${id}`;
    if (!await showConfirm(`Delete "${name}"?\nThis cannot be undone.`)) return;

    btn.disabled = true;
    btn.classList.add("disableBtn");

    try {
      const resp = await csrfFetch(API_DELETE_URL, {
        method: "POST",
        headers: { "Content-Type": "application/json", Accept: "application/json" },
        body: JSON.stringify({ id }),
      });
      const json = await resp.json().catch(() => ({}));
      if (!resp.ok || !json.success)
        throw new Error(json.error || `HTTP ${resp.status}`);
      removeRow(id);
    } catch (err) {
      console.error("Delete failed:", err);
      await showAlert(`Delete failed: ${err.message}`);
    } finally {
      btn.disabled = false;
      btn.classList.remove("disableBtn");
    }
  });

  subsList?.addEventListener("click", async (e) => {
    const btn = e.target.closest('button.era-icon-btn[data-action="delete"]');
    if (!btn) return;
    const article = btn.closest(".subs-card");
    const id = Number(article?.dataset?.id);
    if (!id) return;
    if (!await showConfirm(`Delete #${id}? This cannot be undone.`)) return;

    btn.disabled = true;
    btn.classList.add("disableBtn");

    try {
      const resp = await csrfFetch(API_DELETE_URL, {
        method: "POST",
        headers: { "Content-Type": "application/json", Accept: "application/json" },
        body: JSON.stringify({ id }),
      });
      const json = await resp.json().catch(() => ({}));
      if (!resp.ok || !json.success)
        throw new Error(json.error || `HTTP ${resp.status}`);
      removeRow(id);
    } catch (err) {
      await showAlert(`Delete failed: ${err.message}`);
    } finally {
      btn.disabled = false;
      btn.classList.remove("disableBtn");
    }
  });

  // ---------------- init ----------------
  MQ_MOBILE.addEventListener("change", () => {
    renderViewport(filterRowsByQuery(allRows, currentQuery));
  });

  setupCustomerSearch();
  initInlineEditing();
  window[cfg.refreshKey] = refreshCacheAndReload;
  if (cfg.prependKey) window[cfg.prependKey] = prependRow;

  if (cfg.deferred) {
    let loaded = false;
    function loadIfNeeded() {
      if (loaded) return;
      loaded = true;
      loadSales();
    }
    window[cfg.loadKey] = loadIfNeeded;
  } else {
    if (document.readyState === "loading") {
      document.addEventListener("DOMContentLoaded", loadSales);
    } else {
      loadSales();
    }
  }
};;
/* sales_overview.js */
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
});;
/* sales_add_form.js */
"use strict";

/**
 * Module: Retail add-sale form workflow.
 * Purpose: Validates inputs, derives hidden sales fields, submits to insert API,
 * then refreshes cached/rendered sales views.
 */
async function initRetailAddForm() {
  const $ = (id) => document.getElementById(id);

  const form = document.querySelector("#add_sales .inputSalesForm form");
  if (!form) return;
  if (form.dataset.submitBound === "1") return;
  form.dataset.submitBound = "1";

  const elProduct = $("product");
  const elCustomer = $("customer");
  const elEmail = $("email");
  const elPurchase = $("purchase_date");
  const elSeller = $("seller");
  const elAmount = $("amount");
  const elNotes = $("Notes");
  const elRenew = $("renew");
  const elDuration = $("duration");
  const elEndDate = $("end_date");
  const elStore = $("store");
  const saveBtn = form.querySelector('button[type="submit"]');
  const feedback = $("feedback_addSale");
  let isSubmitting = false;

  const setDanger = (el, on) => {
    if (!el) return;
    el.classList.toggle("text-danger", !!on);
    const label = el.id
      ? document.querySelector(`label[for="${el.id}"]`)
      : null;
    if (label) label.classList.toggle("text-danger", !!on);
  };
  const toInt = (v) => (v === "" || v == null ? NaN : parseInt(v, 10));
  const toMoney = (v) =>
    v === "" || v == null ? NaN : Math.round(Number(v) * 100) / 100;

  /** Computes expiry date by adding N months while preserving end-of-month logic. */
  function computeEndDate(ymd, months) {
    if (!ymd || !Number.isFinite(months)) return "";
    const [y, m, d] = ymd.split("-").map(Number);
    if (!y || !m || !d) return "";
    const start = new Date(Date.UTC(y, m - 1, d));
    const target = new Date(start);
    const origDay = target.getUTCDate();
    target.setUTCDate(1);
    target.setUTCMonth(target.getUTCMonth() + months);
    const lastDay = new Date(
      Date.UTC(target.getUTCFullYear(), target.getUTCMonth() + 1, 0),
    ).getUTCDate();
    target.setUTCDate(Math.min(origDay, lastDay));
    const yy = target.getUTCFullYear();
    const mm = String(target.getUTCMonth() + 1).padStart(2, "0");
    const dd = String(target.getUTCDate()).padStart(2, "0");
    return `${yy}-${mm}-${dd}`;
  }

  /** Enables/disables the submit button from current validation state. */
  function setBtn(valid) {
    if (!saveBtn) return;
    saveBtn.disabled = !valid;
    saveBtn.classList.toggle("disableBtn", !valid);
  }
  /** Displays add-sale feedback text with success/error coloring. */
  function showFeedback(msg, ok = true) {
    if (!feedback) return;
    feedback.textContent = msg;
    feedback.style.color = ok ? "white" : "red";
    feedback.style.display = "block";
  }

  // Product options
  const OPTIONS_URL = "./api/product_options.php"; // adjust if different
  /** Loads product select options and embeds pricing metadata in option datasets. */
  async function loadProductOptions() {
    try {
      const r = await csrfFetch(OPTIONS_URL, {
        headers: { Accept: "application/json" },
        method: "POST",
      });
      const data = await r.json().catch(() => ({}));
      if (!elProduct) return;
      elProduct.replaceChildren(new Option("Choose...", "", true, false));
      if (data.status === "success" && Array.isArray(data.products)) {
        for (const p of data.products) {
          const opt = new Option(p.product_name, p.product_id);
          opt.dataset.duration = p.duration; // months
          opt.dataset.price = p.retail_price; // retail
          opt.dataset.wcPrice = p.wc_price; // wholesale
          opt.dataset.renew = String(p.renew); // <-- keep 0/1/2/3/4/5/12
          elProduct.add(opt);
        }
      }
    } catch {
      // optional: toast/log
    }
  }

  // Validation
  /** Validates required retail form fields and toggles visual error state. */
  function validate() {
    const opt = elProduct?.selectedOptions?.[0];
    const hasProduct = !!(opt && opt.value && !opt.disabled);
    setDanger(elProduct, !hasProduct);

    const customer = (elCustomer?.value || "").trim();
    setDanger(elCustomer, !customer);

    const pdate = elPurchase?.value;
    setDanger(elPurchase, !pdate);

    const store = toInt(elStore?.value);
    const hasStore = [0, 1, 2, 3, 4, 5].includes(store);
    setDanger(elStore, !hasStore);

    const valid = !!(hasProduct && customer && pdate && hasStore);
    setBtn(valid);
    return valid;
  }

  /** Syncs renew/duration/end-date fields when product selection changes. */
  function onProductChange() {
    const opt = elProduct?.selectedOptions?.[0];
    if (!opt || !opt.value) {
      if (elRenew) elRenew.value = "";
      if (elDuration) elDuration.value = "";
      if (elEndDate) elEndDate.value = "";
      setBtn(false);
      return;
    }

    const duration = toInt(opt.dataset.duration);
    const renewInt = toInt(opt.dataset.renew);

    if (elRenew)
      elRenew.value = Number.isInteger(renewInt) ? String(renewInt) : "0";
    if (elDuration)
      elDuration.value = Number.isFinite(duration) ? String(duration) : "";

    if (elEndDate) {
      elEndDate.value =
        elPurchase?.value && Number.isFinite(duration)
          ? computeEndDate(elPurchase.value, duration)
          : "";
    }

    validate();
  }

  /** Recalculates end-date after purchase date changes. */
  function onPurchaseDateChange() {
    const opt = elProduct?.selectedOptions?.[0];
    const duration = toInt(elDuration?.value) || toInt(opt?.dataset.duration);
    if (elEndDate) {
      elEndDate.value =
        elPurchase?.value && Number.isFinite(duration)
          ? computeEndDate(elPurchase.value, duration)
          : "";
    }
    validate();
  }

  // Init
  // On page refresh, always use today's date as default
  if (elPurchase && !elPurchase.value) {
    elPurchase.value = todayDate();
  }
  await loadProductOptions();
  validate();

  elProduct?.addEventListener("change", onProductChange);
  elCustomer?.addEventListener("input", validate);
  elStore?.addEventListener("change", validate);
  elPurchase?.addEventListener("change", (e) => {
    // Save the user's chosen date to localStorage
    if (e.target.value) {
      localStorage.setItem("retail_preferred_purchase_date", e.target.value);
    }
    onPurchaseDateChange();
  });

  // Submit
  // Allowed renew integers for sales insert
  const ALLOWED_RENEW_SALE = new Set([0, 1, 2, 3, 4, 5, 6, 12]);

  form.addEventListener("submit", async (e) => {
    e.preventDefault();
    if (isSubmitting) return;
    if (!validate()) return;

    const opt = elProduct.selectedOptions[0];
    const saleName = opt.textContent.trim();
    const duration = toInt(elDuration?.value) || toInt(opt.dataset.duration);
    const retail = toMoney(opt.dataset.price);
    const wholesale = toMoney(opt.dataset.wcPrice);
    const typedAmt = toMoney(elAmount?.value);

    let price, profit;
    if (Number.isFinite(typedAmt)) {
      price = typedAmt;
      profit = Number.isFinite(wholesale)
        ? Math.round((price - wholesale) * 100) / 100
        : null;
    } else {
      price = Number.isFinite(retail) ? retail : null;
      profit =
        Number.isFinite(wholesale) && Number.isFinite(retail)
          ? Math.round((retail - wholesale) * 100) / 100
          : null;
    }

    if (price == null || profit == null) {
      showFeedback(
        "Missing product pricing data to compute price/profit.",
        false,
      );
      return;
    }

    // before payload:
    const chosenRenew = toInt(elRenew?.value);
    const productRenew = toInt(elProduct?.selectedOptions?.[0]?.dataset?.renew);
    const finalRenew = ALLOWED_RENEW_SALE.has(chosenRenew)
      ? chosenRenew
      : ALLOWED_RENEW_SALE.has(productRenew)
        ? productRenew
        : 0;

    // payload:
    const payload = {
      sale_product: saleName,
      duration: Number.isFinite(duration) ? duration : null,
      renew: finalRenew, // strict integer, never boolean
      customer: (elCustomer?.value || "").trim(),
      email: (elEmail?.value || "").trim() || null,
      purchased_date: elPurchase?.value,
      expired_date: elEndDate?.value || null,
      manager: (elSeller?.value || "").trim() || null,
      note: (elNotes?.value || "").trim() || null,
      price,
      profit,
      store: toInt(elStore.value),
    };

    try {
      isSubmitting = true;
      showFeedback("Saving...", true);
      if (saveBtn) {
        saveBtn.disabled = true;
        saveBtn.classList.add("disableBtn");
      }

      const resp = await csrfFetch("api/sale_insertion.php", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Accept: "application/json",
        },
        body: JSON.stringify(payload),
      });
      const json = await resp.json().catch(() => ({}));

      if (resp.status === 422) {
        const msg = json.errors
          ? Object.values(json.errors).join(" | ")
          : "Validation failed.";
        throw new Error(msg);
      }
      if (!resp.ok || !json.success)
        throw new Error(json.error || `HTTP ${resp.status}`);

      showFeedback("Successfully Saved", true);
      setTimeout(() => {
        if (feedback) feedback.style.display = "none";
        if (window.hideRetailForm) window.hideRetailForm();
      }, 800);

      if (typeof window.prependSaleRow === "function") {
        window.prependSaleRow({
          sale_id:        json.id,
          sale_product:   saleName,
          duration:       Number.isFinite(duration) ? duration : null,
          renew:          finalRenew,
          customer:       (elCustomer?.value || "").trim(),
          email:          (elEmail?.value || "").trim() || null,
          purchased_date: elPurchase?.value || null,
          expired_date:   elEndDate?.value || null,
          manager:        (elSeller?.value || "").trim() || null,
          note:           (elNotes?.value || "").trim() || null,
          price,
          profit,
          store:          toInt(elStore.value),
        });
      }

      // Reset fields
      form.reset();
      if (elProduct) elProduct.selectedIndex = 0;
      // Use saved preferred date or today's date as fallback
      const savedDate = localStorage.getItem("retail_preferred_purchase_date");
      if (elPurchase) elPurchase.value = savedDate || todayDate();
      if (elEndDate) elEndDate.value = "";
      validate();
    } catch (err) {
      console.error("Sale save failed:", err);
      showFeedback(`Save failed: ${err.message}`, false);
    } finally {
      isSubmitting = false;
      if (saveBtn) {
        saveBtn.disabled = false;
        saveBtn.classList.remove("disableBtn");
      }
    }
  });
}

window.initRetailAddForm = initRetailAddForm;
initRetailAddForm();;
/* ws_sales_overview.js */
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
});;
/* ws_sales_add_form.js */
"use strict";

/**
 * Module: Wholesale add-sale form workflow.
 * Purpose: Validates wholesale inputs (including quantity), submits to insert API,
 * then refreshes cached/rendered wholesale sales views.
 */
async function initWholesaleAddForm() {
  const $ = (id) => document.getElementById(id);

  // Get the wholesale form
  const form = document.querySelector("#add_ws_sales .inputSalesForm form");
  if (!form) return;
  if (form.dataset.submitBound === "1") return;
  form.dataset.submitBound = "1";

  const elProduct = $("ws_product");
  const elCustomer = $("ws_customer");
  const elEmail = $("ws_email");
  const elPurchase = $("ws_purchase_date");
  const elSeller = $("ws_seller");
  const elAmount = $("ws_amount");
  const elNotes = $("ws_Notes");
  const elRenew = $("ws_renew");
  const elDuration = $("ws_duration");
  const elEndDate = $("ws_end_date");
  const elQuantity = $("ws_quantity");
  const saveBtn = form.querySelector('button[type="submit"]');
  const feedback = $("feedback_addWsSale");
  let isSubmitting = false;

  const setDanger = (el, on) => {
    if (!el) return;
    el.classList.toggle("text-danger", !!on);
    const label = el.id
      ? document.querySelector(`label[for="${el.id}"]`)
      : null;
    if (label) label.classList.toggle("text-danger", !!on);
  };
  const toInt = (v) => (v === "" || v == null ? NaN : parseInt(v, 10));
  const toMoney = (v) =>
    v === "" || v == null ? NaN : Math.round(Number(v) * 100) / 100;

  /** Computes expiry date by adding N months while preserving end-of-month logic. */
  function computeEndDate(ymd, months) {
    if (!ymd || !Number.isFinite(months)) return "";
    const [y, m, d] = ymd.split("-").map(Number);
    if (!y || !m || !d) return "";
    const start = new Date(Date.UTC(y, m - 1, d));
    const target = new Date(start);
    const origDay = target.getUTCDate();
    target.setUTCDate(1);
    target.setUTCMonth(target.getUTCMonth() + months);
    const lastDay = new Date(
      Date.UTC(target.getUTCFullYear(), target.getUTCMonth() + 1, 0)
    ).getUTCDate();
    target.setUTCDate(Math.min(origDay, lastDay));
    const yy = target.getUTCFullYear();
    const mm = String(target.getUTCMonth() + 1).padStart(2, "0");
    const dd = String(target.getUTCDate()).padStart(2, "0");
    return `${yy}-${mm}-${dd}`;
  }

  /** Enables/disables the submit button from current validation state. */
  function setBtn(valid) {
    if (!saveBtn) return;
    saveBtn.disabled = !valid;
    saveBtn.classList.toggle("disableBtn", !valid);
  }
  /** Displays add-sale feedback text with success/error coloring. */
  function showFeedback(msg, ok = true) {
    if (!feedback) return;
    feedback.textContent = msg;
    feedback.style.color = ok ? "white" : "red";
    feedback.style.display = "block";
  }

  // Product options
  const OPTIONS_URL = "./api/ws_product_options.php"; // adjust if different
  /** Loads wholesale product options and embeds pricing metadata in option datasets. */
  async function loadProductOptions() {
    try {
      const r = await csrfFetch(OPTIONS_URL, {
        headers: { Accept: "application/json" },
        method: "POST",
      });
      const data = await r.json().catch(() => ({}));
      if (!elProduct) return;
      elProduct.replaceChildren(new Option("Choose...", "", true, false));
      if (data.status === "success" && Array.isArray(data.products)) {
        for (const p of data.products) {
          const opt = new Option(p.product_name, p.product_id);
          opt.dataset.duration = p.duration; // months
          opt.dataset.price = p.retail_price; // retail
          opt.dataset.wcPrice = p.wc_price; // wholesale
          opt.dataset.renew = String(p.renew); // <-- keep 0/1/2/3/4/5/12
          elProduct.add(opt);
        }
      }
    } catch {
      // optional: toast/log
    }
  }

  // Validation
  /** Validates required wholesale form fields and toggles visual error state. */
  function validate() {
    const opt = elProduct?.selectedOptions?.[0];
    const hasProduct = !!(opt && opt.value && !opt.disabled);
    setDanger(elProduct, !hasProduct);

    const customer = (elCustomer?.value || "").trim();
    setDanger(elCustomer, !customer);

    const pdate = elPurchase?.value;
    setDanger(elPurchase, !pdate);

    const valid = !!(hasProduct && customer && pdate);
    setBtn(valid);
    return valid;
  }

  /** Syncs renew/duration/end-date fields when product selection changes. */
  function onProductChange() {
    const opt = elProduct?.selectedOptions?.[0];
    if (!opt || !opt.value) {
      if (elRenew) elRenew.value = "";
      if (elDuration) elDuration.value = "";
      if (elEndDate) elEndDate.value = "";
      setBtn(false);
      return;
    }

    const duration = toInt(opt.dataset.duration);
    const renewInt = toInt(opt.dataset.renew);

    if (elRenew)
      elRenew.value = Number.isInteger(renewInt) ? String(renewInt) : "0";
    if (elDuration)
      elDuration.value = Number.isFinite(duration) ? String(duration) : "";

    if (elEndDate) {
      elEndDate.value =
        elPurchase?.value && Number.isFinite(duration)
          ? computeEndDate(elPurchase.value, duration)
          : "";
    }

    validate();
  }

  /** Recalculates end-date after purchase date changes. */
  function onPurchaseDateChange() {
    const opt = elProduct?.selectedOptions?.[0];
    const duration = toInt(elDuration?.value) || toInt(opt?.dataset.duration);
    if (elEndDate) {
      elEndDate.value =
        elPurchase?.value && Number.isFinite(duration)
          ? computeEndDate(elPurchase.value, duration)
          : "";
    }
    validate();
  }

  // Init
  // On page refresh, always use today's date as default
  if (elPurchase && !elPurchase.value) {
    elPurchase.value = todayDate();
  }
  await loadProductOptions();
  validate();

  elProduct?.addEventListener("change", onProductChange);
  elCustomer?.addEventListener("input", validate);
  elPurchase?.addEventListener("change", (e) => {
    // Save the user's chosen date to localStorage
    if (e.target.value) {
      localStorage.setItem("ws_preferred_purchase_date", e.target.value);
    }
    onPurchaseDateChange();
  });

  // Submit
  // Allowed renew integers for sales insert
  const ALLOWED_RENEW_SALE = new Set([0, 1, 2, 3, 4, 5, 6, 12]);

  form.addEventListener("submit", async (e) => {
    e.preventDefault();
    if (isSubmitting) return;
    if (!validate()) return;

    const opt = elProduct.selectedOptions[0];
    const saleName = opt.textContent.trim();
    const duration = toInt(elDuration?.value) || toInt(opt.dataset.duration);
    const quantity = toInt(elQuantity?.value) || 1;
    const retail = toMoney(opt.dataset.price);
    const wholesale = toMoney(opt.dataset.wcPrice);
    const typedAmt = toMoney(elAmount?.value);

    let price, profit;
    if (Number.isFinite(typedAmt)) {
      price = typedAmt * quantity;
      profit = Number.isFinite(wholesale)
        ? Math.round((typedAmt - wholesale) * quantity * 100) / 100
        : null;
    } else {
      price = Number.isFinite(retail) ? retail * quantity : null;
      profit =
        Number.isFinite(wholesale) && Number.isFinite(retail)
          ? Math.round((retail - wholesale) * quantity * 100) / 100
          : null;
    }

    if (price == null || profit == null) {
      showFeedback(
        "Missing product pricing data to compute price/profit.",
        false
      );
      return;
    }

    // before payload:
    const chosenRenew = toInt(elRenew?.value);
    const productRenew = toInt(elProduct?.selectedOptions?.[0]?.dataset?.renew);
    const finalRenew = ALLOWED_RENEW_SALE.has(chosenRenew)
      ? chosenRenew
      : ALLOWED_RENEW_SALE.has(productRenew)
      ? productRenew
      : 0;

    // payload:
    const payload = {
      sale_product: saleName,
      duration: Number.isFinite(duration) ? duration : null,
      quantity: quantity,
      renew: finalRenew, // strict integer, never boolean
      customer: (elCustomer?.value || "").trim(),
      email: (elEmail?.value || "").trim() || null,
      purchased_date: elPurchase?.value,
      expired_date: elEndDate?.value || null,
      manager: (elSeller?.value || "").trim() || null,
      note: (elNotes?.value || "").trim() || null,
      price,
      profit,
    };

    try {
      isSubmitting = true;
      showFeedback("Saving...", true);
      if (saveBtn) {
        saveBtn.disabled = true;
        saveBtn.classList.add("disableBtn");
      }

      const resp = await csrfFetch("api/ws_sale_insertion.php", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Accept: "application/json",
        },
        body: JSON.stringify(payload),
      });
      const json = await resp.json().catch(() => ({}));

      if (resp.status === 422) {
        const msg = json.errors
          ? Object.values(json.errors).join(" | ")
          : "Validation failed.";
        throw new Error(msg);
      }
      if (!resp.ok || !json.success)
        throw new Error(json.error || `HTTP ${resp.status}`);

      showFeedback("Successfully Saved", true);
      setTimeout(() => {
        if (feedback) feedback.style.display = "none";
        if (window.hideWholesaleForm) window.hideWholesaleForm();
      }, 800);

      if (typeof window.prependWsSaleRow === "function") {
        window.prependWsSaleRow({
          sale_id:        json.id,
          sale_product:   saleName,
          duration:       Number.isFinite(duration) ? duration : null,
          quantity:       quantity,
          renew:          finalRenew,
          customer:       (elCustomer?.value || "").trim(),
          email:          (elEmail?.value || "").trim() || null,
          purchased_date: elPurchase?.value || null,
          expired_date:   elEndDate?.value || null,
          manager:        (elSeller?.value || "").trim() || null,
          note:           (elNotes?.value || "").trim() || null,
          price,
          profit,
        });
      }

      // Reset fields
      form.reset();
      if (elProduct) elProduct.selectedIndex = 0;
      // Use saved preferred date or today's date as fallback
      const savedDate = localStorage.getItem("ws_preferred_purchase_date");
      if (elPurchase) elPurchase.value = savedDate || todayDate();
      if (elEndDate) elEndDate.value = "";
      if (elQuantity) elQuantity.value = "1";
      validate();
    } catch (err) {
      console.error("Sale save failed:", err);
      showFeedback(`Save failed: ${err.message}`, false);
    } finally {
      isSubmitting = false;
      if (saveBtn) {
        saveBtn.disabled = false;
        saveBtn.classList.remove("disableBtn");
      }
    }
  });
}

window.initWholesaleAddForm = initWholesaleAddForm;
initWholesaleAddForm();
