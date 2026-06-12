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
/* summary_table.js */
/**
 * Module: Summary renew/expire tables renderer.
 * Purpose: Builds desktop + mobile "Expire Soon" and "Need Renew" views from
 * `api/sales_minimal.php` data and applies date-range filtering.
 */
(() => {
  "use strict";

  // ------------------------------ Config ------------------------------
  const API_URL = "api/sales_minimal.php";
  const CACHE_KEY = "summarySalesMinimal:v2";

  // ------------------------------ Date utils (UTC-only) ------------------------------
  const msPerDay = 86_400_000;

  /** Parse 'YYYY-MM-DD' to a UTC Date, or null */
  const toUTC = (ymd) => {
    if (!ymd || typeof ymd !== "string") return null;
    const [y, m, d] = ymd.split("-").map((n) => Number(n));
    if (!Number.isInteger(y) || !Number.isInteger(m) || !Number.isInteger(d))
      return null;
    return new Date(Date.UTC(y, m - 1, d));
  };

  const ymd = (dtUTC) => {
    const y = dtUTC.getUTCFullYear();
    const m = String(dtUTC.getUTCMonth() + 1).padStart(2, "0");
    const d = String(dtUTC.getUTCDate()).padStart(2, "0");
    return `${y}-${m}-${d}`;
  };

  const todayUTC = (() => {
    const t = new Date();
    return new Date(Date.UTC(t.getFullYear(), t.getMonth(), t.getDate()));
  })();

  const daysBetween = (aUTC, bUTC) => Math.round((aUTC - bUTC) / msPerDay);
  const addDaysUTC = (baseUTC, days) =>
    new Date(baseUTC.getTime() + days * msPerDay);

  const lastDayOf = (y, m0) => new Date(Date.UTC(y, m0 + 1, 0)).getUTCDate();

  const addMonthsUTC = (baseUTC, delta) => {
    const y = baseUTC.getUTCFullYear();
    const m = baseUTC.getUTCMonth();
    const d = baseUTC.getUTCDate();
    const tgt = m + delta;
    const y2 = y + Math.floor(tgt / 12);
    const m2 = ((tgt % 12) + 12) % 12;
    const d2 = Math.min(d, lastDayOf(y2, m2));
    return new Date(Date.UTC(y2, m2, d2));
  };

  const fmt = new Intl.DateTimeFormat("en-GB", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    timeZone: "UTC",
  });

  const fmtDate = (ymdStr) => {
    const dt = toUTC(ymdStr);
    return dt ? fmt.format(dt) : "-";
  };

  const leftLabel = (n) =>
    n < 0 ? `${Math.abs(n)} days ago` : n === 0 ? "Today" : n === 1 ? "1 day" : `${n} days`;
  const fmtMoney = (n) =>
    `${new Intl.NumberFormat("en-US", { maximumFractionDigits: 0 }).format(
      Math.round(Number(n) || 0)
    )} Ks`;

  // ------------------------------ DOM helpers ------------------------------
  const qs = (id) => document.getElementById(id) || null;

  const placeholderRow = (text, colspan = 7) => {
    const tr = document.createElement("tr");
    const td = document.createElement("td");
    td.className = "era-muted";
    td.colSpan = colspan;
    td.textContent = text;
    tr.appendChild(td);
    return tr;
  };

  const setLoading = (tbody, text = "Loading…") => {
    if (!tbody) return;
    tbody.innerHTML = "";
    tbody.appendChild(placeholderRow(text));
  };

  const setMobilePlaceholder = (el, text) => {
    if (!el) return;
    el.innerHTML = `<div class="subs-card era-muted" style="text-align:center;">${text}</div>`;
  };

  const getStoreClass = (row) => {
    const storeValue = Number.parseInt(row?.store, 10);
    if (storeValue === 1) return "store-digimium";
    if (storeValue === 2) return "store-dmarwal";
    if (storeValue === 0) return "store-void";
    if (storeValue === 3) return "store-ember";
    if (storeValue === 4) return "store-violet";
    if (storeValue === 5) return "store-void";

    // Fallback for summary API rows that currently expose sale_type.
    if (row?.sale_type === "retail") return "store-digimium";
    if (row?.sale_type === "wholesale") return "store-dmarwal";

    return "store-default";
  };

  const getDefaultExpireRange = () => ({
    from: ymd(todayUTC),
    to: ymd(addDaysUTC(todayUTC, 3)),
  });

  let allRows = [];
  let expireRange = getDefaultExpireRange();

  function readCachePacket() {
    if (window.__salesMinimalCache && Array.isArray(window.__salesMinimalCache.data)) {
      return window.__salesMinimalCache;
    }
    const raw = sessionStorage.getItem(CACHE_KEY);
    if (!raw) return { data: null, etag: null };
    try {
      const parsed = JSON.parse(raw);
      if (parsed && Array.isArray(parsed.data)) {
        window.__salesMinimalCache = parsed;
        return parsed;
      }
    } catch {}
    return { data: null, etag: null };
  }

  function writeCachePacket(data, etag = null) {
    const packet = { data, etag, ts: Date.now() };
    window.__salesMinimalCache = packet;
    sessionStorage.setItem(CACHE_KEY, JSON.stringify(packet));
  }

  async function fetchRowsFromApi(etag = null) {
    const headers = { Accept: "application/json" };
    if (etag) headers["If-None-Match"] = etag;
    const res = await fetch(API_URL, { headers });
    if (res.status === 304) {
      return { notModified: true, data: null, etag };
    }
    const json = await res.json().catch(() => ({ success: false }));
    if (!res.ok || !json || json.success !== true || !Array.isArray(json.data)) {
      throw new Error((json && json.error) || `HTTP ${res.status}`);
    }
    return { notModified: false, data: json.data, etag: res.headers.get("ETag") };
  }

  /** Updates expire-range helper text near filter controls. */
  function setExpireFilterInfo(count) {
    const info = qs("expire_filter_info");
    if (!info) return;
    const fromText = fmtDate(expireRange.from);
    const toText = fmtDate(expireRange.to);
    info.textContent = `${count} item(s) | ${fromText} - ${toText}`;
  }

  // ------------------------------ Business logic ------------------------------
  const within3Days = (dtUTC) => {
    const d = daysBetween(dtUTC, todayUTC);
    return d >= 0 && d < 4 ? d : null;
  };

  const computeExpiryUTC = (purchasedYMD, duration) => {
    const p = toUTC(purchasedYMD);
    if (!p || !Number.isInteger(duration) || duration < 1) return null;
    return addMonthsUTC(p, duration);
  };

  const nextDueFromAnchor = (purchaseYMD, renewMonths, base = todayUTC) => {
    const p = toUTC(purchaseYMD);
    if (!p || !Number.isInteger(renewMonths) || renewMonths <= 0) return null;
    let due = addMonthsUTC(p, renewMonths);
    while (due < base) due = addMonthsUTC(due, renewMonths);
    return due;
  };

  // ------------------------------ Selection & shaping ------------------------------
  /** Selects rows whose expiry falls within configured expire range. */
  function selectExpireSoon(rows, range = getDefaultExpireRange()) {
    const fromUTC = toUTC(range?.from);
    const toUTCDate = toUTC(range?.to);
    if (!fromUTC || !toUTCDate) return [];

    return (rows || [])
      .map((r) => {
        const expUTC = toUTC(r.expired_date);
        if (!expUTC) return null;
        if (expUTC < fromUTC || expUTC > toUTCDate) return null;
        const left = daysBetween(expUTC, todayUTC);
        return { ...r, _days: left };
      })
      .filter(Boolean)
      .sort(
        (a, b) =>
          a._days - b._days ||
          String(a.expired_date).localeCompare(String(b.expired_date))
      );
  }

  /** Selects rows that need renew attention within the next 3 days. */
  function selectNeedRenew(rows) {
    const out = [];
    (rows || []).forEach((r) => {
      const renew = Number.isFinite(+r.renew) ? parseInt(r.renew, 10) : 0;
      if (!Number.isInteger(renew) || renew <= 0) return;

      const duration = Number.isFinite(+r.duration)
        ? parseInt(r.duration, 10)
        : null;
      if (Number.isInteger(duration) && renew >= duration) return;

      const purUTC = toUTC(r.purchased_date);
      if (!purUTC) return;

      const expUTC =
        toUTC(r.expired_date) || computeExpiryUTC(r.purchased_date, duration);

      // Skip if already in "expire soon"
      if (expUTC) {
        const dToExp = within3Days(expUTC);
        if (dToExp !== null) return;
      }

      const due = nextDueFromAnchor(r.purchased_date, renew, todayUTC);
      if (!due) return;

      // Respect last cutoff relative to expiry (can't renew past final expiry window)
      if (expUTC) {
        const lastCutoff = addMonthsUTC(expUTC, -renew);
        if (due > lastCutoff) return;
      }

      if (due < purUTC) return;

      const left = within3Days(due);
      if (left === null) return;

      out.push({
        sale_product: r.sale_product,
        customer: r.customer,
        email: r.email,
        purchased_date: r.purchased_date,
        next_due: ymd(due),
        expiry_ymd: expUTC ? ymd(expUTC) : null,
        left,
        renew,
        store: r.store,
        sale_type: r.sale_type,
      });
    });

    return out.sort(
      (a, b) => a.left - b.left || a.next_due.localeCompare(b.next_due)
    );
  }

  // ------------------------------ Renderers ------------------------------
  /** Renders desktop "Expire Soon" table. */
  function renderExpireSoonDesktop(rows, range = expireRange) {
    const tbody = qs("expire_soon");
    if (!tbody) return;
    tbody.innerHTML = "";

    const soon = selectExpireSoon(rows, range);
    if (soon.length === 0) {
      tbody.appendChild(
        placeholderRow("No subscriptions in the selected date range.")
      );
      return;
    }

    const frag = document.createDocumentFragment();
    soon.forEach((r, i) => {
      const storeClass = getStoreClass(r);
      const tr = document.createElement("tr");
      tr.className = `era-row ${storeClass}`;
      tr.innerHTML = `
        <td class="era-num ${storeClass}">${i + 1}</td>
        <td class="${storeClass}">${r.sale_product ?? "-"}</td>
        <td class="${storeClass}" style="text-align: center;">${r.customer ?? "-"}</td>
        <td class="${storeClass}">${r.email ?? "-"}</td>
        <td class="${storeClass}" style="text-align: center;">${fmtDate(r.purchased_date)}</td>
        <td class="${storeClass}" style="text-align: center;">${fmtDate(r.expired_date)}</td>
        <td class="${storeClass}" style="text-align: right;">${leftLabel(r._days)}</td>
      `;
      frag.appendChild(tr);
    });
    tbody.appendChild(frag);
  }

  /** Renders desktop "Need Renew" table. */
  function renderNeedRenewDesktop(rows) {
    const tbody = qs("need_renew");
    if (!tbody) return;
    tbody.innerHTML = "";

    const out = selectNeedRenew(rows);
    if (out.length === 0) {
      tbody.appendChild(placeholderRow("No renewals due within 3 days."));
      return;
    }

    const frag = document.createDocumentFragment();
    out.forEach((r, i) => {
      const storeClass = getStoreClass(r);
      const tr = document.createElement("tr");
      tr.className = `era-row ${storeClass}`;
      tr.innerHTML = `
        <td class="era-num ${storeClass}">${i + 1}</td>
        <td class="${storeClass}">${r.sale_product ?? "-"}</td>
        <td class="${storeClass}" style="text-align: center;">${r.customer ?? "-"}</td>
        <td class="${storeClass}">${r.email ?? "-"}</td>
        <td class="${storeClass}" style="text-align: center;">${fmtDate(r.purchased_date)}</td>
        <td class="${storeClass}" style="text-align: center;">${fmtDate(r.next_due)}</td>
        <td class="${storeClass}" style="text-align: center;">${fmtDate(r.expiry_ymd)}</td>
        <td class="${storeClass}" style="text-align: right;">${leftLabel(r.left)}</td>
      `;
      frag.appendChild(tr);
    });
    tbody.appendChild(frag);
  }

  /** Renders mobile cards for "Expire Soon". */
  function renderExpireSoonMobile(rows, range = expireRange) {
    const wrap = qs("expired-item");
    if (!wrap) return;
    wrap.innerHTML = "";

    const soon = selectExpireSoon(rows, range);
    if (soon.length === 0) {
      setMobilePlaceholder(wrap, "No subscriptions in the selected date range.");
      return;
    }

    const frag = document.createDocumentFragment();
    soon.forEach((r) => {
      const storeClass = getStoreClass(r);
      const card = document.createElement("div");
      card.className = `subs-card ${storeClass}`;
      card.innerHTML = `
        <div class="subs-row subs-row-top">
          <div class="subs-product">${r.sale_product ?? "-"}</div>
        </div>
        <div class="subs-row subs-name">
          <span class="subs-label">Name:</span>
          <span>${r.customer ?? "-"}</span>
        </div>
        <div class="subs-row subs-email">
          <span class="subs-label">Email:</span>
          <span>${r.email ?? "-"}</span>
        </div>
        <div class="subs-row subs-dates">
          <div class="subs-purchased">
            <span class="subs-label">Purchased:</span>
            <span>${fmtDate(r.purchased_date)}</span>
          </div>
          <div class="subs-expire">
            <span class="subs-label">Expire:</span>
            <span>${fmtDate(r.expired_date)}</span>
          </div>
        </div>
        <div class="subs-row subs-price">
          <span class="subs-label">Day Left:</span>
          <span>${leftLabel(r._days)}</span>
        </div>
      `;
      frag.appendChild(card);
    });
    wrap.appendChild(frag);
  }

  /** Renders mobile cards for "Need Renew". */
  function renderNeedRenewMobile(rows) {
    const wrap = qs("renewal-item");
    if (!wrap) return;
    wrap.innerHTML = "";

    const out = selectNeedRenew(rows);
    if (out.length === 0) {
      setMobilePlaceholder(wrap, "No renewals due within 3 days.");
      return;
    }

    const frag = document.createDocumentFragment();
    out.forEach((r) => {
      const storeClass = getStoreClass(r);
      const card = document.createElement("div");
      card.className = `subs-card ${storeClass}`;
      card.innerHTML = `
        <div class="subs-row subs-row-top">
          <div class="subs-product">${r.sale_product ?? "-"}</div>
          <div class="subs-renew"><span class="subs-label">Every</span><span>${
            r.renew
          }</span><span class="subs-label">Months</span></div>
        </div>
        <div class="subs-row subs-name">
          <span class="subs-label">Name:</span>
          <span>${r.customer ?? "-"}</span>
        </div>
        <div class="subs-row subs-email">
          <span class="subs-label">Email:</span>
          <span>${r.email ?? "-"}</span>
        </div>
        <div class="subs-row subs-dates">
          <div class="subs-purchased">
            <span class="subs-label">Purchased:</span>
            <span>${fmtDate(r.purchased_date)}</span>
          </div>
          <div class="subs-expire">
            <span class="subs-label">Exprie:</span>
            <span>${fmtDate(r.expiry_ymd)}</span>
          </div>
        </div>
        <div class="subs-row subs-dates">
          <div class="subs-purchased">
            <span class="subs-label">Renew at:</span>
            <span>${fmtDate(r.next_due)}</span>
          </div>
          <div class="subs-expire">
            <span class="subs-label">Day Left: </span>
            <span style="font-size: 0.9rem;">${leftLabel(r.left)}</span>
          </div>
        </div>
      `;
      frag.appendChild(card);
    });
    wrap.appendChild(frag);
  }

  /** Computes and renders renewal risk counters. */
  function renderRenewalRisk(rows) {
    const buckets = {
      overdue: 0,
      today: 0,
      next3: 0,
      next7: 0,
    };

    (rows || []).forEach((r) => {
      const expUTC = toUTC(r.expired_date);
      if (!expUTC) return;
      const days = daysBetween(expUTC, todayUTC);

      if (days < 0) buckets.overdue += 1;
      else if (days === 0) buckets.today += 1;
      else if (days >= 1 && days <= 3) buckets.next3 += 1;
      else if (days >= 4 && days <= 7) buckets.next7 += 1;
    });

    const elOverdue = qs("risk_overdue");
    const elToday = qs("risk_today");
    const el3 = qs("risk_3days");
    const el7 = qs("risk_7days");
    if (elOverdue) elOverdue.textContent = String(buckets.overdue);
    if (elToday) elToday.textContent = String(buckets.today);
    if (el3) el3.textContent = String(buckets.next3);
    if (el7) el7.textContent = String(buckets.next7);
  }

  /** Calculates next valid renewal due date for one row. */
  function nextRenewDue(r) {
    const renew = Number.isFinite(+r.renew) ? parseInt(r.renew, 10) : 0;
    if (!Number.isInteger(renew) || renew <= 0) return null;

    const purchaseUTC = toUTC(r.purchased_date);
    if (!purchaseUTC) return null;

    const duration = Number.isFinite(+r.duration) ? parseInt(r.duration, 10) : null;
    const expiryUTC = toUTC(r.expired_date) || computeExpiryUTC(r.purchased_date, duration);

    let due = addMonthsUTC(purchaseUTC, renew);
    while (due < todayUTC) due = addMonthsUTC(due, renew);

    if (expiryUTC) {
      const lastCutoff = addMonthsUTC(expiryUTC, -renew);
      if (due > lastCutoff) return null;
    }
    return due;
  }

  /** Renders forecasted renewal revenue/count for 7 and 30 days. */
  function renderRenewalForecast(rows) {
    const calc = (horizonDays) => {
      const end = addDaysUTC(todayUTC, horizonDays);
      let amount = 0;
      let count = 0;

      (rows || []).forEach((r) => {
        const due = nextRenewDue(r);
        if (!due || due < todayUTC || due > end) return;
        const price = Number(r.price) || 0;
        amount += price;
        count += 1;
      });

      return { amount, count };
    };

    const f7 = calc(7);
    const f30 = calc(30);

    const a7 = qs("forecast_7_amount");
    const c7 = qs("forecast_7_count");
    const a30 = qs("forecast_30_amount");
    const c30 = qs("forecast_30_count");

    if (a7) a7.textContent = fmtMoney(f7.amount);
    if (c7) c7.textContent = `${f7.count} projected renewals`;
    if (a30) a30.textContent = fmtMoney(f30.amount);
    if (c30) c30.textContent = `${f30.count} projected renewals`;
  }

  /** Re-renders all desktop/mobile summary tables and range info. */
  function renderAll() {
    const expireRows = selectExpireSoon(allRows, expireRange);
    renderExpireSoonDesktop(allRows, expireRange);
    renderNeedRenewDesktop(allRows);
    renderExpireSoonMobile(allRows, expireRange);
    renderNeedRenewMobile(allRows);
    setExpireFilterInfo(expireRows.length);
  }

  /** Initializes expire date filter controls and default values. */
  function initExpireFilterControls() {
    const fromInput = qs("expire_from_date");
    const toInput = qs("expire_to_date");
    const applyBtn = qs("expire_filter_apply");
    const defaultBtn = qs("expire_filter_default");
    if (!fromInput || !toInput) return;

    const applyRange = () => {
      const rawFrom = fromInput.value || getDefaultExpireRange().from;
      const rawTo = toInput.value || getDefaultExpireRange().to;
      let from = rawFrom;
      let to = rawTo;

      if (toUTC(from) && toUTC(to) && toUTC(from) > toUTC(to)) {
        [from, to] = [to, from];
      }

      fromInput.value = from;
      toInput.value = to;
      expireRange = { from, to };
      renderAll();
    };

    const resetDefault = () => {
      const d = getDefaultExpireRange();
      expireRange = d;
      fromInput.value = d.from;
      toInput.value = d.to;
      renderAll();
    };

    const d = getDefaultExpireRange();
    fromInput.value = d.from;
    toInput.value = d.to;
    expireRange = d;

    if (applyBtn) applyBtn.addEventListener("click", applyRange);
    if (defaultBtn) defaultBtn.addEventListener("click", resetDefault);
    fromInput.addEventListener("change", applyRange);
    toInput.addEventListener("change", applyRange);
  }

  // ------------------------------ Orchestration ------------------------------
  /** Fetches summary rows from API and performs full render cycle. */
  async function loadAndRender() {
    const tExpire = qs("expire_soon");
    const tRenew = qs("need_renew");

    setLoading(tExpire);
    setLoading(tRenew);

    try {
      const packet = readCachePacket();
      if (packet.data) {
        allRows = packet.data;
        renderAll();

        fetchRowsFromApi(packet.etag)
          .then((result) => {
            if (result.notModified) return;
            writeCachePacket(result.data, result.etag || null);
            allRows = result.data;
            renderAll();
          })
          .catch((err) => console.error("Summary background refresh failed:", err));
        return;
      }

      const result = await fetchRowsFromApi(null);
      const rows = result.data || [];
      writeCachePacket(rows, result.etag || null);
      allRows = rows;
      renderAll();
    } catch (err) {
      console.error("Load failed:", err);

      if (tExpire) {
        tExpire.innerHTML = "";
        tExpire.appendChild(placeholderRow("Failed to load expiring items."));
      }
      if (tRenew) {
        tRenew.innerHTML = "";
        tRenew.appendChild(placeholderRow("Failed to load renewals."));
      }

      setMobilePlaceholder(
        qs("expired-item"),
        "Failed to load expiring items."
      );
      setMobilePlaceholder(qs("renewal-item"), "Failed to load renewals.");
    }
  }

  document.addEventListener("DOMContentLoaded", () => {
    initExpireFilterControls();
    loadAndRender();
  });
})();;
/* deplay_chart.js */
/**
 * Summary KPIs + charts controller.
 * Features:
 * - Period range with quick presets
 * - Comparison mode vs previous equal-length period
 * - KPI drilldown modal
 * - Existing product pies + 30-day line chart
 */
(() => {
  "use strict";

  const API_URL = "api/sales_minimal.php";
  const CACHE_KEY = "summarySalesMinimal:v2";
  const PIE_TOP_ITEMS = 6;
  const DARK_PALETTE = [
    "#3b82f6",
    "#0ea5e9",
    "#14b8a6",
    "#22c55e",
    "#84cc16",
    "#f59e0b",
    "#f97316",
    "#6366f1",
    "#8b5cf6",
    "#a855f7",
    "#ec4899",
    "#64748b",
    "#475569",
    "#2563eb",
    "#0f766e",
    "#1d4ed8",
    "#0891b2",
    "#0ea5e9",
  ];

  const $ = (id) => document.getElementById(id);
  const fmtMoney = (n) =>
    `${new Intl.NumberFormat("en-US", { maximumFractionDigits: 0 }).format(
      Math.round(Number(n) || 0)
    )} Ks`;
  const fmtShort = (ymd) => {
    if (!ymd) return "-";
    const d = new Date(`${ymd}T00:00:00`);
    if (Number.isNaN(d.getTime())) return ymd;
    return d.toLocaleDateString("en-GB", {
      day: "2-digit",
      month: "short",
      year: "numeric",
    });
  };

  const ymd = (date) => {
    const y = date.getFullYear();
    const m = String(date.getMonth() + 1).padStart(2, "0");
    const d = String(date.getDate()).padStart(2, "0");
    return `${y}-${m}-${d}`;
  };

  const fromYmd = (value) => {
    const d = new Date(`${value}T00:00:00`);
    return Number.isNaN(d.getTime()) ? null : d;
  };

  const addDays = (date, days) => {
    const d = new Date(date);
    d.setDate(d.getDate() + days);
    return d;
  };

  const lastNDates = (n = 30) => {
    const out = [];
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    for (let i = n - 1; i >= 0; i -= 1) {
      out.push(addDays(today, -i));
    }
    return out;
  };

  const pickColors = (n) => {
    const count = Math.max(1, n);
    const out = [];
    for (let i = 0; i < count; i += 1) out.push(DARK_PALETTE[i % DARK_PALETTE.length]);
    return out;
  };

  const shortLabel = (value, max = 28) => {
    const s = String(value ?? "");
    if (s.length <= max) return s;
    return `${s.slice(0, max - 1)}…`;
  };

  let rows = [];
  let currentRange = null; // { from, to }
  let compareEnabled = false;

  /** Returns a normalized `{from,to}` date range in `YYYY-MM-DD` order. */
  function normalizeRange(from, to) {
    if (!from || !to) return null;
    const f = fromYmd(from);
    const t = fromYmd(to);
    if (!f || !t) return null;
    if (f <= t) return { from: ymd(f), to: ymd(t) };
    return { from: ymd(t), to: ymd(f) };
  }

  /** Maps a preset key to a concrete date range ending today. */
  function periodFromPreset(preset) {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    switch (preset) {
      case "today":
        return { from: ymd(today), to: ymd(today) };
      case "30d":
        return { from: ymd(addDays(today, -29)), to: ymd(today) };
      case "this_month": {
        const first = new Date(today.getFullYear(), today.getMonth(), 1);
        return { from: ymd(first), to: ymd(today) };
      }
      case "last_month": {
        const first = new Date(today.getFullYear(), today.getMonth() - 1, 1);
        const last = new Date(today.getFullYear(), today.getMonth(), 0);
        return { from: ymd(first), to: ymd(last) };
      }
      case "7d":
      default:
        return { from: ymd(addDays(today, -6)), to: ymd(today) };
    }
  }

  /** Filters sales rows whose `purchased_date` is inside the selected range. */
  function rowsInRange(allRows, range) {
    if (!range) return [];
    return allRows.filter((r) => {
      const d = String(r.purchased_date || "");
      return d >= range.from && d <= range.to;
    });
  }

  /** Builds the immediately previous range with the same day span. */
  function previousRange(range) {
    const from = fromYmd(range.from);
    const to = fromYmd(range.to);
    if (!from || !to) return null;
    const spanDays = Math.round((to - from) / 86_400_000) + 1;
    const prevTo = addDays(from, -1);
    const prevFrom = addDays(prevTo, -(spanDays - 1));
    return { from: ymd(prevFrom), to: ymd(prevTo) };
  }

  /** Aggregates core KPIs for a row set. */
  function computeMetrics(dataRows) {
    let sales = 0;
    let profit = 0;
    let orders = 0;
    for (const r of dataRows) {
      sales += Number(r.price) || 0;
      profit += Number(r.profit) || 0;
      orders += 1;
    }
    const avgProfit = orders > 0 ? profit / orders : 0;
    return { sales, profit, orders, avgProfit };
  }

  /** Computes percent change between current and previous values. */
  function pctChange(current, prev) {
    const c = Number(current) || 0;
    const p = Number(prev) || 0;
    if (p === 0) return c === 0 ? 0 : 100;
    return ((c - p) / Math.abs(p)) * 100;
  }

  /** Renders KPI comparison text and trend color on one KPI card. */
  function setCompare(card, current, prev) {
    const el = card.querySelector(".kpi-compare");
    if (!el) return;

    if (!compareEnabled) {
      el.textContent = "";
      el.classList.remove("up", "down");
      return;
    }

    const pct = pctChange(current, prev);
    const sign = pct >= 0 ? "+" : "";
    el.textContent = `${sign}${pct.toFixed(1)}% vs previous period`;
    el.classList.toggle("up", pct >= 0);
    el.classList.toggle("down", pct < 0);
  }

  /** Computes a 7-day daily series for every KPI. */
  function dailySeriesForSparkline(allRows, days = 7) {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const buckets = new Map();
    for (let i = days - 1; i >= 0; i--) {
      buckets.set(ymd(addDays(today, -i)), { sales: 0, profit: 0, orders: 0 });
    }
    for (const r of allRows) {
      const d = String(r.purchased_date || "");
      const b = buckets.get(d);
      if (!b) continue;
      b.sales += Number(r.price) || 0;
      b.profit += Number(r.profit) || 0;
      b.orders += 1;
    }
    const series = { period_sales: [], period_profits: [], period_orders: [], avg_profit_order: [] };
    for (const [, b] of buckets) {
      series.period_sales.push(b.sales);
      series.period_profits.push(b.profit);
      series.period_orders.push(b.orders);
      series.avg_profit_order.push(b.orders > 0 ? b.profit / b.orders : 0);
    }
    return series;
  }

  /** Renders one card's sparkline as a small SVG polyline. */
  function paintSparkline(card, values) {
    const svg = card.querySelector(".kpi-spark");
    if (!svg) return;
    while (svg.firstChild) svg.removeChild(svg.firstChild);
    if (!values || values.length < 2) return;

    const W = 100;
    const H = 28;
    const pad = 1.5;
    const max = Math.max(...values, 1);
    const min = Math.min(...values, 0);
    const span = max - min || 1;
    const step = (W - pad * 2) / (values.length - 1);

    const pts = values.map((v, i) => {
      const x = pad + step * i;
      const y = H - pad - ((v - min) / span) * (H - pad * 2);
      return [x, y];
    });

    const NS = "http://www.w3.org/2000/svg";
    const linePath = document.createElementNS(NS, "path");
    linePath.setAttribute("class", "spark-line");
    linePath.setAttribute("d", pts.map(([x, y], i) => (i === 0 ? `M${x},${y}` : `L${x},${y}`)).join(" "));

    const areaPath = document.createElementNS(NS, "path");
    areaPath.setAttribute("class", "spark-area");
    const areaD = pts.map(([x, y], i) => (i === 0 ? `M${x},${y}` : `L${x},${y}`)).join(" ")
      + ` L${pts[pts.length - 1][0]},${H} L${pts[0][0]},${H} Z`;
    areaPath.setAttribute("d", areaD);

    const tip = document.createElementNS(NS, "circle");
    tip.setAttribute("class", "spark-tip");
    tip.setAttribute("cx", String(pts[pts.length - 1][0]));
    tip.setAttribute("cy", String(pts[pts.length - 1][1]));
    tip.setAttribute("r", "2.2");

    svg.appendChild(areaPath);
    svg.appendChild(linePath);
    svg.appendChild(tip);

    const last = values[values.length - 1];
    const first = values[0];
    card.dataset.trend = last >= first ? "up" : "down";
  }

  /** Paints KPI cards for the current range and optional comparison period. */
  function renderKPIs(filteredRows) {
    const metrics = computeMetrics(filteredRows);
    const prevRows = rowsInRange(rows, previousRange(currentRange));
    const prevMetrics = computeMetrics(prevRows);
    const sparkSeries = dailySeriesForSparkline(rows, 7);

    document.querySelectorAll(".kpi-card").forEach((card) => {
      const key = card.dataset.kpi;
      const valueEl = card.querySelector(".kpi-value");
      if (!valueEl) return;

      if (key === "period_sales") {
        valueEl.textContent = fmtMoney(metrics.sales);
        setCompare(card, metrics.sales, prevMetrics.sales);
      } else if (key === "period_profits") {
        valueEl.textContent = fmtMoney(metrics.profit);
        setCompare(card, metrics.profit, prevMetrics.profit);
      } else if (key === "period_orders") {
        valueEl.textContent = String(metrics.orders);
        setCompare(card, metrics.orders, prevMetrics.orders);
      } else if (key === "avg_profit_order") {
        valueEl.textContent = fmtMoney(metrics.avgProfit);
        setCompare(card, metrics.avgProfit, prevMetrics.avgProfit);
      }

      paintSparkline(card, sparkSeries[key]);
    });
  }

  /** Destroys an existing Chart.js instance attached to a canvas. */
  function destroyChartOn(canvas) {
    if (canvas && canvas._chart) {
      canvas._chart.destroy();
      canvas._chart = null;
    }
  }

  /** Creates a doughnut chart with shared style options. */
  function buildPie(canvas, title, labels, values, formatter) {
    if (!canvas) return;
    destroyChartOn(canvas);

    const colors = pickColors(labels.length);
    const total = values.reduce((sum, v) => sum + (Number(v) || 0), 0);
    const legendPos = window.matchMedia("(max-width: 1200px)").matches ? "bottom" : "right";
    canvas._chart = new Chart(canvas, {
      type: "doughnut",
      data: {
        labels,
        datasets: [
          {
            data: values,
            backgroundColor: colors,
            borderColor: "rgba(15,23,42,0.8)",
            borderWidth: 2,
            hoverBorderWidth: 2,
            hoverOffset: 3,
          },
        ],
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        cutout: "62%",
        layout: { padding: { left: 8, right: 8, top: 10, bottom: 8 } },
        plugins: {
          title: {
            display: true,
            text: title,
            position: "top",
            color: "#cbd5e1",
            font: { size: 14, weight: "600" },
            padding: { top: 2, bottom: 8 },
          },
          legend: {
            position: legendPos,
            labels: {
              color: "#94a3b8",
              padding: 14,
              boxWidth: 10,
              boxHeight: 10,
              usePointStyle: true,
              pointStyle: "circle",
              font: { size: 12, weight: "500" },
            },
          },
          tooltip: {
            backgroundColor: "rgba(15,23,42,.95)",
            titleColor: "#e2e8f0",
            bodyColor: "#cbd5e1",
            borderColor: "rgba(148,163,184,.3)",
            borderWidth: 1,
            callbacks: {
              label: (ctx) => {
                const raw = Number(ctx.raw || 0);
                const pct = total > 0 ? (raw / total) * 100 : 0;
                return ` ${ctx.label ?? ""}: ${formatter(raw)} (${pct.toFixed(1)}%)`;
              },
            },
          },
        },
      },
    });
  }

  function topEntries(map, metricKey) {
    const sorted = Array.from(map.entries())
      .map(([label, metrics]) => ({ label, value: Number(metrics[metricKey]) || 0 }))
      .filter((item) => item.value > 0)
      .sort((a, b) => b.value - a.value);

    if (!sorted.length) return { labels: ["No data"], values: [1] };

    const head = sorted.slice(0, PIE_TOP_ITEMS);
    const tail = sorted.slice(PIE_TOP_ITEMS);
    const tailTotal = tail.reduce((sum, item) => sum + item.value, 0);
    if (tailTotal > 0) {
      head.push({ label: "Others", value: tailTotal });
    }

    return {
      labels: head.map((item) => shortLabel(item.label)),
      values: head.map((item) => item.value),
    };
  }

  /** Builds per-product pie charts for sales, profit, and order counts. */
  function renderPeriodPies(filteredRows) {
    const agg = new Map();
    for (const r of filteredRows) {
      const key = r.sale_product || "(Unknown)";
      if (!agg.has(key)) agg.set(key, { sales: 0, profit: 0, count: 0 });
      const v = agg.get(key);
      v.sales += Number(r.price) || 0;
      v.profit += Number(r.profit) || 0;
      v.count += 1;
    }

    const salesSet = topEntries(agg, "sales");
    const profitSet = topEntries(agg, "profit");
    const countSet = topEntries(agg, "count");

    const periodLabel = currentRange
      ? `${fmtShort(currentRange.from)} - ${fmtShort(currentRange.to)}`
      : "Selected Period";

    buildPie(
      $("chartDailySales"),
      `Sales by Product (${periodLabel})`,
      salesSet.labels,
      salesSet.values,
      (v) => fmtMoney(v)
    );
    buildPie(
      $("chartDailyProfit"),
      `Profit by Product (${periodLabel})`,
      profitSet.labels,
      profitSet.values,
      (v) => fmtMoney(v)
    );
    buildPie(
      $("chartDailyCount"),
      `Orders by Product (${periodLabel})`,
      countSet.labels,
      countSet.values,
      (v) => String(v)
    );
  }

  /** Renders 30-day daily sales/profit trend lines. */
  function renderLine30(allRows) {
    const canvas = $("salesProfitLine");
    if (!canvas) return;
    destroyChartOn(canvas);

    const days = lastNDates(30);
    const daily = new Map(days.map((d) => [ymd(d), { sales: 0, profit: 0 }]));

    for (const row of allRows) {
      const key = String(row.purchased_date || "");
      if (!daily.has(key)) continue;
      const bucket = daily.get(key);
      bucket.sales += Number(row.price) || 0;
      bucket.profit += Number(row.profit) || 0;
    }

    const labels = days.map((d) =>
      d.toLocaleDateString("en-GB", { day: "2-digit", month: "short" })
    );
    const sales = days.map((d) => daily.get(ymd(d)).sales);
    const profits = days.map((d) => daily.get(ymd(d)).profit);

    canvas._chart = new Chart(canvas.getContext("2d"), {
      type: "line",
      data: {
        labels,
        datasets: [
          {
            label: "Sales (Ks)",
            data: sales,
            borderColor: "#60a5fa",
            backgroundColor: "rgba(96,165,250,.15)",
            tension: 0.3,
            fill: true,
            pointRadius: 0,
            pointHoverRadius: 4,
          },
          {
            label: "Profit (Ks)",
            data: profits,
            borderColor: "#34d399",
            backgroundColor: "rgba(52,211,153,.15)",
            tension: 0.3,
            fill: true,
            pointRadius: 0,
            pointHoverRadius: 4,
          },
        ],
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        interaction: { mode: "index", intersect: false },
        plugins: {
          title: {
            display: true,
            text: "Daily Sales & Profit (Last 30 Days)",
            color: "#fff",
            font: { size: 16, weight: "bold" },
          },
          legend: {
            position: "bottom",
            labels: { color: "#fff", usePointStyle: true, boxWidth: 8 },
          },
        },
        scales: {
          x: { ticks: { color: "#fff", maxTicksLimit: 15 }, grid: { color: "rgba(255,255,255,.10)" } },
          y: { ticks: { color: "#fff" }, grid: { color: "rgba(255,255,255,.10)" } },
        },
      },
    });
  }

  /** Opens the KPI drilldown modal and renders its table rows. */
  function openDrilldown(title, dataRows) {
    const modal = $("kpiDrilldownModal");
    const titleEl = $("kpiDrilldownTitle");
    const body = $("kpi_drilldown_body");
    if (!modal || !titleEl || !body) return;

    titleEl.textContent = title;
    body.innerHTML = "";

    if (!dataRows.length) {
      body.innerHTML = `<tr><td colspan="6" class="era-muted">No data in selected period.</td></tr>`;
    } else {
      dataRows
        .slice()
        .sort((a, b) => String(b.purchased_date).localeCompare(String(a.purchased_date)))
        .forEach((r, i) => {
          const tr = document.createElement("tr");
          tr.innerHTML = `
            <td>${i + 1}</td>
            <td>${r.sale_product ?? "-"}</td>
            <td>${r.customer ?? "-"}</td>
            <td>${fmtShort(r.purchased_date)}</td>
            <td style="text-align:right;">${fmtMoney(r.price)}</td>
            <td style="text-align:right;">${fmtMoney(r.profit)}</td>
          `;
          body.appendChild(tr);
        });
    }

    modal.classList.add("open");
    modal.setAttribute("aria-hidden", "false");
  }

  /** Closes the KPI drilldown modal. */
  function closeDrilldown() {
    const modal = $("kpiDrilldownModal");
    if (!modal) return;
    modal.classList.remove("open");
    modal.setAttribute("aria-hidden", "true");
  }

  /** Applies current date controls, re-renders all KPI widgets, and emits range event. */
  function applyRangeAndRender() {
    const fromInput = $("summary_from_date");
    const toInput = $("summary_to_date");
    if (!fromInput || !toInput) return;

    const normalized = normalizeRange(fromInput.value, toInput.value);
    if (!normalized) return;
    currentRange = normalized;
    fromInput.value = normalized.from;
    toInput.value = normalized.to;

    const filteredRows = rowsInRange(rows, currentRange);
    renderKPIs(filteredRows);
    renderPeriodPies(filteredRows);
    renderLine30(rows);

    // Expose selected period to other summary modules (risk/forecast tables).
    document.dispatchEvent(
      new CustomEvent("summary:period-range", { detail: { range: currentRange } })
    );
  }

  /** Wires range preset, custom date, apply, and compare controls. */
  function initControls() {
    const preset = $("summary_preset");
    const fromInput = $("summary_from_date");
    const toInput = $("summary_to_date");
    const applyBtn = $("summary_apply_range");
    const compareToggle = $("summary_compare_toggle");

    if (!preset || !fromInput || !toInput || !applyBtn || !compareToggle) return;
    // Force disabled default on first load (also prevents browser form-state restore).
    compareToggle.checked = false;
    compareEnabled = false;

    const setRangeByPreset = (presetValue) => {
      const range = periodFromPreset(presetValue);
      fromInput.value = range.from;
      toInput.value = range.to;
      currentRange = range;
    };

    setRangeByPreset(preset.value);

    preset.addEventListener("change", () => {
      if (preset.value !== "custom") {
        setRangeByPreset(preset.value);
        applyRangeAndRender();
      }
    });

    const syncCustomPreset = () => {
      preset.value = "custom";
    };

    fromInput.addEventListener("change", syncCustomPreset);
    toInput.addEventListener("change", syncCustomPreset);
    applyBtn.addEventListener("click", applyRangeAndRender);

    compareToggle.addEventListener("change", () => {
      compareEnabled = !!compareToggle.checked;
      applyRangeAndRender();
    });
  }

  /** Registers KPI-card click handling and modal close interactions. */
  function initDrilldown() {
    const closeBtn = $("kpiDrilldownClose");
    const modal = $("kpiDrilldownModal");
    if (closeBtn) closeBtn.addEventListener("click", closeDrilldown);
    if (modal) {
      modal.addEventListener("click", (e) => {
        if (e.target === modal) closeDrilldown();
      });
    }

    document.querySelectorAll(".kpi-card").forEach((card) => {
      card.style.cursor = "pointer";
      card.addEventListener("click", () => {
        const key = card.dataset.kpi;
        const inRangeRows = rowsInRange(rows, currentRange);
        if (key === "period_sales") {
          openDrilldown("Period Sales Drilldown", inRangeRows);
        } else if (key === "period_profits") {
          openDrilldown("Period Profits Drilldown", inRangeRows);
        } else if (key === "period_orders") {
          openDrilldown("Period Orders Drilldown", inRangeRows);
        } else if (key === "avg_profit_order") {
          openDrilldown("Average Profit / Order Drilldown", inRangeRows);
        }
      });
    });
  }

  function readCachePacket() {
    if (window.__salesMinimalCache && Array.isArray(window.__salesMinimalCache.data)) {
      return window.__salesMinimalCache;
    }
    const raw = sessionStorage.getItem(CACHE_KEY);
    if (!raw) return { data: null, etag: null };
    try {
      const parsed = JSON.parse(raw);
      if (parsed && Array.isArray(parsed.data)) {
        window.__salesMinimalCache = parsed;
        return parsed;
      }
    } catch {}
    return { data: null, etag: null };
  }

  function writeCachePacket(data, etag = null) {
    const packet = { data, etag, ts: Date.now() };
    window.__salesMinimalCache = packet;
    sessionStorage.setItem(CACHE_KEY, JSON.stringify(packet));
  }

  async function fetchRowsFromApi(etag = null) {
    const headers = { Accept: "application/json" };
    if (etag) headers["If-None-Match"] = etag;
    const res = await fetch(API_URL, { headers });
    if (res.status === 304) {
      return { notModified: true, data: null, etag };
    }
    const json = await res.json().catch(() => ({ success: false }));
    if (!res.ok || !json?.success || !Array.isArray(json?.data)) {
      throw new Error(json?.error || `HTTP ${res.status}`);
    }
    return { notModified: false, data: json.data, etag: res.headers.get("ETag") };
  }

  /** Fetches summary rows from API and validates response contract. */
  async function fetchRows() {
    const packet = readCachePacket();
    if (packet.data) {
      fetchRowsFromApi(packet.etag)
        .then((result) => {
          if (result.notModified) return;
          writeCachePacket(result.data, result.etag || null);
        })
        .catch((err) => console.error("Summary chart background refresh failed:", err));
      return packet.data;
    }

    const result = await fetchRowsFromApi(null);
    const rowsData = result.data || [];
    writeCachePacket(rowsData, result.etag || null);
    return rowsData;
  }

  /** Bootstraps controls, drilldown handlers, data load, and first render. */
  async function init() {
    try {
      initControls();
      initDrilldown();

      rows = await fetchRows();
      applyRangeAndRender();
    } catch (err) {
      console.error("Summary load failed:", err);
      document
        .querySelectorAll(".kpi-value")
        .forEach((el) => (el.textContent = el.closest(".kpi-card")?.dataset?.kpi === "period_orders" ? "0" : "0 Ks"));
    }
  }

  document.addEventListener("DOMContentLoaded", init);
})();
