# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

This is a **digital subscription management system** with three connected components:

1. **`digimium.store/`** — Customer-facing HTML/CSS/JS storefront (static, no build step)
2. **`admin.digimium.store/`** — PHP admin dashboard (Apache, PHP, MySQL via PDO)
3. **`digimium-bot/`** — Python Telegram bot (Docker, python-telegram-bot, APScheduler)

These are deployed together on a single EC2 instance (Ubuntu + Apache2) with Amazon RDS MySQL. The admin and storefront share the filesystem: the admin writes `digimium.store/data/services.json` and `digimium.store/images/services/` directly.

---

## Running the Bot Locally

```bash
cd digimium-bot
cp .env.example .env   # fill in BOT_TOKEN, BOT_PASSWORD, CHANNEL_ID, DB_*
pip install -r requirements.txt
python digimium_dashboard.py
```

Or via Docker:

```bash
docker build -t digimium-bot .
docker run --env-file .env digimium-bot
```

## Running the Admin (PHP) Locally

Requires Apache + PHP with `php-mysql`, `php-mbstring`, `php-xml`. Configure a `.env` file in `admin.digimium.store/`:

```dotenv
DIGIMIUM_DB_HOST=localhost
DIGIMIUM_DB_PORT=3306
DIGIMIUM_DB_NAME=digimium
DIGIMIUM_DB_USER=root
DIGIMIUM_DB_PASS=secret
DIGIMIUM_REMEMBER_SECRET=<long_random_string>
DIGIMIUM_STOREFRONT_PATH=/path/to/digimium.store
DIGIMIUM_STOREFRONT_PUBLIC_URL=http://localhost
APP_ENV=development
APP_DEBUG=true
```

Point Apache's document root at `admin.digimium.store/` and `digimium.store/` respectively.

## Database Setup

```bash
mysql -h <HOST> -u <USER> -p <DB_NAME> < "deploy/new database.sql"
```

---

## Architecture

### PHP Admin (`admin.digimium.store/`)

- **Entry point**: `index.php` (login) → pages: `sales_overview.php`, `product_catalog.php`, `product_showcase.php`, `summary.php`, `user_list.php`
- **Bootstrap**: every PHP file requiring DB or config includes `app/bootstrap.php` which initializes `Digimium\Core\Config` (parses `.env`), `Database` (lazy singleton PDO), `Http`, `ResponseCache`, `ServiceCatalogStore`
- **API endpoints** live in `api/` — they are called via `fetch()` from JS in the page files
  - Retail endpoints: `sale_insertion.php`, `sale_update_inline.php`, `sale_delete.php`, `sales_table.php`, etc.
  - Wholesale endpoints: `ws_sale_insertion.php`, `ws_sale_update_inline.php`, etc. (prefix `ws_`)
  - Product showcase (storefront sync): `api_json/add_service.php`, `delete_service.php`, `get_services.php`, `save_services.php`
- **Session auth**: `api/session_bootstrap.php` hardened sessions; `api/remember.php` handles remember-me cookies; role check in `api/auth.php`
- **Storefront sync**: `ServiceCatalogStore` reads/writes `digimium.store/data/services.json` using an atomic tmp→rename pattern. Path is configured via `DIGIMIUM_STOREFRONT_PATH`

### Python Bot (`digimium-bot/`)

- **Entry**: `digimium_dashboard.py` — builds the `ApplicationBuilder`, registers handlers, schedules daily notifications via APScheduler (Bangkok TZ)
- **Handlers**: `handlers.py` — all command/callback handlers; bot-level auth (`auth.py` tracks authenticated Telegram user IDs in DB)
- **DB queries**: `db.py` — all MySQL queries (PyMySQL); exposes `get_summary_data`, `get_expiring_soon_products`, `get_renewals_due_soon`, etc.
- **Notifications**: `notifications.py` — formats and sends scheduled messages

### Storefront (`digimium.store/`)

- Pure static HTML/CSS/JS — no build process
- `data/services.json` is the sole data source: array with `popular[]` and `other[]` keys, each item has `name`, `badges`, `price` (keyed by duration), `features`, `description`, `photo_url`
- SEO assets: `sitemap.xml`, `robots.txt`, structured data embedded in `index.html`

---

## Key Env Variables

| Variable | Used By | Purpose |
|---|---|---|
| `DIGIMIUM_DB_*` | PHP admin | DB connection |
| `DIGIMIUM_STOREFRONT_PATH` | PHP admin | Path to `digimium.store/` on disk |
| `DIGIMIUM_REMEMBER_SECRET` | PHP admin | HMAC secret for remember-me cookies |
| `DIGIMIUM_SESSION_SECURE` | PHP admin | Set `true` in production (HTTPS) |
| `BOT_TOKEN` | Python bot | Telegram bot token |
| `BOT_PASSWORD` | Python bot | Password users enter to authenticate with the bot |
| `CHANNEL_ID` | Python bot | Telegram channel for scheduled notifications |
| `DB_HOST/USER/PASSWORD/NAME` | Python bot | DB connection (separate from PHP naming) |

---

## JS Architecture (`admin.digimium.store/js/`)

- **`sales_controller.js`** — shared factory `createSalesController(cfg)` used by both retail and wholesale. Contains all table/card rendering, inline editing, search, caching, and delete logic.
- **`sales_overview.js`** — thin retail config wrapper (~69 lines). Loads on DOMContentLoaded.
- **`ws_sales_overview.js`** — thin wholesale config wrapper (~27 lines). **Lazy-loaded** — exposes `window.initWholesaleSales` which `add_sales_toggle.js` calls on the first wholesale tab click.
- **`add_sales_toggle.js`** — tab switching, lazy wholesale init, and the single `refreshBtn` handler.

Load order in `sales_overview.php`: `loading.js` → `nav.js` → `sales_controller.js` → `add_sales_toggle.js` → `sales_overview.js` → `sales_add_form.js` → `ws_sales_overview.js` → `ws_sales_add_form.js`

---

## Documentation

Full docs are in `docs/`:

| File | Contents |
|---|---|
| `docs/ARCHITECTURE.md` | System overview, folder structure, request lifecycle |
| `docs/API.md` | All endpoints, request/response shapes, auth |
| `docs/DATABASE.md` | Tables, columns, relationships, migrations |
| `docs/DECISIONS.md` | Architectural Decision Records (ADRs) |
| `docs/TASKS.md` | In progress / backlog / done |
| `docs/VERSION.md` | Changelog (current: v2.0.0) |
| `docs/SETUP.md` | Local setup, env vars, common errors |
| `docs/STYLEGUIDE.md` | Naming, file length, formatting rules |

---

## Deployment

See `deploy/DEPLOY_EC2_RDS_APACHE.md` for full AWS EC2 + RDS setup. Apache vhost configs are in `deploy/apache/`. `.htaccess` rules are in `deploy/htaccess/`.

The bot is deployed as a Docker container (separate from Apache). It connects to the same RDS instance.
