# Style Guide

**Stack:** PHP 8.x (admin backend) · Vanilla JavaScript ES2020 (admin frontend) · Python 3.11 (bot)

---

## PHP

### Naming

| Element | Convention | Example |
|---|---|---|
| Files | `snake_case.php` | `sale_insertion.php` |
| Classes | `PascalCase` | `ServiceCatalogStore` |
| Methods / functions | `camelCase` | `auth_require_login()`, `readCachePacket()` |
| Variables | `$snake_case` | `$sale_product`, `$cursorDate` |
| Constants | `UPPER_SNAKE_CASE` | `IDLE_TIMEOUT_SECONDS` |
| Namespaces | `Digimium\Core` | — |

### File structure

- `declare(strict_types=1);` at the top of every PHP file
- `require` bootstrap before any business logic; `require_once` for class files
- Keep API endpoint files thin: validate input → query DB → return JSON
- Core classes live in `app/core/` — no business logic in endpoint files

### Formatting

- No dedicated formatter currently. Follow PSR-12 conventions manually.
- 4-space indentation (no tabs)
- Opening braces on the same line for methods/control structures

### Error handling

- All database operations wrapped in `try/catch(Throwable $e)`
- Return `{ "success": false, "error": "..." }` with appropriate HTTP status
- Never expose stack traces or internal paths in API responses — log server-side

### Immutability

- Prefer building new arrays over mutating in place
- Use `readonly` properties for value objects where possible

---

## JavaScript

### Naming

| Element | Convention | Example |
|---|---|---|
| Files | `snake_case.js` | `sales_controller.js` |
| Functions | `camelCase` | `buildSaleTr()`, `renderViewport()` |
| Variables | `camelCase` | `allRows`, `currentQuery` |
| Constants | `UPPER_SNAKE_CASE` | `API_FETCH_LIMIT`, `CACHE_KEY` |
| Factory functions | `createX()` | `createSalesController()` |
| Config objects | named const | `const STORE_CLASSES = { ... }` |

### File length

- **Preferred:** 200–400 lines
- **Maximum:** 800 lines
- Shared logic extracted into factory functions (e.g., `sales_controller.js`)

### Function length

- **Maximum:** 50 lines
- Extract named helpers rather than writing long inline blocks

### Modules

This project uses plain `<script>` tags — no ES modules, no bundler. Functions shared across files are exposed as named globals or via `window.*`.

- Factory functions like `createSalesController` are declared in their own file and called by thin config wrappers
- Avoid polluting `window` unnecessarily — use IIFEs `(() => { ... })()`

### Immutability

```js
// WRONG: mutation
allRows.splice(idx, 1);

// CORRECT: return new copy
allRows = allRows.filter((r) => String(r.sale_id) !== idStr);
```

### Error handling

- All `fetch()` calls wrapped in `try/catch`
- Show user-facing error in the table placeholder or alert; log detail to `console.error`
- Optimistic UI updates must have rollback logic on failure

### Comment policy

Comment the **why**, not the **what**:

```js
// WRONG: what (obvious from code)
// set disabled to true
btn.disabled = true;

// CORRECT: why
// prevent double-submit while request is in-flight
btn.disabled = true;
```

---

## Python (Bot)

### Naming

| Element | Convention | Example |
|---|---|---|
| Files | `snake_case.py` | `digimium_dashboard.py` |
| Functions | `snake_case` | `get_summary_data()` |
| Variables | `snake_case` | `bot_token`, `db_config` |
| Constants | `UPPER_SNAKE_CASE` | `BOT_TOKEN`, `BASE_DIR` |
| Classes | `PascalCase` | (none currently) |

### File length

- Same limits as JS: preferred 200–400 lines, max 800

### Imports

Order: stdlib → third-party → local modules

```python
import os
from datetime import datetime

from telegram.ext import ApplicationBuilder

from config import BOT_TOKEN
from db import get_summary_data
```

### Configuration

- All secrets via `config.py` which reads from `.env` then `os.environ`
- Use `get_required_env()` for mandatory values — raises `RuntimeError` at startup if missing
- Never hardcode credentials, tokens, or IDs in source files

### Error handling

```python
# Async handlers: log and return gracefully, never crash the bot
try:
    data = get_summary_data()
except Exception as e:
    logger.error("Failed to fetch summary: %s", e)
    await update.message.reply_text("Failed to load data. Please try again.")
    return
```

---

## General Rules (All Languages)

- **Immutability always** — return new copies, never mutate existing objects or arrays
- **Validate at boundaries** — validate all user input and external data at the entry point before processing
- **No hardcoded secrets** — use `.env` files and environment variables
- **Small functions** — < 50 lines per function
- **Small files** — 200–400 lines preferred, 800 max
- **Comment the why** — if the logic is non-obvious, explain the reason not the mechanics
- **Fail loudly at startup** — missing required config should crash immediately with a clear error, not fail silently at runtime
