# Tasks

> Keep this file updated. Claude reads it before starting work.

Task format: `- [ ] Description — owner (if known), due (if known)`

---

## In Progress

- [ ] Performance audit of `summary.php` KPI queries — check for missing indexes on `purchased_date`

---

## Backlog

### Admin Dashboard
- [ ] Unify `sales_table.php` + `ws_sales_table.php` into a single endpoint with `?type=retail|wholesale` param
- [ ] Add index on `sale_overview.purchased_date` and `ws_sale_overview.purchased_date` if missing
- [ ] Replace `require __DIR__ . '/dbinfo.php'` in every API file with `Database::connection()` from bootstrap
- [ ] Consistent named params (`:q1` style) across both `sales_table.php` files (retail uses positional `?`, wholesale uses named)
- [ ] Rate-limit `api/login.php` (e.g., fail2ban rule or simple PHP token bucket)
- [ ] Add `last_login_at` update on successful login

### Storefront
- [ ] Review and tighten CSP headers in Apache VirtualHost config

### Bot
- [ ] Add `/help` command listing all available bot commands
- [ ] Move hardcoded renewal window (days before expiry) to `.env` config

### Infrastructure
- [ ] Set up automated RDS snapshot schedule
- [ ] Document manual database backup/restore procedure in `docs/DATABASE.md`

---

## Done

- [x] Merge `sales_overview.js` + `ws_sales_overview.js` into shared `sales_controller.js` factory
- [x] Lazy-load wholesale data (only fetches on first wholesale tab click)
- [x] Remove 1-second artificial loading delay from both sales controllers
- [x] Fix `refreshBtn` double-binding (moved to `add_sales_toggle.js`, single handler)
- [x] Fix `tableWrap` bug (wholesale controller was targeting retail's `.era-table-wrap`)
- [x] Create `CLAUDE.md` with architecture overview and common commands
- [x] Scaffold `docs/` folder with full documentation structure
