# Remaining Work — admin.digimium.store

Items fixed across prior sessions are NOT listed here. This file only tracks what is still open.

---

## Infrastructure

### DB Migration: run these files

Two migrations were created during the hardening work. They have NOT been run against the database yet.

**Run in order:**
```bash
# 1. Remember-me server-side revocation table
mysql -u YOUR_USER -p YOUR_DB < db/migrations/001_remember_tokens.sql

# 2. Cursor pagination indexes
mysql -u YOUR_USER -p YOUR_DB < db/migrations/002_cursor_indexes.sql
```

**Note on migration 002:** `sale_overview` and `ws_sale_overview` may be database VIEWs rather than base tables. If `ALTER TABLE` fails, run `SHOW CREATE VIEW sale_overview` to find the underlying table name and add the index there instead.

---

## Security: Manual Action Required

**DB password rotation** — the password `Tkhantnaing1` visible in `.env` must be rotated directly in MySQL. This cannot be done in code. Steps:

```sql
ALTER USER 'your_db_user'@'localhost' IDENTIFIED BY 'new_strong_password';
FLUSH PRIVILEGES;
```

Then update `.env`:
```
DB_PASS=new_strong_password
```

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
