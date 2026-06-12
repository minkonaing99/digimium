# Local Development

Run the admin panel locally against a MySQL database, using PHP's built-in web server.

## Prerequisites

- PHP 8.4+ (the project relies on `readonly` properties and other 8.4 features).
- MySQL 8 or compatible (MariaDB 10.6+ works for everything except `CREATE INDEX IF NOT EXISTS`).
- macOS / Linux. Windows works under WSL.

Verify:
```bash
php --version
mysql --version
```

## 1. Start MySQL

Example, MySQL installed under `/usr/local/mysql-9.6.0-macos15-arm64/`:
```bash
sudo /usr/local/mysql-9.6.0-macos15-arm64/support-files/mysql.server start
```

Confirm:
```bash
mysql -u root -p -e "SHOW DATABASES;"
```

## 2. Create the database

```sql
CREATE DATABASE digimium_admin CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
```

Load whatever production-derived dump you keep locally. The expected tables are:
- `bot_users`
- `products_catalog`
- `sale_overview`
- `users`
- `ws_products_catalog`
- `ws_sale_overview`

## 3. Run migrations

```bash
mysql -u root -p digimium_admin < db/migrations/001_remember_tokens.sql
mysql -u root -p digimium_admin -e "CREATE INDEX idx_cursor_pagination ON sale_overview (purchased_date DESC, sale_id DESC);"
mysql -u root -p digimium_admin -e "CREATE INDEX idx_cursor_pagination ON ws_sale_overview (purchased_date DESC, sale_id DESC);"
```

Migration 002 uses `IF NOT EXISTS` which some MySQL versions don't accept. The inline `CREATE INDEX` above is portable.

## 4. Create `.env`

```dotenv
DIGIMIUM_DB_HOST=127.0.0.1
DIGIMIUM_DB_PORT=3306
DIGIMIUM_DB_NAME=digimium_admin
DIGIMIUM_DB_USER=root
DIGIMIUM_DB_PASS=YourPasswordHere

DIGIMIUM_REMEMBER_SECRET=local-dev-secret-change-me-in-production-1234567890abcdef

DIGIMIUM_SESSION_NAME=ERASESSID
DIGIMIUM_SESSION_SAMESITE=Lax
DIGIMIUM_SESSION_SECURE=false
DIGIMIUM_SESSION_MAX_LIFETIME=28800
```

`DIGIMIUM_SESSION_SECURE=false` is required because the PHP built-in server does not serve HTTPS.

## 5. Build asset bundles

```bash
php bin/build_assets.php
```

This concatenates per-page CSS and JS into `style/bundles/` and `js/bundles/`. Re-run after any CSS or JS source change.

## 6. Start the PHP built-in server

```bash
php -S 127.0.0.1:8888 -t .
```

Open <http://127.0.0.1:8888>.

## Caveats

- The PHP built-in server ignores `.htaccess`. The HTTPS redirect, CSP header, mod_deflate, mod_expires, and the `Deny app/`/`bin/` rules do not apply locally. Behavior on Hostinger / Apache will differ.
- Browser session cookies are tied to `127.0.0.1`. Switching between `localhost` and `127.0.0.1` will log you out.
- The cache marker files live under `app/cache/`. These are runtime data and are gitignored.

## Useful commands

```bash
# Tail the PHP server log
tail -f /tmp/digimium-php.log

# Smoke-test the autoloader and DB connection
php -r 'require "app/bootstrap.php"; var_dump(Digimium\Core\Database::connection()->query("SELECT 1")->fetch());'

# Manual cache sweep
php bin/cache_clean.php 3600
```
