# Hostinger Operations

Operational notes for running admin.digimium.store on Hostinger Business shared hosting.

## Cron jobs

Add via hPanel -> Advanced -> Cron Jobs. Replace `USER` and the project path with the real deployment path under `/home/USER/`.

### Hourly cache + expired token cleanup
```
0 * * * * /usr/bin/php /home/USER/domains/admin.digimium.store/public_html/bin/cache_clean.php 3600 >/dev/null 2>&1
```

- Removes entries in `app/cache/response/` older than 3600 seconds.
- Enforces a hard per-shard file cap (defined in `app/core/ResponseCache.php::MAX_FILES_PER_SHARD`).
- Removes stray `*.tmp` files left by interrupted writes.
- Deletes expired rows from `remember_tokens`.

### Why this matters on shared hosting

- Hostinger Business: ~400k inode soft cap. The previous flat cache directory could grow unbounded.
- Cron evicts stale entries cheaply (one process per hour) rather than relying solely on the opportunistic in-request sweep.

## File locations created by the app

- `app/cache/response/{2-char-shard}/{sha256}.json` - short-lived JSON response cache.
- `app/cache/version/{bucket}.v` - empty marker files whose mtime is the cache bucket version. Mutating endpoints `touch` the marker; read endpoints `stat` it instead of running `SELECT MAX(sale_id)`.

Both directories are auto-created with mode 0755 on first write. Both are denied to web requests by `.htaccess` (`RewriteRule ^app(/|$) - [F,L]`). `bin/`, `db/`, and `docs/` are similarly denied.

## Deploy checklist

Every deploy:

```bash
ssh USER@HOST
cd ~/domains/admin.digimium.store/public_html
php bin/build_assets.php
```

`bin/build_assets.php` concatenates per-page CSS and JS into `style/bundles/*.css` and `js/bundles/*.js`. Without this step, pages fall back to loading individual source files (still works, just more HTTP requests).

## Self-hosted assets

- `assets/fonts/IBMPlexSans-{Regular,SemiBold}.woff2` — Google Fonts replaced with self-hosted files (~40 KB total). Drops the `fonts.googleapis.com` connect that would otherwise violate the strict CSP and add an extra RTT.
- `vendor/chart.umd.min.js` — Chart.js 4.4.1 UMD, used by the Summary page. Self-hosted so `script-src 'self'` covers it.

## Migrations not yet run on production

See `BACKLOG.md`. Both `001_remember_tokens.sql` and `002_cursor_indexes.sql` need to be applied to the Hostinger DB (already run locally).

## OPcache

Verify on Hostinger:
```
php -i | grep -i opcache.enable
```

Recommended values (request via hPanel PHP options if defaults differ):
- `opcache.enable=1`
- `opcache.memory_consumption=128`
- `opcache.max_accelerated_files=10000`
- `opcache.validate_timestamps=1`
- `opcache.revalidate_freq=60`

## CSP

`.htaccess` ships a strict Content-Security-Policy:

```
Content-Security-Policy: default-src 'self'; script-src 'self'; style-src 'self' 'unsafe-inline'; img-src 'self' data:; font-src 'self'; connect-src 'self'; object-src 'none'; frame-ancestors 'none'; base-uri 'self'; form-action 'self'
```

If you add a third-party script or font, add it both to the corresponding directive **and** to a self-hosted copy under `vendor/` or `assets/`. Avoid inline `<script>` — `script-src 'self'` will block it.
