# Remaining Work — admin.digimium.store

Items fixed across prior sessions are NOT listed here. This file only tracks what is still open.

---

## Infrastructure

### DB Migration: run these files on production

Both migrations have been applied to the **local** development database (`digimium_admin` on 127.0.0.1). They still need to be run on the Hostinger production database.

**Run in order:**
```bash
# 1. Remember-me server-side revocation table
mysql -u YOUR_USER -p YOUR_DB < db/migrations/001_remember_tokens.sql

# 2. Cursor pagination indexes
mysql -u YOUR_USER -p YOUR_DB < db/migrations/002_cursor_indexes.sql
```

**Notes:**
- Migration 002 uses `CREATE INDEX IF NOT EXISTS` which requires MySQL 8.0.29+. On older versions, drop the `IF NOT EXISTS` clause manually, or run `CREATE INDEX idx_cursor_pagination ON sale_overview (purchased_date DESC, sale_id DESC);` and ignore the duplicate-key error if the index already exists.
- If `sale_overview` or `ws_sale_overview` is a VIEW, `ALTER TABLE` will fail. Run `SHOW CREATE VIEW sale_overview` to find the underlying base table and index that instead.

### Asset build on deploy

After deploy, SSH into Hostinger and run:
```bash
php bin/build_assets.php
```
This concatenates `style/*.min.css` and `js/*.js` into `style/bundles/` and `js/bundles/`. Pages auto-fall back to source files if a bundle is missing, but bundles are required for the request-count reduction.

### Cron job

Add via hPanel -> Advanced -> Cron Jobs (see `docs/hostinger_ops.md` for the full snippet):
```
0 * * * * /usr/bin/php /home/USER/.../bin/cache_clean.php 3600
```

---

## Security: Manual Action Required

**DB password rotation** — the password `Tkhantnaing1` is reused on the Hostinger production database and must be rotated there:

```sql
ALTER USER 'your_db_user'@'localhost' IDENTIFIED BY 'new_strong_password';
FLUSH PRIVILEGES;
```

Then update production `.env`:
```
DIGIMIUM_DB_PASS=new_strong_password
```

(Local `.env` keeps the convenience password.)

---

## What Was Fixed (reference)

| # | Item | Session |
|---|------|---------|
| 1-5 | Initial security fixes (details lost to context) | Session 1 |
| 6 | REMEMBER_SECRET validated at bootstrap | Session 2 |
| 7+8 | All 25 API files migrated from global $pdo to Database::connection() | Session 2 |
| 9 | SHOW COLUMNS removed from product/sales writes | Session 2 |
| 10 | sales_minimal.php pushes date filter to SQL | Session 2 |
| 11 | Dead server-side LIKE search removed from sales_table.php / ws_sales_table.php | Session 2 |
| 12 | ip_mask() with IPv6 /64 masking in auth.php + remember.php | Session 2 |
| 13 | Remember-me tokens stored in DB (split-token, rotation, logout revocation) | Session 2 |
| 14 | CSRF token cleared after login to force rotation | Session 2 |
| 15 | Config::parseEnv() handles quoted values and inline comments | Session 2 |
| 19 | sale_update_inline.php uses static column map, not user-supplied string | Session 2 |
| 21 | CSRF check extended to PUT/PATCH/DELETE (not just POST) | Session 2 |
| 25 | loading.js stripped from 12KB to ~80 lines; showLoader/hideLoader moved from inline script | Session 2 |
| 29 | .htaccess HTTPS redirect enabled (handles direct TLS + proxy X-Forwarded-Proto) | Session 2 |
| 30 | Content-Security-Policy header added; inline script in sales_overview.php removed | Session 2 |
| 31 | Redundant Cache-Control for PHP files removed from .htaccess | Session 2 |
| 33 | db/migrations/002_cursor_indexes.sql created (needs to be run) | Session 2 |
| 18 | product_update.php no-op UPDATE detection via pre-flight SELECT | Session 3 |
| 22 | filemtime() cache-busting on all JS script tags in all PHP pages | Session 3 |
| 23 | csrf.js monkey-patch replaced with window.csrfFetch(); all 8 JS files migrated | Session 3 |
| 24 | modal.js created; all confirm()/alert() replaced with showConfirm()/showAlert() | Session 3 |
| 27 | sales_module_factory.js extracted; sales_overview.js + ws_sales_overview.js become thin wrappers (~2100 lines → ~790); double refreshBtn/search listener bugs fixed | Session 4 |
| 28 | ProductRepository + SaleRepository extracted; all 19 endpoint pairs become thin dispatchers | Session 3 |
