# directus-extension-transactions

Run multiple Directus service operations in a single database transaction — all succeed or all roll back.

## Installation

```
npm install directus-extension-transactions
```

Or copy the built extension into your Directus `extensions/` directory.

Requires Directus `>=10.10.0`.

## Usage

`POST /transactions` (requires authentication)

### Service-Based Format (Primary)

Directly call any Directus service method:

```json
{
  "operations": [
    {
      "id": "create_category",
      "service": "ItemsService",
      "action": "createOne",
      "collection": "categories",
      "body": { "name": "Electronics" }
    },
    {
      "id": "create_product",
      "service": "ItemsService",
      "action": "createOne",
      "collection": "products",
      "body": {
        "name": "Laptop",
        "category": "{{ create_category }}"
      }
    }
  ]
}
```

### HTTP-Like Format (Convenience)

Map familiar REST-style requests to service calls:

```json
{
  "operations": [
    {
      "id": "new_role",
      "method": "POST",
      "path": "/roles",
      "body": { "name": "Editors" }
    },
    {
      "id": "new_user",
      "method": "POST",
      "path": "/users",
      "body": {
        "email": "editor@example.com",
        "role": "{{ new_role }}"
      }
    }
  ]
}
```

### Mixed Formats

Service-based and HTTP-like operations can be mixed in the same request.

### Operation References

Use `{{ operation_id }}` to reference the result of a previous operation. References are type-preserving — if the previous operation returned a UUID string or a number, the reference resolves to that type, not a stringified version.

Use dot notation for nested access: `{{ create_item.id }}`.

The special variable `{{ $last }}` always refers to the result of the most recent operation.

When a reference is the entire value (`"{{ op_id }}"`), the raw value is injected. When embedded in a larger string (`"prefix-{{ op_id }}"`), the value is stringified.

### Dry Run

Add `"dry_run": true` to execute all operations then roll back the transaction. Useful for validation.

```json
{
  "dry_run": true,
  "operations": [
    { "service": "ItemsService", "action": "createOne", "collection": "posts", "body": { "title": "Test" } }
  ]
}
```

## Response Format

### Success

```json
{
  "data": {
    "status": "ok",
    "results": [
      { "id": "create_category", "index": 0, "status": "ok", "result": "uuid-1234" },
      { "id": "create_product", "index": 1, "status": "ok", "result": "uuid-5678" }
    ]
  }
}
```

### Failure

When an operation fails, the transaction is rolled back. The response includes per-operation status — operations after the failure are marked `not_executed`:

```json
{
  "errors": [
    {
      "message": "Transaction failed at operation index 1",
      "extensions": {
        "code": "TRANSACTION_FAILED",
        "results": [
          { "id": "op_a", "index": 0, "status": "ok", "result": "uuid-1234" },
          { "id": "op_b", "index": 1, "status": "error", "error": { "message": "Field \"x\" is required" } },
          { "id": "op_c", "index": 2, "status": "not_executed", "service": "ItemsService", "action": "createOne" }
        ]
      }
    }
  ]
}
```

### Dry Run Response

Same as success but with `"dry_run": true` in the data envelope. All changes are rolled back.

## Operation Parameters

### Service-Based

| Parameter    | Type               | Required | Description                                      |
| ------------ | ------------------ | -------- | ------------------------------------------------ |
| `id`         | `string`           | No       | ID for referencing this operation's result        |
| `service`    | `string`           | Yes      | Directus service class name (e.g. `ItemsService`) |
| `action`     | `string`           | Yes      | Method to call on the service                    |
| `collection` | `string`           | Depends  | Required for `ItemsService`                      |
| `id_param`   | `string \| number` | Depends  | Primary key for `readOne`, `updateOne`, etc.     |
| `body`       | `any`              | Depends  | Payload for create/update operations             |
| `query`      | `object`           | No       | Query parameters (filter, fields, etc.)          |
| `args`       | `array`            | No       | Fallback: raw arguments array for non-standard methods |

### HTTP-Like

| Parameter | Type     | Required | Description                                  |
| --------- | -------- | -------- | -------------------------------------------- |
| `id`      | `string` | No       | ID for referencing this operation's result    |
| `method`  | `string` | Yes      | `GET`, `POST`, `PATCH`, or `DELETE`          |
| `path`    | `string` | Yes      | REST path (e.g. `/items/posts`, `/users/123`) |
| `body`    | `any`    | No       | Request body                                 |
| `query`   | `object` | No       | Query parameters                             |

## Configuration

| Environment Variable         | Default | Description                              |
| ---------------------------- | ------- | ---------------------------------------- |
| `TRANSACTIONS_MAX_OPS`       | `50`    | Maximum operations per request           |
| `TRANSACTIONS_TIMEOUT_MS`    | `30000` | Transaction timeout in milliseconds      |
| `TRANSACTIONS_MAX_CONCURRENT`| `3`     | Maximum concurrent transactions          |

## Security

- **Authentication required** — returns `401` if no authenticated user
- **Blocked services** — the following services cannot be called: `AuthenticationService`, `MailService`, `TFAService`, `ExtensionsService`, `WebSocketService`, `PayloadService`, `GraphQLService`, `ServerService`, `DeploymentService`, `DeploymentProjectsService`, `DeploymentRunsService`
- **Action validation** — actions starting with `_` and prototype-polluting names (`__proto__`, `constructor`, `prototype`) are rejected
- **Directus permissions** — all operations run with the caller's accountability, so existing Directus access control applies

## Known Limitations

- **MySQL DDL implicit commits** — MySQL auto-commits on schema changes (`CollectionsService`, `FieldsService`, `RelationsService`). These cannot be rolled back.
- **Events suppressed** — Directus event hooks do not fire for operations inside the transaction since services are instantiated with a transaction-scoped Knex instance.
- **Deadlocks** — a database deadlock aborts the entire transaction.
- **Void returns** — service methods that return `undefined` are normalized to `null` in results.

## Development

```bash
# Build
pnpm build

# Dev mode (watch)
pnpm dev

# Run all tests
pnpm test

# Unit tests only
pnpm test:unit

# E2E tests only
pnpm test:e2e
```
