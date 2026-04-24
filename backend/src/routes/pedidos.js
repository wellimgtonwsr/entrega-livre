const router = require('express').Router();
const { body } = require('express-validator');
const ctrl = require('../controllers/pedidoController');
const auth = require('../middlewares/auth');
const roles = require('../middlewares/roles');

// Localização do motoboy
router.put('/motoboy/localizacao', auth, roles('MOTOBOY'), async (req, res, next) => {
  try {
    const { lat, lng } = req.body;
    if (!lat || !lng)
      return res.status(400).json({ success: false, message: 'lat e lng obrigatórios' });

    const { PrismaClient } = require('@prisma/client');
    const prisma = new PrismaClient();
    const motoboy = await prisma.motoboy.findUnique({ where: { userId: req.user.id } });
    if (!motoboy) return res.status(404).json({ success: false, message: 'Motoboy não encontrado' });

    await prisma.motoboy.update({
      where: { id: motoboy.id },
      data: { lat: parseFloat(lat), lng: parseFloat(lng), locationAt: new Date() },
    });

    // Emitir localização para quem esteja acompanhando
    req.io.to(`motoboy:${motoboy.id}`).emit('motoboy:location', {
      motoboyId: motoboy.id, lat: parseFloat(lat), lng: parseFloat(lng),
    });

    return res.json({ success: true });
  } catch (err) {
    next(err);
  }
});

router.get('/motoboy/:id/localizacao', auth, async (req, res, next) => {
  try {
    const { PrismaClient } = require('@prisma/client');
    const prisma = new PrismaClient();
    const motoboy = await prisma.motoboy.findUnique({
      where: { id: req.params.id },
      select: { lat: true, lng: true, locationAt: true },
    });
    if (!motoboy) return res.status(404).json({ success: false, message: 'Motoboy não encontrado' });
    return res.json({ success: true, data: motoboy });
  } catch (err) {
    next(err);
  }
});

// Avaliações
router.post('/avaliacoes', auth, [
  body('pedidoId').notEmpty(),
  body('avaliadoId').notEmpty(),
  body('nota').isInt({ min: 1, max: 5 }),
], async (req, res, next) => {
  try {
    const { PrismaClient } = require('@prisma/client');
    const prisma = new PrismaClient();
    const { pedidoId, avaliadoId, nota, comentario } = req.body;

    const pedido = await prisma.pedido.findUnique({ where: { id: pedidoId } });
    if (!pedido || pedido.status !== 'DELIVERED')
      return res.status(400).json({ success: false, message: 'Pedido não finalizado' });

    const jaAvaliou = await prisma.avaliacao.findFirst({
      where: { pedidoId, avaliadorId: req.user.id },
    });
    if (jaAvaliou)
      return res.status(409).json({ success: false, message: 'Você já avaliou este pedido' });

    const avaliacao = await prisma.avaliacao.create({
      data: { pedidoId, avaliadorId: req.user.id, avaliadoId, nota: parseInt(nota), comentario },
    });

    // Recalcular rating (média das últimas 50)
    const avaliacoes = await prisma.avaliacao.findMany({
      where: { avaliadoId },
      orderBy: { createdAt: 'desc' },
      take: 50,
      select: { nota: true },
    });
    const media = avaliacoes.reduce((s, a) => s + a.nota, 0) / avaliacoes.length;
    await prisma.user.update({ where: { id: avaliadoId }, data: { rating: media } });

    return res.status(201).json({ success: true, data: avaliacao });
  } catch (err) {
    next(err);
  }
});

router.get('/usuarios/:id/avaliacoes', auth, async (req, res, next) => {
  try {
    const { PrismaClient } = require('@prisma/client');
    const prisma = new PrismaClient();
    const page = Math.max(1, parseInt(req.query.page) || 1);
    const limit = Math.min(50, parseInt(req.query.limit) || 20);
    const skip = (page - 1) * limit;

    const [total, avaliacoes] = await Promise.all([
      prisma.avaliacao.count({ where: { avaliadoId: req.params.id } }),
      prisma.avaliacao.findMany({
        where: { avaliadoId: req.params.id },
        skip, take: limit,
        orderBy: { createdAt: 'desc' },
        include: { avaliador: { select: { name: true, avatar: true } } },
      }),
    ]);

    return res.json({
      success: true,
      data: avaliacoes,
      pagination: { total, page, limit, pages: Math.ceil(total / limit) },
    });
  } catch (err) {
    next(err);
  }
});

// Pedidos
router.post('/pedidos', auth, roles('CLIENT'), [
  body('origemEndereco').notEmpty(),
  body('origemLat').isNumeric(),
  body('origemLng').isNumeric(),
  body('destinoEndereco').notEmpty(),
  body('destinoLat').isNumeric(),
  body('destinoLng').isNumeric(),
  body('distanciaKm').isNumeric(),
  body('tempoEstimadoMin').isInt(),
  body('valorProposto').isFloat({ min: 1 }),
], ctrl.criarPedido);

router.get('/pedidos/historico', auth, ctrl.historico);
router.get('/pedidos/disponiveis', auth, roles('MOTOBOY'), ctrl.pedidosDisponiveis);
router.get('/pedidos/:id', auth, ctrl.detalhesPedido);
router.delete('/pedidos/:id/cancelar', auth, roles('CLIENT'), ctrl.cancelarPedido);
router.put('/pedidos/:id/status', auth, roles('MOTOBOY'), [
  body('status').isIn(['IN_PROGRESS', 'DELIVERED']),
], ctrl.atualizarStatus);

module.exports = router;
