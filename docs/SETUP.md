# Setup Guide

## Prerequisites

| Requirement | Version | Used By |
|---|---|---|
| PHP | 8.1+ | Admin dashboard |
| Apache2 | 2.4+ | Web server |
| PHP extensions | `php-mysql`, `php-mbstring`, `php-xml` | Admin dashboard |
| MySQL | 8.0+ | All components |
| Python | 3.11+ | Telegram bot |
| Docker | 20.10+ | Bot deployment (optional) |

No Composer. No Node.js. No build step.

---

## Local Development

### 1. Clone the repo

```bash
git clone <YOUR_REPO_URL> digimium
cd digimium
```

### 2. Set up Apache virtual hosts

Point two virtual hosts to the project directories:

```
DocumentRoot /path/to/digimium/admin.digimium.store   → admin.digimium.store (or localhost:8080)
DocumentRoot /path/to/digimium/digimium.store          → digimium.store (or localhost:8081)
```

See `deploy/apache/` for production VirtualHost configs. Copy `.htaccess` files from `deploy/htaccess/`.

### 3. Configure the admin environment

```bash
cd admin.digimium.store
cp .env.example .env    # if example exists, otherwise create manually
```

Minimum required `.env`:

```dotenv
DIGIMIUM_DB_HOST=127.0.0.1
DIGIMIUM_DB_PORT=3306
DIGIMIUM_DB_NAME=digimium
DIGIMIUM_DB_USER=root
DIGIMIUM_DB_PASS=secret

DIGIMIUM_REMEMBER_SECRET=<at-least-32-random-chars>
DIGIMIUM_STOREFRONT_PATH=/absolute/path/to/digimium/digimium.store

DIGIMIUM_SESSION_NAME=ERASESSID
DIGIMIUM_SESSION_SAMESITE=Lax
DIGIMIUM_SESSION_SECURE=false      # true in production (HTTPS)
DIGIMIUM_SESSION_MAX_LIFETIME=28800

APP_ENV=development
APP_DEBUG=true
```

### 4. Set up the database

```bash
# Create database
mysql -u root -p -e "CREATE DATABASE digimium CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;"

# Restore from backup (if available)
unrar x database_backup.rar   # then import the .sql

# Or apply migrations only (no initial schema in repo — restore from backup)
mysql -u root -p digimium < "deploy/new database.sql"

# Create first owner account
php -r "echo password_hash('your-password', PASSWORD_BCRYPT);"
# Insert the hash:
mysql -u root -p digimium -e "
  INSERT INTO users (username, pass_hash, role, is_active)
  VALUES ('owner', '<hash>', 'owner', 1);
"
```

### 5. Set up the bot

```bash
cd ../digimium-bot
cp .env.example .env   # or create manually
pip install -r requirements.txt
python digimium_dashboard.py
```

Bot `.env`:

```dotenv
BOT_TOKEN=<your-telegram-bot-token>
BOT_PASSWORD=<password-users-type-to-authenticate>
CHANNEL_ID=<telegram-channel-id-for-notifications>

DB_HOST=127.0.0.1
DB_PORT=3306
DB_NAME=digimium
DB_USER=root
DB_PASSWORD=secret
```

### 6. Run the bot via Docker (optional)

```bash
cd digimium-bot
docker build -t digimium-bot .
docker run --env-file .env digimium-bot
```

---

## Environment Variables Reference

### Admin Dashboard (`admin.digimium.store/.env`)

| Variable | Required | Description |
|---|---|---|
| `DIGIMIUM_DB_HOST` | ✓ | MySQL host |
| `DIGIMIUM_DB_PORT` | — | MySQL port (default: 3306) |
| `DIGIMIUM_DB_NAME` | ✓ | Database name |
| `DIGIMIUM_DB_USER` | ✓ | Database username |
| `DIGIMIUM_DB_PASS` | ✓ | Database password |
| `DIGIMIUM_REMEMBER_SECRET` | ✓ | HMAC secret for remember-me cookie (min 32 chars) |
| `DIGIMIUM_STOREFRONT_PATH` | ✓ | Absolute path to `digimium.store/` directory |
| `DIGIMIUM_STOREFRONT_PUBLIC_URL` | — | Public URL of storefront (used for links) |
| `DIGIMIUM_SESSION_NAME` | — | Session cookie name (default: `ERASESSID`) |
| `DIGIMIUM_SESSION_SECURE` | — | `true` on HTTPS production (default: auto-detect) |
| `DIGIMIUM_SESSION_SAMESITE` | — | Cookie SameSite value (default: `Lax`) |
| `DIGIMIUM_SESSION_MAX_LIFETIME` | — | Session idle timeout in seconds (default: 28800 = 8h) |
| `APP_ENV` | — | `development` or `production` |
| `APP_DEBUG` | — | `true` / `false` |

### Bot (`digimium-bot/.env`)

| Variable | Required | Description |
|---|---|---|
| `BOT_TOKEN` | ✓ | Telegram bot token from BotFather |
| `BOT_PASSWORD` | ✓ | Password users must enter to authenticate with the bot |
| `CHANNEL_ID` | ✓ | Telegram channel ID for scheduled notifications |
| `DB_HOST` | ✓ | MySQL host |
| `DB_PORT` | — | MySQL port (default: 3306) |
| `DB_NAME` | ✓ | Database name |
| `DB_USER` | ✓ | Database username |
| `DB_PASSWORD` | ✓ | Database password |

---

## Running Tests

No automated test suite currently. See `docs/TASKS.md` for test coverage backlog.

---

## Common Errors

| Error | Cause | Fix |
|---|---|---|
| Blank page / no output | PHP errors hidden | Set `APP_DEBUG=true`, check Apache error log |
| `Missing required configuration: DIGIMIUM_DB_HOST` | `.env` file not found or empty | Verify `.env` exists in `admin.digimium.store/` and is readable by `www-data` |
| `Database connection failed` | Wrong credentials or RDS security group | Check DB credentials; confirm EC2 security group allows port 3306 from EC2 to RDS |
| `Failed to write temporary services file` | Storefront path wrong or not writable | Check `DIGIMIUM_STOREFRONT_PATH` in `.env`; `chown -R www-data` the storefront directory |
| Bot: `Missing required environment variable: BOT_TOKEN` | Bot `.env` not loaded | Confirm `.env` is in `digimium-bot/` directory |
| `Session expired` loop | `DIGIMIUM_SESSION_SECURE=true` on HTTP | Set to `false` for local development |
