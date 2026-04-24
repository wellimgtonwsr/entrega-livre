const { validationResult } = require('express-validator');
const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

// POST /api/pedidos/:id/proposta (motoboy)
exports.enviarProposta = async (req, res, next) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty())
      return res.status(400).json({ success: false, message: 'Dados inválidos', errors: errors.array() });

    const motoboy = await prisma.motoboy.findUnique({
      where: { userId: req.user.id },
      include: { assinatura: true },
    });

    if (!motoboy || motoboy.status !== 'ACTIVE')
      return res.status(403).json({ success: false, message: 'Cadastro pendente de aprovação' });

    if (!motoboy.assinatura || motoboy.assinatura.status !== 'ACTIVE')
      return res.status(403).json({ success: false, message: 'Assinatura inativa. Assine um plano para receber pedidos.' });

    const pedido = await prisma.pedido.findUnique({
      where: { id: req.params.id },
      include: { cliente: { select: { id: true, name: true, fcmToken: true } } },
    });

    if (!pedido) return res.status(404).json({ success: false, message: 'Pedido não encontrado' });
    if (pedido.status !== 'WAITING_OFFERS')
      return res.status(400).json({ success: false, message: 'Pedido não está mais disponível' });
    if (new Date() > pedido.expiresAt)
      return res.status(400).json({ success: false, message: 'Pedido expirado' });

    // Verificar se já enviou proposta
    const jaEnviou = await prisma.proposta.findFirst({
      where: { pedidoId: pedido.id, motoboyId: motoboy.id, status: 'PENDING' },
    });
    if (jaEnviou)
      return res.status(409).json({ success: false, message: 'Você já enviou uma proposta para este pedido' });

    const { valor } = req.body;
    const proposta = await prisma.proposta.create({
      data: { pedidoId: pedido.id, motoboyId: motoboy.id, valor: parseFloat(valor) },
      include: {
        motoboy: {
          select: {
            id: true, vehicle: true, plate: true,
            user: { select: { name: true, avatar: true, rating: true } },
          },
        },
      },
    });

    // Notificar cliente em tempo real
    req.io.to(`user:${pedido.clienteId}`).emit('proposta:nova', {
      pedidoId: pedido.id,
      proposta: {
        id: proposta.id,
        valor: proposta.valor,
        motoboy: proposta.motoboy,
      },
    });

    return res.status(201).json({ success: true, data: proposta });
  } catch (err) {
    next(err);
  }
};

// GET /api/pedidos/:id/propostas (cliente)
exports.listarPropostas = async (req, res, next) => {
  try {
    const pedido = await prisma.pedido.findUnique({ where: { id: req.params.id } });
    if (!pedido) return res.status(404).json({ success: false, message: 'Pedido não encontrado' });
    if (pedido.clienteId !== req.user.id && req.user.role !== 'ADMIN')
      return res.status(403).json({ success: false, message: 'Acesso negado' });

    const propostas = await prisma.proposta.findMany({
      where: { pedidoId: req.params.id },
      include: {
        motoboy: {
          select: {
            id: true, vehicle: true, plate: true, lat: true, lng: true,
            user: { select: { name: true, avatar: true, rating: true, phone: true } },
          },
        },
      },
      orderBy: { createdAt: 'asc' },
    });

    return res.json({ success: true, data: propostas });
  } catch (err) {
    next(err);
  }
};

// POST /api/propostas/:id/aceitar (cliente)
exports.aceitarProposta = async (req, res, next) => {
  try {
    const proposta = await prisma.proposta.findUnique({
      where: { id: req.params.id },
      include: {
        pedido: true,
        motoboy: { include: { user: { select: { name: true, phone: true, fcmToken: true } } } },
      },
    });

    if (!proposta) return res.status(404).json({ success: false, message: 'Proposta não encontrada' });
    if (proposta.pedido.clienteId !== req.user.id)
      return res.status(403).json({ success: false, message: 'Acesso negado' });
    if (proposta.pedido.status !== 'WAITING_OFFERS')
      return res.status(400).json({ success: false, message: 'Pedido não está mais aguardando propostas' });
    if (proposta.status !== 'PENDING')
      return res.status(400).json({ success: false, message: 'Proposta não está mais disponível' });

    // Transação: aceitar proposta, rejeitar demais, atualizar pedido
    await prisma.$transaction([
      prisma.proposta.update({
        where: { id: proposta.id },
        data: { status: 'ACCEPTED' },
      }),
      prisma.proposta.updateMany({
        where: { pedidoId: proposta.pedidoId, id: { not: proposta.id } },
        data: { status: 'REJECTED' },
      }),
      prisma.pedido.update({
        where: { id: proposta.pedidoId },
        data: {
          status: 'ACCEPTED',
          motoboyId: proposta.motoboyId,
          valorFinal: proposta.valor,
          aceitoAt: new Date(),
        },
      }),
    ]);

    const pedidoAtualizado = await prisma.pedido.findUnique({
      where: { id: proposta.pedidoId },
      include: {
        cliente: { select: { name: true, phone: true } },
        motoboy: { include: { user: { select: { name: true } } } },
      },
    });

    // Notificar motoboy escolhido
    req.io.to(`user:${proposta.motoboy.userId}`).emit('corrida:aceita', {
      pedidoId: proposta.pedidoId,
      valorFinal: proposta.valor,
      origemEndereco: proposta.pedido.origemEndereco,
      destinoEndereco: proposta.pedido.destinoEndereco,
      cliente: {
        nome: pedidoAtualizado.cliente.name,
        telefone: pedidoAtualizado.cliente.phone,
      },
    });

    // Notificar sala do pedido
    req.io.to(`pedido:${proposta.pedidoId}`).emit('pedido:aceito', {
      pedidoId: proposta.pedidoId,
      motoboyId: proposta.motoboyId,
    });

    return res.json({ success: true, data: pedidoAtualizado });
  } catch (err) {
    next(err);
  }
};

// POST /api/propostas/:id/recusar (cliente)
exports.recusarProposta = async (req, res, next) => {
  try {
    const proposta = await prisma.proposta.findUnique({
      where: { id: req.params.id },
      include: { pedido: true },
    });

    if (!proposta) return res.status(404).json({ success: false, message: 'Proposta não encontrada' });
    if (proposta.pedido.clienteId !== req.user.id)
      return res.status(403).json({ success: false, message: 'Acesso negado' });
    if (proposta.status !== 'PENDING')
      return res.status(400).json({ success: false, message: 'Proposta não está pendente' });

    await prisma.proposta.update({
      where: { id: req.params.id },
      data: { status: 'REJECTED' },
    });

    return res.json({ success: true, message: 'Proposta recusada' });
  } catch (err) {
    next(err);
  }
};
