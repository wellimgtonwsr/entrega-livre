const prisma = require('../lib/prisma');

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
        // Verificar que o remetente é o usuário autenticado e participa do pedido
        if (!userId || userId !== senderId) return;
        if (!texto || typeof texto !== 'string' || texto.trim().length === 0) return;

        const pedido = await prisma.pedido.findUnique({
          where: { id: pedidoId },
          select: { clienteId: true, motoboyId: true, motoboy: { select: { userId: true } } },
        });
        if (!pedido) return;
        const participantes = [pedido.clienteId, pedido.motoboy?.userId].filter(Boolean);
        if (!participantes.includes(userId)) return;

        const mensagem = await prisma.mensagem.create({
          data: { pedidoId, senderId, texto: texto.trim().slice(0, 1000) },
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

    // ── Chat Loja ↔ Motoboy ───────────────────────────────────────────────────

    // Entra na sala de chat com a loja (mesma pedidoId, sala separada)
    socket.on('pedido_loja:join', ({ pedidoId }) => {
      socket.join(`pedido_loja:${pedidoId}`);
    });

    // Cliente ou loja enviam mensagem sobre pedido de restaurante
    socket.on('loja:chat:enviar', async ({ pedidoId, texto, senderId }) => {
      if (!userId || userId !== senderId) return;
      if (!texto || typeof texto !== 'string' || texto.trim().length === 0) return;

      try {
        const pedidoRest = await prisma.pedidoRestaurante.findUnique({
          where: { id: pedidoId },
          select: {
            clienteId: true,
            restaurante: { select: { lojaProfile: { select: { userId: true } } } },
          },
        });
        if (!pedidoRest) return;
        const participantes = [
          pedidoRest.clienteId,
          pedidoRest.restaurante?.lojaProfile?.userId,
        ].filter(Boolean);
        if (!participantes.includes(userId)) return;

        const msg = { pedidoId, senderId, texto: texto.trim().slice(0, 1000), id: Date.now(), createdAt: new Date() };
        io.to(`pedido_loja:${pedidoId}`).emit('loja:chat:receber', msg);
      } catch {}
    });

    // ── Chat Corrida (Mototaxi) ↔ Passageiro ─────────────────────────────────

    // Entra na sala da corrida para chat (corrida:${corridaId} já existe, reutiliza)
    socket.on('corrida:chat:join', ({ corridaId }) => {
      socket.join(`corrida:${corridaId}`);
    });

    // Motoboy ou passageiro enviam mensagem na corrida
    socket.on('corrida:chat:enviar', async ({ corridaId, texto, senderId }) => {
      if (!userId || userId !== senderId) return;
      if (!texto || typeof texto !== 'string' || texto.trim().length === 0) return;

      try {
        const corrida = await prisma.corrida.findUnique({
          where: { id: corridaId },
          select: { passageiroId: true, motoboy: { select: { userId: true } } },
        });
        if (!corrida) return;
        const participantes = [corrida.passageiroId, corrida.motoboy?.userId].filter(Boolean);
        if (!participantes.includes(userId)) return;

        const msg = { corridaId, senderId, texto: texto.trim().slice(0, 1000), id: Date.now(), createdAt: new Date() };
        io.to(`corrida:${corridaId}`).emit('corrida:chat:receber', msg);
      } catch {}
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
