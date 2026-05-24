const { validationResult } = require('express-validator');
const { calcularDistancia } = require('../utils/calcularDistancia');
const { calcularRota } = require('../services/mapsService');
const { calcularValor } = require('../services/precificacao.service');
const prisma = require('../lib/prisma');
const RAIO_KM = 5;
const EXPIRACAO_MIN = 5;

const paginar = (page, limit) => {
  const p = Math.max(1, parseInt(page) || 1);
  const l = Math.min(100, Math.max(1, parseInt(limit) || 20));
  return { skip: (p - 1) * l, take: l, page: p, limit: l };
};

// POST /api/pedidos/calcular
// Recebe coords de origem e destino, devolve distancia, tempo e valor calculado pelo servidor
exports.calcularValorEntrega = async (req, res, next) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty())
      return res.status(400).json({ success: false, message: 'Dados inválidos', errors: errors.array() });

    const { origemLat, origemLng, destinoLat, destinoLng } = req.body;

    const rota = await calcularRota({
      origemLat: parseFloat(origemLat),
      origemLng: parseFloat(origemLng),
      destinoLat: parseFloat(destinoLat),
      destinoLng: parseFloat(destinoLng),
    });

    return res.json({
      success: true,
      data: {
        distanciaKm: rota.distanciaKm,
        tempoEstimadoMin: rota.tempoEstimadoMin,
        valorCalculado: rota.valorCalculado,
      },
    });
  } catch (err) {
    next(err);
  }
};

// POST /api/pedidos
exports.criarPedido = async (req, res, next) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty())
      return res.status(400).json({ success: false, message: 'Dados inválidos', errors: errors.array() });

    const {
      origemEndereco, origemLat, origemLng,
      destinoEndereco, destinoLat, destinoLng,
      valorProposto,
      descricao,
    } = req.body;

    // Calcular distância, tempo e valor de referência via Google Maps (ou Haversine como fallback)
    const rota = await calcularRota({
      origemLat: parseFloat(origemLat),
      origemLng: parseFloat(origemLng),
      destinoLat: parseFloat(destinoLat),
      destinoLng: parseFloat(destinoLng),
    });

    // Modelo inDrive: o cliente define o valor; valorCalculado é apenas referência
    const VALOR_MINIMO = 7;
    const valorCliente = Math.max(VALOR_MINIMO, parseFloat(valorProposto));

    const expiresAt = new Date(Date.now() + EXPIRACAO_MIN * 60 * 1000);

    const pedido = await prisma.pedido.create({
      data: {
        clienteId: req.user.id,
        origemEndereco, origemLat: parseFloat(origemLat), origemLng: parseFloat(origemLng),
        destinoEndereco, destinoLat: parseFloat(destinoLat), destinoLng: parseFloat(destinoLng),
        distanciaKm: rota.distanciaKm,
        tempoEstimadoMin: rota.tempoEstimadoMin,
        valorProposto: valorCliente,          // valor definido pelo cliente
        valorCalculado: rota.valorCalculado,  // referência do sistema (auditável)
        descricao,
        expiresAt,
      },
      include: { cliente: { select: { id: true, name: true, rating: true, avatar: true } } },
    });

    // Notificar motoboys próximos via socket
    req.io.emit('pedido:novo', {
      pedidoId: pedido.id,
      origemLat: pedido.origemLat,
      origemLng: pedido.origemLng,
      destinoEndereco: pedido.destinoEndereco,
      valorProposto: pedido.valorProposto,
      distanciaKm: pedido.distanciaKm,
      tempoEstimadoMin: pedido.tempoEstimadoMin,
      expiresAt: pedido.expiresAt,
    });

    return res.status(201).json({ success: true, data: pedido });
  } catch (err) {
    next(err);
  }
};

// GET /api/pedidos/historico
exports.historico = async (req, res, next) => {
  try {
    const { page, limit, skip, take } = paginar(req.query.page, req.query.limit);
    let where = {};

    if (req.user.role === 'CLIENT') {
      where = { clienteId: req.user.id };
    } else if (req.user.role === 'MOTOBOY') {
      const motoboy = await prisma.motoboy.findUnique({ where: { userId: req.user.id } });
      if (!motoboy) return res.status(404).json({ success: false, message: 'Motoboy não encontrado' });
      where = { motoboyId: motoboy.id };
    }

    const [total, pedidos] = await Promise.all([
      prisma.pedido.count({ where }),
      prisma.pedido.findMany({
        where, skip, take,
        orderBy: { createdAt: 'desc' },
        include: {
          cliente: { select: { id: true, name: true, avatar: true, rating: true } },
          motoboy: { select: { id: true, vehicle: true, plate: true, user: { select: { name: true, avatar: true, rating: true } } } },
          propostas: { select: { id: true, valor: true, status: true } },
        },
      }),
    ]);

    return res.json({
      success: true,
      data: pedidos,
      pagination: { total, page, limit, pages: Math.ceil(total / limit) },
    });
  } catch (err) {
    next(err);
  }
};

// GET /api/pedidos/disponiveis  (motoboy)
exports.pedidosDisponiveis = async (req, res, next) => {
  try {
    const motoboy = await prisma.motoboy.findUnique({ where: { userId: req.user.id } });
    if (!motoboy) return res.status(404).json({ success: false, message: 'Motoboy não encontrado' });

    if (!motoboy.lat || !motoboy.lng)
      return res.status(400).json({ success: false, message: 'Localize-se primeiro' });

    // Motoboy ativo há menos de 2 minutos
    const doisMin = new Date(Date.now() - 2 * 60 * 1000);
    if (!motoboy.locationAt || motoboy.locationAt < doisMin)
      return res.status(400).json({ success: false, message: 'Atualize sua localização' });

    // Bounding box: pre-filtra no banco antes do Haversine exato
    const latDelta = RAIO_KM / 111;
    const lngDelta = RAIO_KM / (111 * Math.cos((motoboy.lat * Math.PI) / 180));

    const pedidos = await prisma.pedido.findMany({
      where: {
        status: 'WAITING_OFFERS',
        expiresAt: { gt: new Date() },
        origemLat: { gte: motoboy.lat - latDelta, lte: motoboy.lat + latDelta },
        origemLng: { gte: motoboy.lng - lngDelta, lte: motoboy.lng + lngDelta },
      },
      include: { cliente: { select: { id: true, name: true, rating: true, avatar: true } } },
    });

    const proximos = pedidos.filter((p) => {
      const dist = calcularDistancia(motoboy.lat, motoboy.lng, p.origemLat, p.origemLng);
      return dist <= RAIO_KM;
    }).map((p) => ({
      ...p,
      distanciaAteOrigem: calcularDistancia(motoboy.lat, motoboy.lng, p.origemLat, p.origemLng),
    }));

    return res.json({ success: true, data: proximos });
  } catch (err) {
    next(err);
  }
};

// GET /api/pedidos/:id
exports.detalhesPedido = async (req, res, next) => {
  try {
    const pedido = await prisma.pedido.findUnique({
      where: { id: req.params.id },
      include: {
        cliente: { select: { id: true, name: true, phone: true, avatar: true, rating: true } },
        motoboy: {
          include: {
            user: { select: { id: true, name: true, phone: true, avatar: true, rating: true } },
          },
        },
        propostas: {
          include: {
            motoboy: {
              select: {
                id: true, vehicle: true, plate: true,
                user: { select: { name: true, avatar: true, rating: true } },
              },
            },
          },
          orderBy: { createdAt: 'asc' },
        },
      },
    });

    if (!pedido) return res.status(404).json({ success: false, message: 'Pedido não encontrado' });

    // Verificar permissão
    if (req.user.role === 'MOTOBOY') {
      const motoboy = await prisma.motoboy.findUnique({ where: { userId: req.user.id } });
      // Pode ver se: pedido está aberto a propostas, OU é o motoboy atribuído, OU tem proposta no pedido
      const temAcesso =
        motoboy &&
        (pedido.status === 'WAITING_OFFERS' ||
          pedido.motoboyId === motoboy.id ||
          pedido.propostas.some((p) => p.motoboyId === motoboy.id));
      if (!temAcesso)
        return res.status(403).json({ success: false, message: 'Acesso negado' });
    } else if (req.user.role !== 'ADMIN' && pedido.clienteId !== req.user.id) {
      return res.status(403).json({ success: false, message: 'Acesso negado' });
    }

    return res.json({ success: true, data: pedido });
  } catch (err) {
    next(err);
  }
};

// DELETE /api/pedidos/:id/cancelar
exports.cancelarPedido = async (req, res, next) => {
  try {
    const pedido = await prisma.pedido.findUnique({ where: { id: req.params.id } });

    if (!pedido) return res.status(404).json({ success: false, message: 'Pedido não encontrado' });
    if (pedido.clienteId !== req.user.id)
      return res.status(403).json({ success: false, message: 'Acesso negado' });
    if (pedido.status !== 'WAITING_OFFERS')
      return res.status(400).json({ success: false, message: 'Pedido não pode ser cancelado' });

    await prisma.pedido.update({
      where: { id: req.params.id },
      data: { status: 'CANCELLED' },
    });

    req.io.to(`pedido:${req.params.id}`).emit('pedido:cancelado', { pedidoId: req.params.id });

    return res.json({ success: true, message: 'Pedido cancelado' });
  } catch (err) {
    next(err);
  }
};

// PUT /api/pedidos/:id/status (motoboy)
exports.atualizarStatus = async (req, res, next) => {
  try {
    const { status } = req.body;
    const statusPermitidos = ['IN_PROGRESS', 'DELIVERED'];
    if (!statusPermitidos.includes(status))
      return res.status(400).json({ success: false, message: 'Status inválido' });

    const pedido = await prisma.pedido.findUnique({ where: { id: req.params.id } });
    if (!pedido) return res.status(404).json({ success: false, message: 'Pedido não encontrado' });

    const motoboy = await prisma.motoboy.findUnique({ where: { userId: req.user.id } });
    if (!motoboy || pedido.motoboyId !== motoboy.id)
      return res.status(403).json({ success: false, message: 'Acesso negado' });

    const updateData = { status };
    if (status === 'DELIVERED') updateData.entregueAt = new Date();

    const updated = await prisma.pedido.update({
      where: { id: req.params.id },
      data: updateData,
    });

    req.io.to(`pedido:${req.params.id}`).emit('corrida:status', {
      pedidoId: req.params.id,
      status,
    });

    if (status === 'DELIVERED') {
      req.io.to(`pedido:${req.params.id}`).emit('corrida:finalizada', { pedidoId: req.params.id });

      // Incrementar totalTrips
      await prisma.user.updateMany({
        where: { id: { in: [pedido.clienteId, motoboy.userId] } },
        data: { totalTrips: { increment: 1 } },
      });
    }

    return res.json({ success: true, data: updated });
  } catch (err) {
    next(err);
  }
};
