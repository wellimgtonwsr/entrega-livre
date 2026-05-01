# Entrega Livre — Agent Instructions

Delivery + ride-hailing app (inDrive-style). One codebase, two services: `backend/` (Node/Express API) and `frontend/` (React/Vite SPA).

## Stack

| Layer | Technology |
|---|---|
| Backend | Node.js, Express 4, Prisma 5, Socket.IO v4 |
| Database | PostgreSQL via Supabase (`DATABASE_URL`) |
| Auth | JWT (`{ id, role }`) + bcryptjs |
| Payments | Mercado Pago SDK |
| Push | Firebase Admin SDK (FCM) |
| Storage | Supabase Storage (bucket `documentos`) |
| Maps | Google Maps API (via `mapsService.js`) |
| Frontend | React 18, Vite 5, React Router v6, Axios, Socket.IO Client |

## Commands

```bash
# Backend
cd backend && npm run dev          # development (nodemon)
cd backend && npm start            # production
npx prisma migrate dev --name X    # new migration
npx prisma studio                  # DB GUI

# Frontend
cd frontend && npm run dev         # dev server (localhost:5173)
cd frontend && npm run build       # production bundle
```

No test runner is configured.

## Architecture

- **REST API** at `VITE_API_URL/api` (default `localhost:3000/api`). Axios instance at `frontend/src/services/api.js`.
- **Real-time** via Socket.IO. Backend injects `io` into every request as `req.io`. Frontend connects via `SocketContext`.
- **Auth flow**: `Authorization: Bearer <token>` header → `auth.js` middleware → `req.user = { id, role }`. Roles: `CLIENT | MOTOBOY | ADMIN`.
- **Frontend routing**: `AppRouter.jsx` uses `PrivateRoute` for auth + role guards. Pages are split by role under `src/pages/<role>/`.
- **Cron jobs** in `server.js`: expire stale orders/rides every minute; expire subscriptions daily at midnight.

## Key Conventions

- Controllers import Prisma directly — no repository layer.
- Emit socket events from controllers using `req.io.emit(...)`.
- All DB IDs are UUIDs.
- Use `formatarErro.js` for consistent error response shapes.
- DB status enums: `SCREAMING_SNAKE_CASE` in English for deliveries (`WAITING_OFFERS`, `IN_PROGRESS`); Portuguese-style for rides (`AGUARDANDO`, `EM_ANDAMENTO`). Keep this inconsistency — don't change existing values.
- Frontend `basename="/entrega-livre"` (GitHub Pages deployment).

## DB Models (Prisma)

| Model | Purpose |
|---|---|
| `User` | All users; `role` field differentiates CLIENT/MOTOBOY/ADMIN |
| `Motoboy` | 1-to-1 with User; vehicle, CNH, GPS coords, approval `status` |
| `Pedido` | Delivery order with origin/destination coords and lifecycle status |
| `Proposta` | Motoboy bid on a `Pedido` (negotiation flow) |
| `Corrida` | Ride-hailing trip (passenger → motoboy) |
| `PropostaCorrida` | Motoboy bid on a `Corrida` |
| `Assinatura` | Motoboy subscription (tied to `Plano` and Mercado Pago) |
| `Mensagem` | In-order chat messages |
| `Avaliacao` | Bidirectional post-delivery rating |

## Environment Variables

**Backend** (required at startup):
- `DATABASE_URL`, `JWT_SECRET`

**Backend** (optional/feature):
- `PORT`, `NODE_ENV`, `JWT_EXPIRES_IN`, `FRONTEND_URL`
- `SUPABASE_URL`, `SUPABASE_ANON_KEY`, `SUPABASE_SERVICE_KEY`
- `GOOGLE_MAPS_API_KEY`, `MERCADOPAGO_ACCESS_TOKEN`, `MERCADOPAGO_WEBHOOK_SECRET`
- `FIREBASE_SERVICE_ACCOUNT` (full JSON blob)

**Frontend**: `VITE_API_URL`

## Deployment

- **Backend**: Render (`render.yaml`). Build: `npm install && npx prisma generate && npx prisma migrate deploy`. Health check: `GET /api/health`.
- **Frontend**: GitHub Pages. Build output: `frontend/dist`.

See [README.md](README.md) for setup guides (Supabase, Mercado Pago, Firebase, Render, GitHub Pages).
