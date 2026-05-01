const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

// Mapa: userId → socketId
const onlineMotoboys = new Map();

exports.initSocket = (io) => {
  io.on('connection', (socket) => {
    const userId = socket.handshake.auth?.userId;
    if (userId) {
      socket.join(`user:${userId}`);
    }

    // Motoboy vai online
    socket.on('motoboy:online', async ({ motoboyId, lat, lng }) => {
      onlineMotoboys.set(motoboyId, socket.id);
      socket.join(`motoboy:${motoboyId}`);
      try {
        await prisma.motoboy.updateMany({
          where: { id: motoboyId },
          data: { lat: parseFloat(lat), lng: parseFloat(lng), locationAt: new Date() },
        });
      } catch {}
    });

    // Atualização de localização do motoboy durante corrida
    socket.on('motoboy:location', async ({ motoboyId, lat, lng }) => {
      try {
        await prisma.motoboy.updateMany({
          where: { id: motoboyId },
          data: { lat: parseFloat(lat), lng: parseFloat(lng), locationAt: new Date() },
        });
        socket.to(`motoboy:${motoboyId}`).emit('motoboy:location', { motoboyId, lat, lng });
      } catch {}
    });

    // Cliente começa a rastrear motoboy
    socket.on('client:track', ({ pedidoId, motoboyId }) => {
      socket.join(`pedido:${pedidoId}`);
      if (motoboyId) socket.join(`motoboy:${motoboyId}`);
    });

    // Entrar na sala do pedido
    socket.on('pedido:join', ({ pedidoId }) => {
      socket.join(`pedido:${pedidoId}`);
    });

    // ── Mototaxi ──────────────────────────────────────────────────────────────

    // Passageiro / motoboy entram na sala da corrida
    socket.on('entrar_corrida', (corridaId) => {
      socket.join(`corrida:${corridaId}`);
    });

    // Motoboy envia localização durante corrida (passageiro acompanha)
    socket.on('corrida:location', async ({ corridaId, motoboyId, lat, lng }) => {
      try {
        await prisma.motoboy.updateMany({
          where: { id: motoboyId },
          data: { lat: parseFloat(lat), lng: parseFloat(lng), locationAt: new Date() },
        });
        // Emitir para todos na sala da corrida (passageiro)
        socket.to(`corrida:${corridaId}`).emit('motoboy_location', { lat, lng });
      } catch {}
    });

    // Chat durante a corrida
    socket.on('chat:enviar', async ({ pedidoId, texto, senderId }) => {
      try {
        const mensagem = await prisma.mensagem.create({
          data: { pedidoId, senderId, texto },
          include: { sender: { select: { name: true, avatar: true } } },
        });
        io.to(`pedido:${pedidoId}`).emit('chat:receber', {
          id: mensagem.id,
          pedidoId,
          sender: mensagem.sender,
          texto: mensagem.texto,
          createdAt: mensagem.createdAt,
        });
      } catch {}
    });

    // ── Restaurante ───────────────────────────────────────────────────────────

    // Admin entra na sala do restaurante para receber novos pedidos
    socket.on('entrar_restaurante', (restauranteId) => {
      socket.join(`restaurante:${restauranteId}`);
    });

    // Cliente entra na sala do pedido de restaurante para acompanhar status
    socket.on('entrar_pedido_rest', (pedidoId) => {
      socket.join(`pedido_rest:${pedidoId}`);
    });

    socket.on('disconnect', () => {
      for (const [motoboyId, sid] of onlineMotoboys.entries()) {
        if (sid === socket.id) {
          onlineMotoboys.delete(motoboyId);
          break;
        }
      }
    });
  });
};
