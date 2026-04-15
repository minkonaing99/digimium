# Database

## Overview

- **Engine:** MySQL 8 (Amazon RDS in production; local MySQL for development)
- **Query layer:** PDO (PHP, `Database::connection()` singleton), PyMySQL / mysql-connector-python (bot)
- **Charset:** `utf8mb4` / `utf8mb4_unicode_ci`
- **Schema migrations:** Manual SQL files in `deploy/new database.sql` (incremental `ALTER TABLE` statements)

## Tables

| Table | Purpose | Key Fields |
|---|---|---|
| `sale_overview` | Retail subscription sales records | `sale_id`, `sale_product`, `customer`, `purchased_date`, `expired_date`, `price`, `profit`, `store` |
| `ws_sale_overview` | Wholesale subscription sales records | `sale_id`, `sale_product`, `customer`, `quantity`, `purchased_date`, `expired_date`, `price`, `profit` |
| `products_catalog` | Retail product definitions | `product_id`, `product_name`, `duration`, `renew`, `supplier`, `wholesale`, `retail`, `store` |
| `ws_products_catalog` | Wholesale product definitions | `product_id`, `product_name`, `duration`, `renew`, `supplier`, `wholesale`, `retail` |
| `users` | Admin dashboard accounts | `user_id`, `username`, `pass_hash`, `role`, `is_active`, `last_login_at` |
| `bot_users` | Telegram bot authenticated sessions | `id`, `username` (Telegram user ID + name) |

## Column Details

### `sale_overview`

| Column | Type | Notes |
|---|---|---|
| `sale_id` | INT AUTO_INCREMENT PK | |
| `sale_product` | VARCHAR(255) | Product name at time of sale |
| `duration` | INT | Subscription length in months |
| `renew` | INT | Renewal period in months (0/1/2/3/4/5/6/12) |
| `customer` | VARCHAR(255) | Customer name |
| `email` | VARCHAR(255) | Customer email (nullable) |
| `purchased_date` | DATE | |
| `expired_date` | DATE | Computed from purchased_date + duration |
| `manager` | VARCHAR(255) | Staff member who made the sale (nullable) |
| `note` | TEXT | Free-text notes (nullable) |
| `price` | DECIMAL(10,2) | Sale price in Kyat |
| `profit` | DECIMAL(10,2) | Profit in Kyat |
| `store` | TINYINT | 0=Void, 1=Digimium, 2=D Mar Wal, 3=Ember, 4=Violet, 5=Void |

### `ws_sale_overview`

Same as `sale_overview` minus `store`, plus:

| Column | Type | Notes |
|---|---|---|
| `quantity` | INT | Number of units sold wholesale |

### `products_catalog`

| Column | Type | Notes |
|---|---|---|
| `product_id` | INT AUTO_INCREMENT PK | |
| `product_name` | VARCHAR(255) | |
| `duration` | INT | Default duration in months |
| `renew` | INT | Default renew period |
| `supplier` | VARCHAR(255) | Supplier name |
| `wholesale` | DECIMAL(10,2) | Wholesale cost price |
| `retail` | DECIMAL(10,2) | Retail sale price |
| `note` | TEXT | (nullable) |
| `link` | VARCHAR(500) | Supplier or product link (nullable) |
| `store` | TINYINT | Store filter (nullable, same enum as sales) |

### `ws_products_catalog`

Same as `products_catalog` without `store`.

### `users`

| Column | Type | Notes |
|---|---|---|
| `user_id` | INT AUTO_INCREMENT PK | |
| `username` | VARCHAR(100) UNIQUE | |
| `pass_hash` | VARCHAR(255) | bcrypt hash |
| `role` | ENUM or VARCHAR | `owner`, `admin`, `staff` |
| `is_active` | TINYINT(1) | 0 = disabled |
| `last_login_at` | DATETIME | Updated on successful login |

### `bot_users`

| Column | Type | Notes |
|---|---|---|
| `id` | BIGINT PK | Telegram user ID |
| `username` | VARCHAR(255) | Telegram display name |

## Relationships

- `sale_overview.sale_product` and `ws_sale_overview.sale_product` are **denormalised strings**, not foreign keys to `products_catalog`. This is intentional — product names at time of sale are preserved even if the product is later renamed or deleted.
- No foreign keys between `users` and `sale_overview.manager` — manager is a free-text field.
- No foreign keys between `bot_users` and `users` — bot auth is entirely separate from web auth.

## Migration Strategy

There is no migration framework. Schema changes are applied as incremental SQL statements.

**To run migrations:**
```bash
mysql -h <RDS_ENDPOINT> -u <DB_USER> -p <DB_NAME> < "deploy/new database.sql"
```

**To set up a fresh database:**
1. Create the database in RDS or locally
2. Restore from the latest `database_backup.rar` in the repo root (if present), **or**
3. Run the initial CREATE TABLE statements (reconstruct from column info above if the backup is unavailable)
4. Apply `deploy/new database.sql` for incremental migrations

**Recommended:** Keep `deploy/new database.sql` as a running changelog of `ALTER TABLE` / `CREATE TABLE` statements, newest at the bottom.

## Seeding

No automated seed scripts. To create the first `owner` account:
```sql
INSERT INTO users (username, pass_hash, role, is_active)
VALUES ('owner', '<bcrypt_hash>', 'owner', 1);
```
Generate `<bcrypt_hash>` with PHP: `password_hash('your-password', PASSWORD_BCRYPT)`
