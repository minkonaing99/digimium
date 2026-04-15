"use strict";

/**
 * createSalesController(cfg) – shared table/card engine for retail & wholesale.
 *
 * Returns { loadSales, refreshCacheAndReload } for external callers.
 *
 * cfg: {
 *   apiList:     string,         — list endpoint URL
 *   apiDelete:   string,         — delete endpoint URL
 *   apiInline:   string,         — inline-update endpoint URL
 *   tbodyId:     string,         — desktop <tbody> element id
 *   subsListId:  string,         — mobile cards container id
 *   cacheKey:    string,         — sessionStorage key
 *   refreshKey:  string,         — window property exposed for external refresh
 *   isActive?:   () => bool,     — return false when tab is hidden (skip search/resize)
 *   rowClass?:   (s) => string,  — per-row CSS class (store colouring for retail)
 *   cardTopRow?: (r, esc) => string, — extra HTML inside .subs-row-top (renew for retail)
 * }
 */
function createSalesController(cfg) {
  const {
    apiList:    API_LIST_URL,
    apiDelete:  API_DELETE_URL,
    apiInline:  API_INLINE_URL,
    tbodyId,
    subsListId,
    cacheKey:   CACHE_KEY,
    refreshKey,
    isActive    = () => true,
    rowClass    = () => "",
    cardTopRow  = () => "",
  } = cfg;

  const API_FETCH_LIMIT = 500;
  const COLSPAN   = 10;
  const PAGE_SIZE = 100;

  const tbody    = document.getElementById(tbodyId);
  const subsList = document.getElementById(subsListId);
  if (!tbody && !subsList) return null;

  // Each controller finds its own wrapping .era-table-wrap rather than
  // always grabbing the first one on the page.
  const tableWrap = tbody ? tbody.closest(".era-table-wrap") : null;

  const MQ_MOBILE = window.matchMedia("(max-width: 640px)");

  let allRows            = [];
  let flatRowsTable      = [];
  let renderedCountTable = 0;
  let totalsByDate       = new Map();
  let countsByDate       = new Map();
  let renderedByDate     = new Map();
  let rowNumBase         = 0;
  let ioTable            = null;
  let flatRowsCards      = [];
  let renderedCountCards = 0;
  let ioCards            = null;
  let activeEditor       = null;
  let currentQuery       = "";

  /* ------------------------------------------------------------------ */
  /* cache                                                                */
  /* ------------------------------------------------------------------ */
  function readCachePacket() {
    const raw = sessionStorage.getItem(CACHE_KEY);
    if (!raw) return { data: null, etag: null };
    try {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed)) return { data: parsed, etag: null };
      if (parsed && Array.isArray(parsed.data)) return { data: parsed.data, etag: parsed.etag || null };
    } catch {}
    return { data: null, etag: null };
  }

  function writeCachePacket(data, etag = null) {
    sessionStorage.setItem(CACHE_KEY, JSON.stringify({ data, etag, ts: Date.now() }));
  }

  /* ------------------------------------------------------------------ */
  /* helpers                                                              */
  /* ------------------------------------------------------------------ */
  const svgTrash = () =>
    `<span class="era-icon"><img src="./assets/delete.svg" alt=""></span>`;

  function formatKyat(n) {
    const num = Number(n);
    if (!Number.isFinite(num)) return "-";
    return (
      new Intl.NumberFormat("en-US", { maximumFractionDigits: 0 }).format(Math.round(num)) + " Ks"
    );
  }

  function formatDate(d) {
    if (!d) return "-";
    const parts = String(d).split("-");
    if (parts.length !== 3) return "-";
    const dt = new Date(Date.UTC(+parts[0], +parts[1] - 1, +parts[2]));
    return new Intl.DateTimeFormat("en-GB", {
      day: "2-digit", month: "short", year: "numeric",
    }).format(dt);
  }

  const esc = (s) =>
    String(s ?? "").replace(
      /[&<>"']/g,
      (m) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[m],
    );

  function placeholderRow(text) {
    const tr = document.createElement("tr");
    const td = document.createElement("td");
    td.className = "era-muted";
    td.colSpan = COLSPAN;
    td.textContent = text;
    tr.appendChild(td);
    return tr;
  }

  function debounce(fn, ms = 1000) {
    let t;
    return (...args) => { clearTimeout(t); t = setTimeout(() => fn(...args), ms); };
  }

  /* ------------------------------------------------------------------ */
  /* search key                                                           */
  /* ------------------------------------------------------------------ */
  function buildSearchKey(r) {
    const tokenizeDate = (ymd) => {
      if (!ymd) return [];
      const parts = String(ymd).split("-");
      if (parts.length !== 3) return [];
      const [y, m, d] = parts.map((n) => parseInt(n, 10));
      if (!y || !m || !d) return [];
      const dt       = new Date(Date.UTC(y, m - 1, d));
      const monShort = dt.toLocaleString("en-US", { month: "short" }).toLowerCase();
      const monLong  = dt.toLocaleString("en-US", { month: "long"  }).toLowerCase();
      const mm   = String(m).padStart(2, "0");
      const dd   = String(d).padStart(2, "0");
      const yyyy = String(y);
      return [
        `${dd} ${monShort} ${yyyy}`, `${dd} ${monLong} ${yyyy}`,
        `${monShort} ${yyyy}`,       `${monLong} ${yyyy}`,
        `${mm} ${yyyy}`,             `${yyyy}-${mm}`,
        `${yyyy}-${mm}-${dd}`,
        monShort, monLong, mm, yyyy,
      ];
    };

    const purchasedTokens = tokenizeDate(r.purchased_date);
    const expiredTokens   = tokenizeDate(r.expired_date);

    r._qPD  = purchasedTokens.join("|").toLowerCase();
    r._qED  = expiredTokens.join("|").toLowerCase();
    r._qAll = [
      r.customer ?? "", r.email ?? "", r.sale_product ?? "", r.manager ?? "",
      ...purchasedTokens, ...expiredTokens,
    ].join("|").toLowerCase();
    r._q = r._qAll;
  }

  /* ------------------------------------------------------------------ */
  /* local update (optimistic inline edit / cache sync)                  */
  /* ------------------------------------------------------------------ */
  function updateLocalRow(id, patch) {
    const idStr = String(id);
    const touchesSearch =
      "customer" in patch || "email" in patch || "manager" in patch ||
      "sale_product" in patch || "renew" in patch ||
      "purchased_date" in patch || "expired_date" in patch;

    allRows = allRows.map((r) => {
      if (String(r.sale_id) !== idStr) return r;
      const nr = { ...r, ...patch };
      if (touchesSearch) buildSearchKey(nr);
      return nr;
    });

    const packet = readCachePacket();
    if (packet.data) {
      try {
        const data = packet.data;
        const idx  = data.findIndex((r) => String(r.sale_id) === idStr);
        if (idx >= 0) {
          data[idx] = { ...data[idx], ...patch };
          if (touchesSearch) buildSearchKey(data[idx]);
          writeCachePacket(data, packet.etag);
        }
      } catch {}
    }
  }

  /* ------------------------------------------------------------------ */
  /* desktop table row builder                                            */
  /* ------------------------------------------------------------------ */
  function buildSaleTr(s, displayNum) {
    const rc  = rowClass(s);
    const cls = (base) => (rc ? `${base} ${rc}` : base);

    const tr = document.createElement("tr");
    tr.className = cls("era-row");
    if (s.sale_id != null) tr.dataset.id = String(s.sale_id);

    const tdNum = document.createElement("td");
    tdNum.className = cls("era-num");
    tdNum.textContent = String(displayNum);

    const tdProd = document.createElement("td");
    if (rc) tdProd.className = rc;
    tdProd.textContent = s.sale_product ?? "-";

    const makeEditable = (field, text, extraClass = "") => {
      const td = document.createElement("td");
      const base = `td-scrollable editable-cell editable-${field}`;
      td.className = (rc
        ? `${base} ${rc} ${extraClass}`
        : `${base} ${extraClass}`
      ).trim();
      td.dataset.id    = String(s.sale_id || "");
      td.dataset.field = field;
      const span = document.createElement("span");
      span.className   = "inline-text";
      span.textContent = text ?? "-";
      td.appendChild(span);
      if (field === "note" || field === "customer") td.title = text ?? "";
      return td;
    };

    const tdCustomer  = makeEditable("customer", s.customer, "era-muted-customer");
    const tdEmail     = makeEditable("email",    s.email,    "era-muted");

    const tdPurchased = document.createElement("td");
    tdPurchased.className  = cls("text-center");
    tdPurchased.textContent = formatDate(s.purchased_date);

    const tdExpired = document.createElement("td");
    tdExpired.className  = cls("text-center");
    tdExpired.textContent = formatDate(s.expired_date);

    const tdManager = makeEditable("manager", s.manager, "era-muted column-hide");
    const tdNote    = makeEditable("note",    s.note,    "era-muted column-hide");

    const tdPrice = document.createElement("td");
    tdPrice.className   = cls("era-price");
    tdPrice.textContent = formatKyat(s.price);

    const tdActions = document.createElement("td");
    tdActions.className = cls("era-actions");
    const delBtn = document.createElement("button");
    delBtn.className = "era-icon-btn";
    delBtn.type      = "button";
    delBtn.dataset.action = "delete";
    delBtn.title = "Delete";
    delBtn.setAttribute("aria-label", `Delete row ${displayNum}`);
    delBtn.innerHTML = svgTrash();
    tdActions.appendChild(delBtn);

    tr.append(tdNum, tdProd, tdCustomer, tdEmail, tdPurchased, tdExpired, tdManager, tdNote, tdPrice, tdActions);
    return tr;
  }

  /* ------------------------------------------------------------------ */
  /* subtotal / daily stats                                               */
  /* ------------------------------------------------------------------ */
  function buildSubtotalTr(dateKey) {
    const tr = document.createElement("tr");
    tr.className = "era-row era-subtotal";

    const tdLabel = document.createElement("td");
    tdLabel.colSpan    = 6;
    tdLabel.textContent = `Total for ${formatDate(dateKey)}`;
    tr.appendChild(tdLabel);

    for (let i = 0; i < 2; i++) {
      const tdFill = document.createElement("td");
      tdFill.className = "column-hide";
      tr.appendChild(tdFill);
    }

    const tdSum = document.createElement("td");
    tdSum.className  = "era-price";
    tdSum.style.padding = "0.4rem 0.4rem";
    tdSum.textContent = formatKyat(totalsByDate.get(dateKey) || 0);
    tr.appendChild(tdSum);

    tr.appendChild(document.createElement("td")); // actions placeholder
    return tr;
  }

  function buildDailyStats(rows) {
    totalsByDate   = new Map();
    countsByDate   = new Map();
    renderedByDate = new Map();
    rows.forEach((r) => {
      const d = r.purchased_date || "";
      const p = Number(r.price) || 0;
      totalsByDate.set(d, (totalsByDate.get(d) || 0) + p);
      countsByDate.set(d, (countsByDate.get(d) || 0) + 1);
    });
  }

  /* ------------------------------------------------------------------ */
  /* inline editing                                                       */
  /* ------------------------------------------------------------------ */
  function startInlineEdit(td) {
    if (!td || td.classList.contains("editing")) return;
    if (activeEditor && activeEditor.td !== td) cancelInline(activeEditor.td);

    const span = td.querySelector(".inline-text");
    if (!span) return;

    const field   = td.dataset.field;
    const initial = (span.textContent || "").trim();

    td.classList.add("editing");
    span.style.display = "none";

    const input = document.createElement("input");
    input.type      = field === "email" ? "email" : "text";
    input.className = "form-control form-control-sm inline-input";
    input.value     = initial === "-" ? "" : initial;
    input.style.width     = "100%";
    input.style.boxSizing = "border-box";
    td.appendChild(input);

    activeEditor = { td, input, span, prev: initial };
    input.focus();
    input.select();
  }

  function cancelInline(td) {
    if (!td || !td.classList.contains("editing")) return;
    const input = td.querySelector(".inline-input");
    const span  = td.querySelector(".inline-text");
    if (input) td.removeChild(input);
    if (span) {
      span.textContent   = activeEditor?.prev ?? span.textContent;
      span.style.display = "";
    }
    if (td.dataset.field === "note" || td.dataset.field === "customer") {
      td.title = activeEditor?.prev || "";
    }
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
      td.classList.remove("editing");
      if (activeEditor?.td === td) activeEditor = null;
      return;
    }

    if (field === "email" && next && !/^\S+@\S+\.\S+$/.test(next)) {
      alert("Please enter a valid email.");
      input.focus();
      return;
    }
    if (field === "customer" && !next) {
      alert("Customer cannot be empty.");
      input.focus();
      return;
    }

    // optimistic UI
    span.textContent   = next || "-";
    span.style.display = "";
    if (field === "note" || field === "customer") td.title = next || "";
    td.removeChild(input);
    td.classList.remove("editing");
    if (activeEditor?.td === td) activeEditor = null;

    updateLocalRow(id, { [field]: next || null });

    try {
      if (window.LoadingSystem) window.LoadingSystem.setButtonLoading(td, true);
      const res  = await fetch(API_INLINE_URL, {
        method:  "POST",
        headers: { "Content-Type": "application/json", Accept: "application/json" },
        body:    JSON.stringify({ id, [field]: next || null }),
      });
      const json = await res.json().catch(() => ({}));
      if (!res.ok || !json.success) throw new Error(json.error || `HTTP ${res.status}`);
      if (currentQuery) renderViewport(filterRowsByQuery(allRows, currentQuery));
    } catch (err) {
      span.textContent = prev || "-";
      if (field === "note" || field === "customer") td.title = prev || "";
      updateLocalRow(id, { [field]: prev || null });
      alert(`Failed to save ${field}: ${err.message}`);
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

    tbody.addEventListener("blur", (e) => {
      if (e.target.matches(".inline-input")) {
        const td = e.target.closest(".editable-cell");
        setTimeout(() => td && cancelInline(td), 100);
      }
    }, true);
  }

  /* ------------------------------------------------------------------ */
  /* search                                                               */
  /* ------------------------------------------------------------------ */
  function filterRowsByQuery(rows, q) {
    if (!q) return rows;
    let raw = q.trim().toLowerCase();
    if (!raw) return rows;

    let mode = "all";
    if (raw.startsWith("pd:"))      { mode = "pd"; raw = raw.slice(3).trim(); }
    else if (raw.startsWith("ed:")) { mode = "ed"; raw = raw.slice(3).trim(); }
    if (!raw) return rows;

    const getter = mode === "pd" ? (r) => r._qPD || ""
                 : mode === "ed" ? (r) => r._qED || ""
                 : (r) => r._qAll || r._q || "";
    return rows.filter((r) => getter(r).includes(raw));
  }

  function applySearchRender() {
    if (!isActive()) return;
    const input = document.getElementById("search_customer");
    currentQuery = (input?.value || "").trim();
    renderViewport(filterRowsByQuery(allRows, currentQuery));
    if (tableWrap) tableWrap.scrollTo({ top: 0, behavior: "instant" });
  }

  function setupCustomerSearch() {
    const input = document.getElementById("search_customer");
    if (!input) return;
    input.addEventListener("input",   debounce(applySearchRender, 1000));
    input.addEventListener("keydown", (e) => {
      if (e.key === "Enter") { e.preventDefault(); applySearchRender(); }
    });
  }

  /* ------------------------------------------------------------------ */
  /* desktop table render                                                 */
  /* ------------------------------------------------------------------ */
  function appendNextChunkTable() {
    if (!tbody || renderedCountTable >= flatRowsTable.length) return;

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

  /* ------------------------------------------------------------------ */
  /* mobile card render                                                   */
  /* ------------------------------------------------------------------ */
  function appendNextChunkCards() {
    if (!subsList || renderedCountCards >= flatRowsCards.length) return;

    const frag  = document.createDocumentFragment();
    const start = renderedCountCards;
    const end   = Math.min(flatRowsCards.length, start + PAGE_SIZE);

    for (let i = start; i < end; i++) {
      const r         = flatRowsCards[i];
      const product   = esc(r.sale_product ?? "-");
      const name      = esc(r.customer     ?? "-");
      const email     = esc(r.email        ?? "-");
      const manager   = esc(r.manager      ?? "-");
      const purchased = formatDate(r.purchased_date);
      const expired   = formatDate(r.expired_date);
      const price     = formatKyat(r.price);

      const article = document.createElement("article");
      article.className = "subs-card";
      article.innerHTML = `
        <div class="subs-row subs-row-top">
          <div class="subs-product">${product}</div>
          ${cardTopRow(r, esc)}
        </div>
        <div class="subs-row subs-name">
          <span class="subs-label">Name:</span>
          <span class="subs-customer-value" title="${name}">${name}</span>
        </div>
        <div class="subs-row subs-name"><span class="subs-label">Email:</span><span>${email}</span></div>
        <div class="subs-row subs-name"><span class="subs-label">Manager:</span><span>${manager}</span></div>
        <div class="subs-row subs-dates">
          <div class="subs-purchased"><span class="subs-label">Purchased:</span><span>${purchased}</span></div>
          <div class="subs-expire"><span class="subs-label">Expire: </span><span>${expired}</span></div>
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

  /* ------------------------------------------------------------------ */
  /* viewport dispatcher                                                  */
  /* ------------------------------------------------------------------ */
  function setContainersForViewport() {
    if (tableWrap) tableWrap.style.display = MQ_MOBILE.matches ? "none"  : "block";
    if (subsList)  subsList.style.display  = MQ_MOBILE.matches ? "block" : "none";
  }

  function renderViewport(rows) {
    setContainersForViewport();
    if (MQ_MOBILE.matches) renderCardsProgressive(rows);
    else renderRowsProgressive(rows);
  }

  /* ------------------------------------------------------------------ */
  /* network fetch                                                        */
  /* ------------------------------------------------------------------ */
  async function fetchSalesFromNetwork(etag = null) {
    let cursor    = null;
    let firstEtag = etag || null;
    let isFirst   = true;
    const all     = [];

    while (true) {
      const params = new URLSearchParams({ limit: String(API_FETCH_LIMIT) });
      if (cursor) params.set("cursor", cursor);
      const headers = { Accept: "application/json" };
      if (isFirst && etag) headers["If-None-Match"] = etag;

      const r = await fetch(`${API_LIST_URL}?${params.toString()}`, { headers });
      if (isFirst && r.status === 304) return { notModified: true, data: null, etag };

      const json = await r.json().catch(() => ({}));
      if (!r.ok || !json.success) throw new Error(json.error || `HTTP ${r.status}`);

      const pageRows = Array.isArray(json.data) ? json.data : [];
      all.push(...pageRows);
      if (isFirst) firstEtag = r.headers.get("ETag");

      const meta = json.meta || {};
      if (!meta.has_more || !meta.next_cursor) break;
      cursor  = meta.next_cursor;
      isFirst = false;
    }

    return { notModified: false, data: all, etag: firstEtag };
  }

  /* ------------------------------------------------------------------ */
  /* load / refresh                                                       */
  /* ------------------------------------------------------------------ */
  async function loadSales() {
    if (window.LoadingSystem) window.LoadingSystem.showGlobalLoading("Loading sales data...");
    showLoader();

    if (!MQ_MOBILE.matches && tbody) {
      tbody.innerHTML = "";
      tbody.appendChild(placeholderRow("Loading…"));
    } else if (subsList) {
      subsList.innerHTML = `<article class="subs-card"><div class="subs-row">Loading…</div></article>`;
    }

    const cachePacket = readCachePacket();
    if (cachePacket.data) {
      try {
        allRows = Array.isArray(cachePacket.data) ? cachePacket.data : [];
        allRows.forEach(buildSearchKey);
        renderViewport(filterRowsByQuery(allRows, currentQuery));
        if (window.LoadingSystem) window.LoadingSystem.hideGlobalLoading();
        hideLoader();

        // Background refresh — update cache silently if data has changed
        fetchSalesFromNetwork(cachePacket.etag)
          .then((res) => {
            if (res.notModified) return;
            const fresh = res.data || [];
            writeCachePacket(fresh, res.etag || null);
            allRows = Array.isArray(fresh) ? fresh : [];
            allRows.forEach(buildSearchKey);
            renderViewport(filterRowsByQuery(allRows, currentQuery));
          })
          .catch(() => {});
        return;
      } catch {
        sessionStorage.removeItem(CACHE_KEY);
      }
    }

    try {
      const res   = await fetchSalesFromNetwork();
      const fresh = res.data || [];
      writeCachePacket(fresh, res.etag || null);
      allRows = Array.isArray(fresh) ? fresh : [];
      allRows.forEach(buildSearchKey);
      renderViewport(filterRowsByQuery(allRows, currentQuery));
    } catch (err) {
      console.error(`Failed to load [${CACHE_KEY}]:`, err);
      if (!MQ_MOBILE.matches && tbody) {
        tbody.innerHTML = "";
        tbody.appendChild(placeholderRow(`Failed to load: ${err.message}`));
      } else if (subsList) {
        subsList.innerHTML = `<article class="subs-card"><div class="subs-row">Failed to load: ${esc(err.message)}</div></article>`;
      }
    } finally {
      if (window.LoadingSystem) window.LoadingSystem.hideGlobalLoading();
      hideLoader();
    }
  }

  function refreshCacheAndReload() {
    sessionStorage.removeItem(CACHE_KEY);
    return loadSales();
  }

  /* ------------------------------------------------------------------ */
  /* delete (delegated)                                                   */
  /* ------------------------------------------------------------------ */
  tbody?.addEventListener("click", async (e) => {
    const btn = e.target.closest('button.era-icon-btn[data-action="delete"]');
    if (!btn) return;

    const tr = btn.closest("tr.era-row");
    if (!tr) return;
    const id = Number(tr.dataset.id);
    if (!id) return alert("Missing sale_id for this row.");

    const name = tr.children[1]?.textContent?.trim() || `#${id}`;
    if (!confirm(`Delete "${name}"?\nThis cannot be undone.`)) return;

    btn.disabled = true;
    btn.classList.add("disableBtn");
    try {
      const resp = await fetch(API_DELETE_URL, {
        method:  "POST",
        headers: { "Content-Type": "application/json", Accept: "application/json" },
        body:    JSON.stringify({ id }),
      });
      const json = await resp.json().catch(() => ({}));
      if (!resp.ok || !json.success) throw new Error(json.error || `HTTP ${resp.status}`);
      await refreshCacheAndReload();
    } catch (err) {
      console.error("Delete failed:", err);
      alert(`Delete failed: ${err.message}`);
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
    if (!confirm(`Delete #${id}? This cannot be undone.`)) return;

    btn.disabled = true;
    btn.classList.add("disableBtn");
    try {
      const resp = await fetch(API_DELETE_URL, {
        method:  "POST",
        headers: { "Content-Type": "application/json", Accept: "application/json" },
        body:    JSON.stringify({ id }),
      });
      const json = await resp.json().catch(() => ({}));
      if (!resp.ok || !json.success) throw new Error(json.error || `HTTP ${resp.status}`);
      await refreshCacheAndReload();
    } catch (err) {
      alert(`Delete failed: ${err.message}`);
    } finally {
      btn.disabled = false;
      btn.classList.remove("disableBtn");
    }
  });

  /* ------------------------------------------------------------------ */
  /* init                                                                 */
  /* ------------------------------------------------------------------ */
  MQ_MOBILE.addEventListener("change", () => {
    if (isActive()) renderViewport(filterRowsByQuery(allRows, currentQuery));
  });

  setupCustomerSearch();
  initInlineEditing();
  window[refreshKey] = refreshCacheAndReload;

  return { loadSales, refreshCacheAndReload };
}
