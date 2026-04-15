# API Reference

## Base URL

```
https://admin.digimium.store/api/
```

All endpoints require an authenticated session (session cookie). Unauthenticated requests receive `401` JSON or redirect to `index.php`.

## Authentication

Session-based. Login via `POST api/login.php` to establish a PHP session. The session cookie (`ERASESSID` by default, configurable via `DIGIMIUM_SESSION_NAME`) must be included on every subsequent request.

A remember-me cookie (`era_remember`) is issued at login and auto-logs the user in for 7 days if the session expires.

**Roles:** `owner` > `admin` > `staff`. Each endpoint documents the minimum required role.

## Response Envelope

All endpoints return JSON with a consistent shape:

```json
{ "success": true,  "data": { ... } }
{ "success": false, "error": "Human-readable message" }
```

Paginated list endpoints include a `meta` object:

```json
{
  "success": true,
  "data": [ ... ],
  "meta": {
    "limit": 500,
    "has_more": true,
    "next_cursor": "MjAyNS0wOC0xNXwxMjM="
  }
}
```

Cursor is an opaque base64url token. Pass it as `?cursor=<token>` to fetch the next page.

## Error Codes

| HTTP | Meaning |
|------|---------|
| 400 | Bad request / invalid input |
| 401 | Not authenticated |
| 403 | Authenticated but insufficient role |
| 404 | Resource not found |
| 405 | Wrong HTTP method |
| 500 | Server / database error |

## Endpoints

### Auth

| Method | Path | Description | Min Role |
|--------|------|-------------|----------|
| POST | `api/login.php` | Log in with username + password | — |
| GET/POST | `api/logout.php` | Destroy session and clear cookies | any |

**Login request:**
```json
{ "username": "alice", "password": "secret" }
```

**Login response (200):**
```json
{ "success": true }
```

---

### Retail Sales (`sale_overview`)

| Method | Path | Description | Min Role |
|--------|------|-------------|----------|
| GET | `api/sales_table.php` | List retail sales (paginated, cursor-based) | staff |
| GET | `api/sales_minimal.php` | Lightweight list for summary/bot use | staff |
| GET | `api/sales_export_csv.php` | Export retail sales as CSV | admin |
| POST | `api/sale_insertion.php` | Create a retail sale | staff |
| POST | `api/sale_update_inline.php` | Update a single field inline | staff |
| POST | `api/sale_delete.php` | Delete a retail sale | staff |
| POST | `api/sales_bulk_insert.php` | Bulk import retail sales | admin |

**GET `sales_table.php` query params:**

| Param | Type | Default | Description |
|-------|------|---------|-------------|
| `limit` | int | 500 | Max rows per page (max 2000) |
| `cursor` | string | — | Pagination cursor from previous response |
| `q` | string | — | Server-side search (product, customer, email, manager, dates) |

**POST `sale_insertion.php` body:**
```json
{
  "sale_product": "Spotify Individual",
  "duration": 1,
  "renew": 1,
  "customer": "John Doe",
  "email": "john@example.com",
  "purchased_date": "2025-08-15",
  "expired_date": "2025-09-15",
  "manager": "Alice",
  "note": "First time customer",
  "price": 15500,
  "profit": 2000,
  "store": 1
}
```

**Store values:** `0`=Void, `1`=Digimium, `2`=D Mar Wal, `3`=Ember, `4`=Violet, `5`=Void

**POST `sale_update_inline.php` body:**
```json
{ "id": 42, "customer": "Jane Doe" }
```
Supported fields: `customer`, `email`, `manager`, `note`

---

### Wholesale Sales (`ws_sale_overview`)

Same CRUD pattern as retail. Prefix all paths with `ws_`. Extra field: `quantity` (int). No `store` field.

| Method | Path | Description | Min Role |
|--------|------|-------------|----------|
| GET | `api/ws_sales_table.php` | List wholesale sales | staff |
| GET | `api/ws_sales_minimal.php` | Lightweight list | staff |
| GET | `api/ws_sales_export_csv.php` | Export as CSV | admin |
| POST | `api/ws_sale_insertion.php` | Create wholesale sale | staff |
| POST | `api/ws_sale_update_inline.php` | Inline field update | staff |
| POST | `api/ws_sale_delete.php` | Delete wholesale sale | staff |

---

### Retail Products (`products_catalog`)

| Method | Path | Description | Min Role |
|--------|------|-------------|----------|
| GET | `api/products_table.php` | List retail products | admin |
| GET | `api/product_options.php` | Lightweight list for form selects | staff |
| POST | `api/product_insertion.php` | Create product | admin |
| POST | `api/product_update.php` | Update product | admin |
| POST | `api/product_delete.php` | Delete product | admin |

---

### Wholesale Products (`ws_products_catalog`)

Same pattern as retail products. Prefix paths with `ws_`.

---

### Storefront Service Catalog

These endpoints write directly to `digimium.store/data/services.json` and `images/services/`.

| Method | Path | Description | Min Role |
|--------|------|-------------|----------|
| GET | `api_json/get_services.php` | Read services JSON | admin |
| POST | `api_json/add_service.php` | Add a new service card | admin |
| POST | `api_json/save_services.php` | Full rewrite of services JSON (reorder/edit) | admin |
| POST | `api_json/delete_service.php` | Delete a service by index | admin |

---

### Users

| Method | Path | Description | Min Role |
|--------|------|-------------|----------|
| GET | `api/user_list.php` | List admin + bot users | owner |
| POST | `api/user_create.php` | Create admin user | owner |
| POST | `api/user_delete.php` | Delete admin user | owner |
| POST | `api/bot_user_delete.php` | Remove bot user authentication | owner |

**POST `user_create.php` body:**
```json
{ "username": "bob", "password": "strong-password", "role": "Staff" }
```

**Roles accepted:** `Staff`, `Admin` (case-insensitive; `Owner` cannot be created via API)

## Rate Limiting

No application-level rate limiting is currently implemented. Apache-level connection limits apply. Consider adding fail2ban rules for `api/login.php` on production.

## Caching

List endpoints (`sales_table.php`, `ws_sales_table.php`, etc.) use two-layer caching:

1. **PHP `ResponseCache`** — in-memory, request-scoped, 30-second TTL
2. **ETag / 304** — fingerprint based on `MAX(sale_id)` + `COUNT(*)`. JS stores the ETag in sessionStorage and sends `If-None-Match` on background refreshes.
