# Property Filtering + Pagination Design

**Date:** 2026-03-02
**Status:** Approved

## Summary

Add filtering, sorting, and pagination to `GET /api/properties`. Single endpoint, Approach A — auth determines visibility (public sees available only, admin sees all statuses). Also adds missing `property_type` column.

## Database Change

Migration `012_add_property_type.sql`:
- Add `property_type VARCHAR(50)` with CHECK constraint: `apartment`, `house`, `townhouse`, `condo`, `duplex`, `basement_suite`, `laneway_house`
- Nullable (existing rows unaffected)
- Index on `property_type`
- Fix status CHECK: change `pending` → `maintenance` to match validation layer

## Query Parameters

| Param | Type | Example | Notes |
|---|---|---|---|
| `min_price` | float | `1200` | >= |
| `max_price` | float | `2500` | <= |
| `bedrooms` | int | `2` | >= (minimum) |
| `bathrooms` | int | `1` | >= (minimum) |
| `min_sqft` | int | `600` | >= |
| `max_sqft` | int | `1200` | <= |
| `city` | string | `Vancouver` | case-insensitive match |
| `property_type` | string | `apartment` | exact match from enum |
| `available_by` | date | `2026-04-01` | availability_date <= this |
| `status` | string | `occupied` | admin only, ignored for public |
| `sort` | string | `price_asc` | see sort options below |
| `page` | int | `1` | default 1 |
| `limit` | int | `20` | default 20, max 100 |

## Sort Options

- `price_asc` / `price_desc`
- `newest` (created_at DESC, default)
- `availability` (availability_date ASC)
- `title_asc` (admin use — inventory at a glance)

## Auth Behavior

- **No auth / tenant:** `status` forced to `available`, `status` param ignored
- **Admin (authenticated):** can pass `status` param to filter by any status. No status param = all statuses.

## Response Format

```json
{
  "data": [ ...properties ],
  "pagination": {
    "page": 1,
    "limit": 20,
    "total": 87,
    "total_pages": 5
  }
}
```

Breaking change: current response is a bare array. After this, it's an object with `data` + `pagination`. Frontend isn't wired yet so no impact.

## Validation

All query params validated via express-validator `query()`:
- `min_price`, `max_price`: optional float, > 0
- `bedrooms`, `bathrooms`: optional int, >= 0
- `min_sqft`, `max_sqft`: optional int, >= 0
- `city`: optional string, trimmed
- `property_type`: optional, must be in enum
- `available_by`: optional, ISO date
- `status`: optional, must be in enum (only applied if admin)
- `sort`: optional, must be in allowed list
- `page`: optional int, >= 1
- `limit`: optional int, 1-100

## Files Changed

- `backend/src/db/migrations/012_add_property_type.sql` (new)
- `backend/src/models/PropertyModel.js` — new `findFiltered()` method, add `property_type` to `create()` + `update()`
- `backend/src/controllers/PropertyController.js` — `list()` reads query params, detects admin
- `backend/src/routes/propertyRoutes.js` — query validation rules on GET `/`
- `backend/tests/properties.test.js` — new filter/pagination/sort tests
