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
/* product_catalog_toggle.js */
"use strict";

/**
 * Module: Product catalog tab and form visibility toggles.
 * Purpose: Switches between retail/wholesale views and opens/closes the add form.
 */

document.addEventListener("DOMContentLoaded", () => {
  // Get the button and form sections
  const addProductBtn = document.getElementById("addProductBtn");
  const addProductForm = document.getElementById("addProductForm");

  // Get the tab buttons to check which is active
  const retailBtn = document.getElementById("retail_page");
  const wholesaleBtn = document.getElementById("wholesale_page");

  // Initialize form visibility - ensure it starts hidden
  if (addProductForm) addProductForm.style.display = "none";

  if (addProductBtn) {
    addProductBtn.addEventListener("click", () => {
      // Toggle add product form
      if (addProductForm) {
        const currentDisplay = addProductForm.style.display;
        if (currentDisplay === "none" || currentDisplay === "") {
          addProductForm.style.display = "block";
          // Hide other forms
          const editForm = document.getElementById("editProductForm");
          const userSetting = document.getElementById("user_setting");
          if (editForm) editForm.style.display = "none";
          if (userSetting) userSetting.style.display = "none";
        } else {
          addProductForm.style.display = "none";
        }
      }
    });
  }

  // Also handle form hiding when switching tabs
  // This ensures forms are hidden when switching between retail/wholesale
  if (retailBtn) {
    retailBtn.addEventListener("click", () => {
      // Hide any open forms when switching to retail
      if (addProductForm) addProductForm.style.display = "none";
      const editForm = document.getElementById("editProductForm");
      const userSetting = document.getElementById("user_setting");
      if (editForm) editForm.style.display = "none";
      if (userSetting) userSetting.style.display = "none";
    });
  }

  if (wholesaleBtn) {
    wholesaleBtn.addEventListener("click", () => {
      // Hide any open forms when switching to wholesale
      if (addProductForm) addProductForm.style.display = "none";
      const editForm = document.getElementById("editProductForm");
      const userSetting = document.getElementById("user_setting");
      if (editForm) editForm.style.display = "none";
      if (userSetting) userSetting.style.display = "none";
    });
  }

  // Functions to hide forms after successful submission
  // These can be called from other JavaScript files
  window.hideAddProductForm = () => {
    if (addProductForm) addProductForm.style.display = "none";
  };

  window.hideEditProductForm = () => {
    const editForm = document.getElementById("editProductForm");
    if (editForm) editForm.style.display = "none";
  };

  // User Setting Button Handler
  const userSettingBtn = document.getElementById("userSettingBtn");
  const userSettingForm = document.getElementById("user_setting");

  if (userSettingBtn && userSettingForm) {
    userSettingBtn.addEventListener("click", () => {
      const currentDisplay = userSettingForm.style.display;
      if (currentDisplay === "none" || currentDisplay === "") {
        userSettingForm.style.display = "block";
        // Hide other forms
        const addForm = document.getElementById("addProductForm");
        const editForm = document.getElementById("editProductForm");
        if (addForm) addForm.style.display = "none";
        if (editForm) editForm.style.display = "none";
      } else {
        userSettingForm.style.display = "none";
      }
    });
  }
});

// Tab switching functionality
const retailBtn = document.getElementById("retail_page");
const wholesaleBtn = document.getElementById("wholesale_page");

// all content sections with these classes
const retailSections = document.querySelectorAll(".retail_page");
const wholesaleSections = document.querySelectorAll(".wholesale_page");

/** Switches retail/wholesale tab styles and section visibility. */
function showPage(page) {
  if (page === "retail") {
    retailBtn.classList.add("btn-active");
    retailBtn.classList.remove("btn-inactive");
    wholesaleBtn.classList.add("btn-inactive");
    wholesaleBtn.classList.remove("btn-active");

    // show retail, hide wholesale
    retailSections.forEach((el) => (el.style.display = "block"));
    wholesaleSections.forEach((el) => (el.style.display = "none"));

    // Hide any open forms when switching pages
    const addProductForm = document.getElementById("addProductForm");
    const editForm = document.getElementById("editProductForm");
    const userSetting = document.getElementById("user_setting");
    if (addProductForm) addProductForm.style.display = "none";
    if (editForm) editForm.style.display = "none";
    if (userSetting) userSetting.style.display = "none";
  } else {
    wholesaleBtn.classList.add("btn-active");
    wholesaleBtn.classList.remove("btn-inactive");
    retailBtn.classList.add("btn-inactive");
    retailBtn.classList.remove("btn-active");

    // show wholesale, hide retail
    wholesaleSections.forEach((el) => (el.style.display = "block"));
    retailSections.forEach((el) => (el.style.display = "none"));

    // Hide any open forms when switching pages
    const addProductForm = document.getElementById("addProductForm");
    const editForm = document.getElementById("editProductForm");
    const userSetting = document.getElementById("user_setting");
    if (addProductForm) addProductForm.style.display = "none";
    if (editForm) editForm.style.display = "none";
    if (userSetting) userSetting.style.display = "none";
  }
}

// attach events
if (retailBtn && wholesaleBtn) {
  retailBtn.addEventListener("click", () => showPage("retail"));
  wholesaleBtn.addEventListener("click", () => showPage("wholesale"));
}

// default load: show retail
showPage("retail");;
/* product_catalog.js */
/**
 * Module: Retail + wholesale product catalog CRUD controller.
 * Purpose: Fetches product rows, validates add/edit forms, performs CRUD calls,
 * and keeps table/mobile render state in sync.
 */
(() => {
  "use strict";

  // ====== Config ======
  const retail_API = {
    list: "api/products_table.php",
    insert: "api/product_insertion.php",
    update: "api/product_update.php",
    delete: "api/product_delete.php",
  };
  const wholesale_API = {
    list: "api/ws_products_table.php",
    insert: "api/ws_product_insertion.php",
    update: "api/ws_product_update.php",
    delete: "api/ws_product_delete.php",
  };
  const COLSPAN = 10;
  const ALLOWED_RENEW = new Set([0, 1, 2, 3, 4, 5, 6, 12]); // numbers only

  // ====== DOM refs ======
  const $ = (id) => document.getElementById(id);

  // Table references
  const retailTbody = $("product_table");
  const wholesaleTbody = $("ws_product_table");

  // Get current active table based on which page is visible
  /** Resolves the currently visible catalog table and API endpoints by active tab. */
  function getCurrentTable() {
    const retailSection = document.querySelector(".retail_page");
    const wholesaleSection = document.querySelector(".wholesale_page");

    if (retailSection && retailSection.style.display !== "none") {
      return { tbody: retailTbody, api: retail_API, type: "retail" };
    } else if (wholesaleSection && wholesaleSection.style.display !== "none") {
      return { tbody: wholesaleTbody, api: wholesale_API, type: "wholesale" };
    }
    // Default to retail
    return { tbody: retailTbody, api: retail_API, type: "retail" };
  }

  // Add form
  const addForm = document.querySelector("#inputRow form");
  const addEls = addForm
    ? {
        form: addForm,
        product: $("product"),
        duration: $("duration"),
        supplier: $("supplier"),
        renewable: $("renewable"), // MUST have values: 0,1,2,3,4,5,6,12
        store: $("store"),
        note: $("note"),
        link: $("link"),
        wholesale: $("wholesale_amount"),
        retail: $("retail_amount"),
        saveBtn: addForm.querySelector('button[type="submit"]'),
        feedback: $("feedback_addProduct"),
      }
    : null;

  // Edit form
  const editForm = $("editForm");
  const editEls = editForm
    ? {
        form: editForm,
        id: $("edit_product_id"),
        product: $("edit_product"),
        duration: $("edit_duration"),
        supplier: $("edit_supplier"),
        renewable: $("edit_renewable"), // MUST have values: 0,1,2,3,4,5,6,12
        note: $("edit_note"),
        link: $("edit_link"),
        wholesale: $("edit_wholesale_amount"),
        retail: $("edit_retail_amount"),
        saveBtn: editForm.querySelector('button[type="submit"]'),
        feedback: $("feedback_editProduct"),
      }
    : null;

  // ====== Utils ======
  /** Toggles danger styling on an input and its label. */
  function setDanger(el, on) {
    if (!el) return;
    el.classList.toggle("text-danger", !!on);
    const label = el.id
      ? document.querySelector(`label[for="${el.id}"]`)
      : null;
    if (label) label.classList.toggle("text-danger", !!on);
  }
  const toInt = (v) =>
    v === "" || v == null ? NaN : Number.isInteger(+v) ? +v : NaN;
  const toMoney = (v) =>
    v === "" || v == null
      ? NaN
      : Number.isFinite(+v)
        ? Math.round(+v * 100) / 100
        : NaN;

  // renew helpers (numbers only)
  /** Parses renew months from a control and enforces allowed integer values. */
  function parseRenewInt(el) {
    const n = Number((el?.value ?? "").toString().trim());
    if (!Number.isInteger(n)) return null;
    return ALLOWED_RENEW.has(n) ? n : null;
  }
  /** Coerces renew value to a safe allowed integer fallback. */
  function coerceRenewInt(v) {
    const n = Number((v ?? "").toString().trim());
    return Number.isInteger(n) && ALLOWED_RENEW.has(n) ? n : 0;
  }
  /** Sets the renew control value using allowed options only. */
  function setRenewableControlValue(el, intVal) {
    if (!el) return;
    const v = ALLOWED_RENEW.has(intVal) ? intVal : 0;
    el.value = String(v);
  }
  // Put this with your utils
  /** Removes trailing duration suffixes from display product names. */
  function stripDurationSuffix(name) {
    // remove one or more trailing " - 3M" or "(3m)" suffixes, case-insensitive
    return (name || "")
      .replace(/\s*(?:-\s*\d+\s*M|\(\s*\d+\s*m\s*\))+$/i, "")
      .trim();
  }

  /** Builds canonical product name format: `<name> - <duration>M`. */
  function formatProductName(rawName, duration) {
    const base = (rawName || "").replace(/\s*\(\s*\d+\s*m\s*\)$/i, "").trim();
    return `${base} - ${duration}M`;
  }
  /** Normalizes URL input and adds protocol if missing. */
  function normalizeLink(s) {
    const v = (s || "").trim();
    if (!v) return null;
    return /^https?:\/\//i.test(v) ? v : `https://${v}`;
  }
  /** Formats number as rounded Kyat text. */
  function formatKyat(n) {
    const num = Number(n);
    if (!Number.isFinite(num)) return "-";
    return (
      new Intl.NumberFormat("en-US", { maximumFractionDigits: 0 }).format(
        Math.round(num),
      ) + " Ks"
    );
  }
  const svgTrash = () =>
    `<span class="era-icon"><img src="./assets/delete.svg" alt=""></span>`;
  const svgEdit = () =>
    `<span class="era-icon"><img src="./assets/edit.svg" alt=""></span>`;

  // ====== Validation (shared) ======
  /** Shared validator for add/edit catalog forms and API payload shaping. */
  function validateProductForm(refs, { formatName = true } = {}) {
    const errors = {};

    const productRaw = (refs.product?.value || "").trim();
    if (!productRaw) errors.product = true;
    setDanger(refs.product, !productRaw);

    const duration = toInt(refs.duration?.value);
    if (!Number.isInteger(duration) || duration < 1) {
      errors.duration = true;
      setDanger(refs.duration, true);
    } else setDanger(refs.duration, false);

    const wholesale = toMoney(refs.wholesale?.value);
    if (!Number.isFinite(wholesale) || wholesale < 0) {
      errors.wholesale = true;
      setDanger(refs.wholesale, true);
    } else setDanger(refs.wholesale, false);

    const retail = toMoney(refs.retail?.value);
    if (!Number.isFinite(retail) || !(retail > wholesale)) {
      errors.retail = true;
      setDanger(refs.retail, true);
    } else setDanger(refs.retail, false);

    const renewableInt = parseRenewInt(refs.renewable);
    if (
      renewableInt == null || // parseRenewInt returns null when invalid
      !Number.isInteger(duration) || // guard if duration isn't valid yet
      renewableInt >= duration // must be strictly less than duration
    ) {
      errors.renew = true;
      setDanger(refs.renewable, true);
    } else {
      setDanger(refs.renewable, false);
    }

    const valid = Object.keys(errors).length === 0;

    if (refs.saveBtn) {
      refs.saveBtn.disabled = !valid;
      refs.saveBtn.classList.toggle("disableBtn", !valid);
    }

    const product_name = formatName
      ? formatProductName(productRaw, duration)
      : productRaw;

    const payload = {
      product_name,
      duration,
      renew: renewableInt ?? 0,
      store: parseInt(refs.store?.value, 10) || 0,
      supplier: (refs.supplier?.value || "").trim() || null,
      wholesale,
      retail,
      note: (refs.note?.value || "").trim() || null,
      link: normalizeLink(refs.link?.value),
    };

    return { valid, payload };
  }

  /** Attaches validation handlers and runs initial validation pass. */
  function attachValidation(refs, validator) {
    ["input", "blur"].forEach((evt) => {
      refs.product?.addEventListener(evt, validator);
      refs.duration?.addEventListener(evt, validator);
      refs.wholesale?.addEventListener(evt, validator);
      refs.retail?.addEventListener(evt, validator);
      refs.renewable?.addEventListener(evt, validator); // <-- add this (input)
    });
    refs.renewable?.addEventListener("change", validator);
    validator(); // initial
  }

  // ====== Table render ======
  /** Returns a full-width table placeholder row. */
  function placeholderRow(text) {
    const tr = document.createElement("tr");
    const td = document.createElement("td");
    td.className = "era-muted";
    td.colSpan = COLSPAN;
    const isError = /^(Failed|Error)/i.test(text);
    const isEmpty = /no\s+products\s+found/i.test(text);
    if (isError || isEmpty) {
      const wrap = document.createElement("div");
      wrap.className = "era-empty" + (isError ? " era-error" : "");
      const icon = document.createElement("div");
      icon.className = "era-empty-icon";
      icon.textContent = isError ? "!" : "—";
      const title = document.createElement("div");
      title.className = "era-empty-title";
      title.textContent = isError ? "Couldn't load products" : "No products yet";
      const sub = document.createElement("div");
      sub.textContent = isError ? text : 'Use "Add Product" to create your first entry.';
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

  /** Renders product rows into the provided table body. */
  function renderRows(rows, tbody) {
    tbody.innerHTML = "";
    if (!Array.isArray(rows) || rows.length === 0) {
      tbody.appendChild(placeholderRow("No products found."));
      return;
    }
    const frag = document.createDocumentFragment();

    rows.forEach((p, i) => {
      const tr = document.createElement("tr");
      tr.className = "era-row";
      if (p.product_id != null) tr.dataset.id = String(p.product_id);

      const tdNum = document.createElement("td");
      tdNum.className = "era-num";
      tdNum.textContent = String(i + 1);

      const tdProduct = document.createElement("td");
      tdProduct.className = "era-product";
      tdProduct.textContent = p.product_name ?? "-";

      const tdDur = document.createElement("td");
      tdDur.className = "era-dur";
      const badge = document.createElement("span");
      badge.className = "era-badge";
      badge.textContent = (p.duration ?? "-") + "";
      tdDur.appendChild(badge);

      const tdRenew = document.createElement("td");
      tdRenew.className = "era-renew";
      const renewInt =
        "renew_int" in p
          ? coerceRenewInt(p.renew_int)
          : coerceRenewInt(p.renew);
      tdRenew.textContent = String(renewInt); // show the numeric value

      const tdSupplier = document.createElement("td");
      tdSupplier.className = "era-supplier";
      tdSupplier.textContent = p.supplier ?? "-";

      const tdNote = document.createElement("td");
      tdNote.className = "era-muted column-hide";
      tdNote.title = p.note ?? "";
      tdNote.textContent = p.note ?? "-";

      const tdLink = document.createElement("td");
      tdLink.className = "era-muted column-hide";
      tdLink.textContent = p.link ? p.link : "-";

      const tdWholesale = document.createElement("td");
      tdWholesale.className = "era-price";
      tdWholesale.textContent = formatKyat(p.wholesale);

      const tdRetail = document.createElement("td");
      tdRetail.className = "era-price";
      tdRetail.textContent = formatKyat(p.retail);

      const tdActions = document.createElement("td");
      tdActions.className = "era-actions";

      const editBtn = document.createElement("button");
      editBtn.className = "era-icon-btn";
      editBtn.type = "button";
      editBtn.title = "Edit";
      editBtn.setAttribute("aria-label", `Edit row ${i + 1}`);
      editBtn.innerHTML = svgEdit();
      editBtn.addEventListener("click", () => openEditForm(p));

      const delBtn = document.createElement("button");
      delBtn.className = "era-icon-btn";
      delBtn.type = "button";
      delBtn.dataset.action = "delete";
      delBtn.title = "Delete";
      delBtn.setAttribute("aria-label", `Delete row ${i + 1}`);
      delBtn.innerHTML = svgTrash();

      tdActions.append(editBtn, delBtn);

      tr.append(
        tdNum,
        tdProduct,
        tdDur,
        tdRenew,
        tdSupplier,
        tdNote,
        tdLink,
        tdWholesale,
        tdRetail,
        tdActions,
      );
      frag.appendChild(tr);
    });

    tbody.appendChild(frag);
  }

  const cache = { retail: [], wholesale: [] };

  /** Case-insensitive filter on product_name/supplier/note. */
  function filterRows(rows, query) {
    const q = String(query || "").trim().toLowerCase();
    if (!q) return rows;
    return rows.filter((r) => {
      const hay = `${r.product_name || ""} ${r.supplier || ""} ${r.note || ""}`.toLowerCase();
      return hay.includes(q);
    });
  }

  function applyProductFilter() {
    const { tbody, type } = getCurrentTable();
    const input = document.getElementById("product_search");
    const rows = filterRows(cache[type] || [], input ? input.value : "");
    renderRows(rows, tbody);
  }

  /** Loads products for the active tab and renders the corresponding table. */
  async function loadProducts() {
    const { tbody, api, type } = getCurrentTable();

    tbody.innerHTML = "";
    tbody.appendChild(placeholderRow("Loading…"));
    try {
      const r = await csrfFetch(api.list, {
        headers: { Accept: "application/json" },
      });
      const json = await r.json().catch(() => ({}));
      if (!r.ok || !json.success)
        throw new Error(json.error || `HTTP ${r.status}`);
      cache[type] = json.data || [];
      applyProductFilter();
    } catch (err) {
      console.error("Failed to load products:", err);
      tbody.innerHTML = "";
      tbody.appendChild(placeholderRow(`Failed to load: ${err.message}`));
    }
  }

  document.addEventListener("DOMContentLoaded", () => {
    const input = document.getElementById("product_search");
    if (!input) return;
    let t;
    input.addEventListener("input", () => {
      clearTimeout(t);
      t = setTimeout(applyProductFilter, 120);
    });
  });

  /** Recomputes row numbering after a client-side delete. */
  function renumberRows(tbody) {
    tbody.querySelectorAll("tr.era-row").forEach((tr, idx) => {
      const cell = tr.querySelector(".era-num");
      if (cell) cell.textContent = String(idx + 1);
    });
  }

  // ====== Delete (delegated) ======
  /** Binds delegated delete handlers for both retail and wholesale tables. */
  function setupDeleteHandlers() {
    [retailTbody, wholesaleTbody].forEach((tbody) => {
      if (!tbody) return;

      tbody.addEventListener("click", async (e) => {
        const btn = e.target.closest(
          'button.era-icon-btn[data-action="delete"]',
        );
        if (!btn) return;
        const tr = btn.closest("tr.era-row");
        if (!tr) return;
        const id = Number(tr.dataset.id);
        if (!id) return await showAlert("Missing product_id for this row.");

        const name =
          tr.querySelector(".era-product")?.textContent?.trim() || `#${id}`;
        if (!await showConfirm(`Delete ""?
This cannot be undone.`)) return;

        const { api } = getCurrentTable();

        btn.disabled = true;
        btn.classList.add("disableBtn");
        try {
          const resp = await csrfFetch(api.delete, {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              Accept: "application/json",
            },
            body: JSON.stringify({ id }),
          });
          const json = await resp.json().catch(() => ({}));
          if (!resp.ok || !json.success)
            throw new Error(json.error || `HTTP ${resp.status}`);
          tr.remove();
          if (!tbody.querySelector("tr.era-row")) {
            tbody.innerHTML = "";
            tbody.appendChild(placeholderRow("No products found."));
          } else {
            renumberRows(tbody);
          }
        } catch (err) {
          console.error("Delete failed:", err);
          await showAlert(`Delete failed: `);
          btn.disabled = false;
          btn.classList.remove("disableBtn");
        }
      });
    });
  }

  // ====== Add form wiring ======
  if (addEls) {
    const validateAdd = () => validateProductForm(addEls, { formatName: true });
    attachValidation(addEls, validateAdd);

    addEls.form.addEventListener("submit", async (e) => {
      e.preventDefault();
      const { valid, payload } = validateAdd();
      if (!valid) return;

      const { api } = getCurrentTable();

      try {
        if (addEls.feedback) {
          addEls.feedback.style.display = "block";
          addEls.feedback.style.color = "";
          addEls.feedback.textContent = "Saving...";
        }
        addEls.saveBtn.disabled = true;
        addEls.saveBtn.classList.add("disableBtn");

        const resp = await csrfFetch(api.insert, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Accept: "application/json",
          },
          body: JSON.stringify(payload),
        });
        const data = await resp.json().catch(() => ({}));
        if (!resp.ok || !data.success)
          throw new Error(data.error || `HTTP ${resp.status}`);

        // success
        addEls.form.reset();
        setRenewableControlValue(addEls.renewable, 0); // default to 0 after save
        validateAdd();
        if (addEls.feedback) {
          addEls.feedback.textContent = "Successfully Saved";
          addEls.feedback.style.color = "white";
        }
        setTimeout(() => {
          if (addEls.feedback) addEls.feedback.style.display = "none";
          if (typeof window.hideAddProductForm === "function")
            window.hideAddProductForm();
          if (typeof window.refreshProductsTable === "function")
            window.refreshProductsTable();
        }, 800);
      } catch (err) {
        console.error("Save failed:", err);
        if (addEls.feedback) {
          addEls.feedback.style.display = "block";
          addEls.feedback.style.color = "red";
          addEls.feedback.textContent = `Save failed: ${err.message}`;
        }
      } finally {
        addEls.saveBtn.disabled = false;
        addEls.saveBtn.classList.remove("disableBtn");
      }
    });
  }

  // ====== Edit form wiring + openEditForm ======
  if (editEls) {
    const validateEdit = () => {
      const { valid, payload } = validateProductForm(editEls, {
        formatName: true,
      });
      if (payload) payload.id = Number(editEls.id.value);
      return { valid, payload };
    };
    attachValidation(editEls, validateEdit);

    window.openEditForm = function openEditForm(p) {
      const editSec = $("editProductForm"),
        addSec = $("addProductForm"),
        userSec = $("user_setting");
      if (addSec) addSec.style.display = "none";
      if (userSec) userSec.style.display = "none";
      if (editSec) editSec.style.display = "block";

      editEls.id.value = p.product_id ?? "";
      editEls.product.value = stripDurationSuffix(p.product_name ?? "");
      editEls.duration.value = p.duration ?? "";
      editEls.supplier.value = p.supplier ?? "";

      const renewInt2 =
        "renew_int" in p
          ? coerceRenewInt(p.renew_int)
          : coerceRenewInt(p.renew);
      setRenewableControlValue(editEls.renewable, renewInt2);

      editEls.note.value = p.note ?? "";
      editEls.link.value = p.link ?? "";
      editEls.wholesale.value = p.wholesale ?? "";
      editEls.retail.value = p.retail ?? "";

      validateEdit();
    };

    editEls.form.addEventListener("submit", async (e) => {
      e.preventDefault();
      const { valid, payload } = validateEdit();
      if (!valid) return;

      const { api } = getCurrentTable();

      try {
        if (editEls.feedback) {
          editEls.feedback.style.display = "block";
          editEls.feedback.style.color = "";
          editEls.feedback.textContent = "Saving...";
        }
        editEls.saveBtn.disabled = true;
        editEls.saveBtn.classList.add("disableBtn");

        const res = await csrfFetch(api.update, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Accept: "application/json",
          },
          body: JSON.stringify(payload),
        });
        const json = await res.json().catch(() => ({}));

        if (res.status === 422) {
          const msg = json.errors
            ? Object.values(json.errors).join(" | ")
            : "Validation failed.";
          throw new Error(msg);
        }
        if (!res.ok || !json.success)
          throw new Error(json.error || `HTTP ${res.status}`);

        if (editEls.feedback)
          editEls.feedback.textContent = "Successfully Saved";
        setTimeout(() => {
          if (editEls.feedback) editEls.feedback.style.display = "none";
          if (typeof window.hideEditProductForm === "function")
            window.hideEditProductForm();
          if (typeof window.refreshProductsTable === "function")
            window.refreshProductsTable();
        }, 800);
      } catch (err) {
        console.error("Update failed:", err);
        if (editEls.feedback) {
          editEls.feedback.style.display = "block";
          editEls.feedback.style.color = "red";
          editEls.feedback.textContent = `Save failed: ${err.message}`;
        }
      } finally {
        editEls.saveBtn.disabled = false;
        editEls.saveBtn.classList.remove("disableBtn");
      }
    });
  }

  // ====== Tab switching and form toggle ======
  /** Reloads product rows whenever retail/wholesale tab changes. */
  function setupTabSwitching() {
    const retailBtn = document.getElementById("retail_page");
    const wholesaleBtn = document.getElementById("wholesale_page");

    // Tab switching - reload products when switching tabs
    if (retailBtn && wholesaleBtn) {
      retailBtn.addEventListener("click", () => {
        loadProducts(); // Reload products for retail
      });

      wholesaleBtn.addEventListener("click", () => {
        loadProducts(); // Reload products for wholesale
      });
    }
  }

  // ====== Initial load ======
  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", () => {
      setupDeleteHandlers();
      setupTabSwitching();
      loadProducts();
    });
  } else {
    setupDeleteHandlers();
    setupTabSwitching();
    loadProducts();
  }

  // exposed for external calls
  window.refreshProductsTable = loadProducts;
})();
