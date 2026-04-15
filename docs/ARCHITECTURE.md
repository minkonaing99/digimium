# Architecture

## Overview

Digimium is a digital subscription sales management platform consisting of three deployable components that share a single MySQL database: a customer-facing storefront (static HTML/JS), an internal PHP admin dashboard, and a Python Telegram bot for operational notifications.

## Tech Stack

| Layer | Technology |
|---|---|
| Admin backend | PHP 8.x (no framework, vanilla) |
| Admin frontend | HTML + CSS + vanilla JavaScript (ES2020) |
| Storefront | Static HTML/CSS/JS — no build step |
| Bot | Python 3.11, python-telegram-bot, APScheduler |
| Database | MySQL 8 (Amazon RDS in production) |
| Query layer | PDO (PHP), PyMySQL / mysql-connector-python (Python) |
| Auth | PHP session + HMAC remember-me cookie; bcrypt passwords |
| Hosting | AWS EC2 (Ubuntu 22.04) + Apache2 + Docker (bot) |
| Caching | `ResponseCache` (PHP in-memory, request-scoped); sessionStorage ETags (JS) |

## Folder Structure

```
digimium/
├── admin.digimium.store/        # PHP admin dashboard
│   ├── index.php                # Login page (entry point)
│   ├── sales_overview.php       # Main operations view (retail + wholesale)
│   ├── product_catalog.php      # Product management
│   ├── product_showcase.php     # Storefront content editor
│   ├── summary.php              # KPI dashboard
│   ├── user_list.php            # User management (owner only)
│   ├── api/                     # JSON API endpoints (session-authenticated)
│   │   ├── session_bootstrap.php  # Hardened session setup (required first)
│   │   ├── auth.php               # auth_require_login() helper + role checks
│   │   ├── dbinfo.php             # PDO connection bootstrapper
│   │   ├── sale_*.php             # Retail sales CRUD
│   │   ├── ws_sale_*.php          # Wholesale sales CRUD
│   │   ├── product_*.php          # Retail product CRUD
│   │   ├── ws_product_*.php       # Wholesale product CRUD
│   │   ├── user_*.php             # User management
│   │   └── login.php / logout.php
│   ├── api_json/                # Storefront JSON management endpoints
│   │   ├── get_services.php
│   │   ├── add_service.php
│   │   ├── save_services.php
│   │   └── delete_service.php
│   ├── app/                     # Core application classes
│   │   ├── bootstrap.php        # Single include for all pages/endpoints
│   │   └── core/
│   │       ├── Config.php       # .env parser + typed accessors
│   │       ├── Database.php     # Lazy singleton PDO connection
│   │       ├── Http.php         # Method/JSON helpers
│   │       ├── ResponseCache.php# Request-scoped response cache
│   │       └── ServiceCatalogStore.php  # Storefront JSON read/write
│   ├── js/
│   │   ├── sales_controller.js  # Shared table/card factory (retail + wholesale)
│   │   ├── sales_overview.js    # Retail config wrapper
│   │   ├── ws_sales_overview.js # Wholesale config wrapper (lazy-loaded)
│   │   ├── sales_add_form.js    # Retail add-sale form
│   │   ├── ws_sales_add_form.js # Wholesale add-sale form
│   │   └── add_sales_toggle.js  # Tab switching + lazy wholesale init
│   └── style/                   # Minified CSS
│
├── digimium.store/              # Static customer-facing storefront
│   ├── index.html
│   ├── data/services.json       # Written by admin Product Showcase
│   └── images/services/         # Written by admin Product Showcase
│
├── digimium-bot/                # Python Telegram bot
│   ├── digimium_dashboard.py    # Entry point, scheduler setup
│   ├── handlers.py              # Telegram command/callback handlers
│   ├── db.py                    # All MySQL queries
│   ├── notifications.py         # Scheduled message formatters
│   ├── auth.py                  # Per-user bot authentication
│   ├── config.py                # .env loader + validated env vars
│   └── Dockerfile
│
└── deploy/                      # Deployment docs and config
    ├── DEPLOY_EC2_RDS_APACHE.md
    ├── apache/                  # Apache VirtualHost configs
    ├── htaccess/                # .htaccess files
    └── new database.sql         # Schema migrations (incremental)
```

## Request Lifecycle

### Admin page request
1. Browser → Apache → `sales_overview.php`
2. PHP requires `api/session_bootstrap.php` → starts hardened session
3. PHP requires `api/auth.php` → `auth_require_login()` checks session, fingerprint, idle timeout, absolute timeout
4. Page HTML is rendered and returned; JS files load
5. `sales_controller.js` / `sales_overview.js` fire `loadSales()` on DOMContentLoaded
6. JS hits `api/sales_table.php?limit=500` — PHP validates session again, builds ETag from DB fingerprint, checks `ResponseCache`, queries MySQL, returns paginated JSON
7. JS stores response in `sessionStorage` with ETag; re-renders on resize/search

### Wholesale data — lazy
Wholesale data (`api/ws_sales_table.php`) is only fetched when the Wholesale tab is first clicked. `add_sales_toggle.js` calls `window.initWholesaleSales()` once.

### Storefront content update
Admin edits in Product Showcase → `api_json/save_services.php` → `ServiceCatalogStore::write()` → atomic tmp→rename write to `digimium.store/data/services.json`. Static storefront reads this JSON on next page load.

### Bot request
Telegram → python-telegram-bot webhook/polling → `handlers.py` → `db.py` (PyMySQL) → same RDS MySQL. Scheduled notifications run via APScheduler at a fixed Bangkok-TZ time daily.

## Key Design Decisions

See [DECISIONS.md](./DECISIONS.md) for full ADR log.

- No PHP framework — small surface area, no Composer, simpler deployment
- Dual retail/wholesale tables rather than a type column — avoids schema coupling
- `ResponseCache` + DB fingerprint ETag — avoids full-table scans on cache hits
- Storefront is pure static — no PHP runtime, CDN-cacheable, zero auth surface
- Bot auth is separate from web auth (`bot_users` table + per-session password)
