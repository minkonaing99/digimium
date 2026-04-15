# Version History

Format follows [Keep a Changelog](https://keepachangelog.com/en/1.0.0/).

Current version: **2.0.0**

---

## [Unreleased]

---

## [2.0.0] — 2026-04-15

### Added
- `js/sales_controller.js` — shared factory replacing two near-identical 700-line files
- `docs/` folder with full project documentation (ARCHITECTURE, API, DATABASE, DECISIONS, TASKS, VERSION, SETUP, STYLEGUIDE)

### Changed
- `js/sales_overview.js` — rewritten as thin config wrapper (~69 lines) using `createSalesController`
- `js/ws_sales_overview.js` — rewritten as thin config wrapper (~27 lines); now lazy-loaded
- `js/add_sales_toggle.js` — added lazy wholesale init, consolidated `refreshBtn` handler
- `sales_overview.php` — added `sales_controller.js` script tag

### Fixed
- Wholesale data was fetched on every page load even when users never visit that tab
- 1-second artificial minimum loading delay held the spinner unnecessarily
- `refreshBtn` was double-bound; clicking refresh on the wholesale tab also silently refreshed retail
- Wholesale controller was targeting retail's `.era-table-wrap` (wrong DOM element)
- Wholesale `applySearchRender` could incorrectly trigger even when retail tab was active

---

## [0.1.0] — 2025-01-01

### Added
- Initial platform: admin dashboard, customer storefront, Telegram bot
- Retail and wholesale sales management (CRUD, inline editing, CSV export)
- Product catalog management (retail + wholesale)
- Product showcase editor syncing to storefront JSON
- Summary dashboard with KPI cards, date-range filters, expiry tracking
- Role-based access: `owner`, `admin`, `staff`
- Session auth with remember-me cookie, bcrypt passwords, session fingerprinting
- Telegram bot: `/summary`, `/expiring`, `/renewals` commands + daily scheduled notifications
- Docker container for bot deployment
- AWS EC2 + RDS deployment guide
