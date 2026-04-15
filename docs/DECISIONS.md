# Architectural Decision Records

This file tracks significant technical decisions. Each entry follows the ADR format: context, decision, and consequences.

---

## ADR Template

```
## [YYYY-MM-DD] Decision title
**Status:** Proposed | Accepted | Deprecated | Superseded
**Context:** Why this decision was needed — what problem we were solving.
**Decision:** What was decided and why.
**Consequences:** Trade-offs, limitations, and downstream impact.
```

---

## [2025-01-01] No PHP framework — vanilla PHP with custom core classes

**Status:** Accepted

**Context:** The admin dashboard is a relatively contained internal tool. Pulling in a full framework (Laravel, Symfony) would add Composer dependency management, a steep learning curve, and significant overhead for a codebase that needs to remain easy to deploy on a basic Apache/PHP server.

**Decision:** Use vanilla PHP with a small set of hand-written core classes (`Config`, `Database`, `Http`, `ResponseCache`, `ServiceCatalogStore`) instead of a framework. All are in `app/core/` and bootstrapped via `app/bootstrap.php`.

**Consequences:**
- (+) Zero Composer dependencies; deployment is `git clone` + `.env` file
- (+) Simple mental model — no magic, no service container
- (-) No ORM, no query builder, no DI container — SQL is hand-written in each API file
- (-) No routing layer — each PHP file is its own endpoint, leading to some repetition
- (-) Any new cross-cutting concern (logging, rate limiting) must be added manually

---

## [2025-01-01] Separate retail and wholesale tables rather than a type column

**Status:** Accepted

**Context:** Retail and wholesale sales have slightly different schemas (retail has `store`, wholesale has `quantity`). A single `sales` table with a `type` column and nullable columns was considered.

**Decision:** Maintain parallel tables: `sale_overview` / `ws_sale_overview`, `products_catalog` / `ws_products_catalog`. API endpoints follow a `ws_` prefix convention.

**Consequences:**
- (+) Schema is explicit for each flow — no nullable confusion
- (+) Wholesale-specific queries don't scan or filter retail rows
- (-) All CRUD endpoints, API files, and JS controllers are duplicated — maintenance cost
- (-) Adding a third sales channel would require another full table + endpoint set

---

## [2025-01-01] Denormalised product name in sales tables

**Status:** Accepted

**Context:** Sales records reference products by name string rather than by `product_id` foreign key.

**Decision:** `sale_overview.sale_product` and `ws_sale_overview.sale_product` store the product name at time of sale as a plain VARCHAR, not a FK.

**Consequences:**
- (+) Historical sales records are unaffected by product renaming or deletion
- (+) Simpler insert logic — no join needed to display sales history
- (-) No referential integrity — product names can drift from catalog names over time
- (-) Aggregation by product requires string matching, not ID equality

---

## [2025-01-01] Static storefront written by admin dashboard at filesystem level

**Status:** Accepted

**Context:** The storefront (`digimium.store`) needs to be fast, SEO-friendly, and CDN-cacheable. The content (service cards, images) is managed by admin staff but changes infrequently.

**Decision:** The storefront is fully static HTML. The admin dashboard's Product Showcase page writes to `digimium.store/data/services.json` and `digimium.store/images/services/` directly via `ServiceCatalogStore`. No API or build step is involved for the storefront.

**Consequences:**
- (+) Storefront has zero PHP runtime — pure static file serving, trivially cacheable
- (+) No database required for the public site
- (-) Admin and storefront must share a filesystem (same EC2 instance or NFS mount)
- (-) `DIGIMIUM_STOREFRONT_PATH` must be configured correctly in admin `.env`

---

## [2025-04-15] Lazy-load wholesale sales data

**Status:** Accepted

**Context:** The `sales_overview.php` page was loading both retail and wholesale data on DOMContentLoaded, firing two simultaneous API calls and holding the global loading overlay open until both completed. Users always start on the retail tab.

**Decision:** Wholesale data is not fetched on page load. `ws_sales_overview.js` exposes `window.initWholesaleSales` which `add_sales_toggle.js` calls exactly once when the wholesale tab is first clicked. The 1-second artificial minimum loading delay was also removed.

**Consequences:**
- (+) Page load fires one API call instead of two
- (+) Loading overlay clears as soon as retail data is ready
- (-) First wholesale tab click has a small fetch delay (mitigated by sessionStorage cache on return visits)
