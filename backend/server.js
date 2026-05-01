require('dotenv').config();

// Validar variáveis de ambiente obrigatórias
const requiredEnv = ['DATABASE_URL', 'JWT_SECRET'];
requiredEnv.forEach((key) => {
  if (!process.env[key]) {
    console.error(`[ERRO] Variável de ambiente obrigatória ausente: ${key}`);
    process.exit(1);
  }
});

const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const cors = require('cors');
const morgan = require('morgan');
const rateLimit = require('express-rate-limit');
const cron = require('node-cron');
const { PrismaClient } = require('@prisma/client');

const authRoutes = require('./src/routes/auth');
const pedidoRoutes = require('./src/routes/pedidos');
const propostaRoutes = require('./src/routes/propostas');
const assinaturaRoutes = require('./src/routes/assinatura');
const adminRoutes = require('./src/routes/admin');
const corridaRoutes = require('./src/routes/corridas');
const restauranteRoutes = require('./src/routes/restaurantes');
const { initSocket } = require('./src/services/socketService');

const app = express();
const server = http.createServer(app);
const prisma = new PrismaClient();

const allowedOrigins = [
  process.env.FRONTEND_URL,
  'http://localhost:5173',
  'http://localhost:3000',
].filter(Boolean);

const io = new Server(server, {
  cors: {
    origin: allowedOrigins,
    methods: ['GET', 'POST'],
    credentials: true,
  },
});

// Middlewares
app.use(cors({
  origin: (origin, callback) => {
    if (!origin || allowedOrigins.includes(origin)) {
      callback(null, true);
    } else {
      callback(new Error('Not allowed by CORS'));
    }
  },
  credentials: true,
}));

app.use(express.json());
app.use(morgan(process.env.NODE_ENV === 'production' ? 'combined' : 'dev'));

const limiter = rateLimit({
  windowMs: 60 * 1000,
  max: 100,
  standardHeaders: true,
  legacyHeaders: false,
  message: { success: false, message: 'Muitas requisições. Tente novamente em 1 minuto.' },
});
app.use(limiter);

// Injetar io nos requests
app.use((req, _res, next) => {
  req.io = io;
  next();
});

// Rotas
app.use('/api/auth', authRoutes);
app.use('/api', pedidoRoutes);
app.use('/api', propostaRoutes);
app.use('/api', assinaturaRoutes);
app.use('/api', corridaRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api', restauranteRoutes);

// Health check
app.get('/health', (_req, res) => res.json({ success: true, message: 'OK' }));
app.get('/api/health', (_req, res) => res.json({ success: true, message: 'OK' }));

// 404
app.use((_req, res) => {
  res.status(404).json({ success: false, message: 'Rota não encontrada' });
});

// Error handler centralizado
app.use((err, _req, res, _next) => {
  console.error(err);
  const status = err.status || 500;
  res.status(status).json({
    success: false,
    message: err.message || 'Erro interno do servidor',
  });
});

// Socket.io
initSocket(io);

// Cron: expirar pedidos vencidos e assinaturas
cron.schedule('* * * * *', async () => {
  try {
    const now = new Date();
    await prisma.pedido.updateMany({
      where: { status: 'WAITING_OFFERS', expiresAt: { lt: now } },
      data: { status: 'EXPIRED' },
    });
    // Expirar corridas de mototaxi
    await prisma.corrida.updateMany({
      where: { status: 'AGUARDANDO', expiresAt: { lt: now } },
      data: { status: 'EXPIRADA' },
    });
  } catch (e) {
    console.error('[CRON] Erro ao expirar pedidos/corridas:', e.message);
  }
});

cron.schedule('0 0 * * *', async () => {
  try {
    const now = new Date();
    const expiradas = await prisma.assinatura.findMany({
      where: { status: 'ACTIVE', endDate: { lt: now } },
      select: { id: true, motoboyId: true },
    });
    for (const ass of expiradas) {
      await prisma.assinatura.update({
        where: { id: ass.id },
        data: { status: 'EXPIRED' },
      });
      await prisma.motoboy.update({
        where: { id: ass.motoboyId },
        data: { status: 'INACTIVE' },
      });
    }
  } catch (e) {
    console.error('[CRON] Erro ao expirar assinaturas:', e.message);
  }
});

const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
  console.log(`[SERVER] Rodando na porta ${PORT}`);
});
