# Entrega Livre

Aplicativo de entregas estilo inDrive com **um unico app** (cliente + motoboy) e backend completo.

## Diferencial do projeto
- Cliente propoe o valor da entrega
- Motoboy aceita ou faz contraproposta
- **Sem taxa por corrida**
- Motoboy paga apenas assinatura mensal fixa e fica com 100% do valor

## Estrutura
- `backend/` API Node.js + Express + Prisma + Socket.io
- `frontend/` React + Vite (rotas por role: CLIENT, MOTOBOY, ADMIN)

## Stack
- Backend: Node.js, Express, Prisma
- Banco: PostgreSQL (Supabase)
- Realtime: Socket.io
- Auth: JWT + bcrypt
- Frontend: React + Vite
- Assinatura: Mercado Pago
- Notificacoes: Firebase FCM
- Mapa: Google Maps API

## 1) Configuracao local

### Requisitos
- Node 20+
- NPM 10+
- Conta Supabase

### Backend
```bash
cd backend
cp .env.example .env
npm install
npx prisma generate
npx prisma migrate dev --name init
npm run dev
```

API rodando em `http://localhost:3000`.

### Frontend
```bash
cd frontend
cp .env.example .env
npm install
npm run dev
```

Frontend rodando em `http://localhost:5173`.

## 2) Configurar Supabase
1. Crie um projeto no Supabase.
2. Copie a string PostgreSQL para `DATABASE_URL`.
3. Preencha `SUPABASE_URL`, `SUPABASE_ANON_KEY`, `SUPABASE_SERVICE_KEY` no `backend/.env`.
4. Crie bucket no Storage:
- `documentos` (publico para teste ou privado em producao)
5. Rode migracoes Prisma para criar tabelas.
6. Ative Realtime (opcional) nas tabelas que quiser monitorar.

## 3) Configurar Mercado Pago
1. Crie aplicacao no Mercado Pago.
2. Pegue `MERCADOPAGO_ACCESS_TOKEN`.
3. Configure webhook para:
- `POST https://SEU_BACKEND/api/assinatura/webhook`
4. Crie planos no banco (tabela `Plano`) com valores mensais.

## 4) Configurar Firebase (FCM)
1. Crie projeto no Firebase.
2. Gere Service Account JSON.
3. Coloque o JSON inteiro em `FIREBASE_SERVICE_ACCOUNT` no backend `.env`.
4. No app frontend, registre token e envie para:
- `PUT /api/auth/fcm-token`

## 5) Deploy

### Backend no Render
1. New Web Service apontando para pasta `backend`.
2. Build command:
```bash
npm install && npx prisma generate
```
3. Start command:
```bash
npm start
```
4. Configure variaveis de ambiente do `backend/.env.example`.

### Frontend no GitHub Pages
1. Em `frontend/vite.config.js`, mantenha `base: '/entrega-livre/'`.
2. Build:
```bash
npm run build
```
3. Publique `frontend/dist` no GitHub Pages (branch `gh-pages` ou `docs`).

## Endpoints principais

### Auth
- `POST /api/auth/register`
- `POST /api/auth/login`
- `GET /api/auth/me`
- `POST /api/auth/upload-docs`
- `PUT /api/auth/fcm-token`

### Pedidos
- `POST /api/pedidos`
- `GET /api/pedidos/historico`
- `GET /api/pedidos/disponiveis`
- `GET /api/pedidos/:id`
- `DELETE /api/pedidos/:id/cancelar`
- `PUT /api/pedidos/:id/status`

### Propostas
- `POST /api/pedidos/:id/proposta`
- `GET /api/pedidos/:id/propostas`
- `POST /api/propostas/:id/aceitar`
- `POST /api/propostas/:id/recusar`

### Assinatura
- `GET /api/planos`
- `POST /api/assinatura/criar`
- `POST /api/assinatura/webhook`
- `GET /api/assinatura/status`
- `DELETE /api/assinatura/cancelar`

### Admin
- `GET /api/admin/motoboys`
- `PUT /api/admin/motoboy/:id/aprovar`
- `PUT /api/admin/motoboy/:id/status`
- `GET /api/admin/pedidos`
- `GET /api/admin/receita`
- `GET /api/admin/metricas`

## Fluxo funcional
1. Cliente cria pedido com valor.
2. Motoboys proximos veem pedido e enviam proposta.
3. Cliente aceita uma proposta.
4. Pedido vira `ACCEPTED`, depois `IN_PROGRESS` e `DELIVERED`.
5. Ambos avaliam.

## Observacoes
- Pedido expira em 5 minutos se nao for aceito.
- Motoboy so opera com status ativo + assinatura ativa.
- Rating considera media das ultimas 50 avaliacoes.
- O projeto esta preparado para evolucao de UI e regras de producao.
