---
description: "Scaffold a new Express API route + controller following this project's conventions. Use when adding a new resource or feature endpoint to the backend."
name: "New API Route + Controller"
argument-hint: "Resource name (e.g. notificacao, avaliacao, endereco)"
agent: "agent"
---

Scaffold a new Express route file and controller for the resource: **$ARGUMENTS**

## Context

Read the existing patterns before generating:
- [backend/src/controllers/pedidoController.js](../../backend/src/controllers/pedidoController.js)
- [backend/src/routes/pedidos.js](../../backend/src/routes/pedidos.js)
- [backend/server.js](../../backend/server.js)
- [backend/prisma/schema.prisma](../../backend/prisma/schema.prisma)

## What to generate

### 1. `backend/src/controllers/<resource>Controller.js`

Follow these exact conventions:
- `const { PrismaClient } = require('@prisma/client')` and `const prisma = new PrismaClient()` at the top
- Import `validationResult` from `express-validator` if any body validation is needed
- Each handler: `exports.<action> = async (req, res, next) => { try { ... } catch (err) { next(err); } }`
- Success response shape: `res.json({ success: true, data: ... })`
- Error response shape: `res.status(4xx).json({ success: false, message: '...' })`
- Use `req.user.id` / `req.user.role` (injected by `auth` middleware)
- Use `req.io.emit(...)` or `req.io.to(room).emit(...)` for real-time events
- IDs are UUIDs; use `req.params.id` for URL params

Include at minimum:
- `list` — GET all records (with basic pagination via `page` + `limit` query params)
- `getById` — GET one record by `:id`
- `create` — POST new record
- `update` — PUT/PATCH record by `:id`
- `remove` — DELETE record by `:id`

Only add handlers that make sense for the resource. Skip any that are irrelevant.

### 2. `backend/src/routes/<resource>s.js`

Follow these exact conventions:
- `const router = require('express').Router()`
- `const ctrl = require('../controllers/<resource>Controller')`
- `const auth = require('../middlewares/auth')`
- `const roles = require('../middlewares/roles')`
- `const { body } = require('express-validator')` for request body validation
- Use `auth` on all protected routes; add `roles('CLIENT' | 'MOTOBOY' | 'ADMIN')` where needed
- Export: `module.exports = router`

### 3. Registration in `backend/server.js`

Show the two lines to add (do NOT edit the file automatically — print them as a code block):
```js
// 1. Near the other require() imports:
const <resource>Routes = require('./src/routes/<resource>s');

// 2. Near the other app.use() mounts (inside the "Rotas" section):
app.use('/api', <resource>Routes);
```

## Output format

1. Full file content for the controller
2. Full file content for the route file
3. The two-line snippet for `server.js`
4. A one-sentence summary of what was generated and any Prisma model assumptions made

Do not add JSDoc comments or type annotations. Do not add error handling for impossible scenarios.
