const { validationResult } = require('express-validator');
const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

const paginar = (page, limit) => {
  const p = Math.max(1, parseInt(page) || 1);
  const l = Math.min(100, Math.max(1, parseInt(limit) || 20));
  return { skip: (p - 1) * l, take: l, page: p, limit: l };
};

// GET /api/admin/motoboys
exports.listarMotoboys = async (req, res, next) => {
  try {
    const { page, limit, skip, take } = paginar(req.query.page, req.query.limit);
    const { status } = req.query;
    const where = status ? { status } : {};

    const [total, motoboys] = await Promise.all([
      prisma.motoboy.count({ where }),
      prisma.motoboy.findMany({
        where, skip, take,
        include: {
          user: { select: { id: true, name: true, email: true, phone: true, avatar: true, createdAt: true } },
          assinatura: { include: { plano: true } },
        },
        orderBy: { user: { createdAt: 'desc' } },
      }),
    ]);

    return res.json({
      success: true,
      data: motoboys,
      pagination: { total, page, limit, pages: Math.ceil(total / limit) },
    });
  } catch (err) {
    next(err);
  }
};

// PUT /api/admin/motoboy/:id/aprovar
exports.aprovarMotoboy = async (req, res, next) => {
  try {
    const motoboy = await prisma.motoboy.findUnique({ where: { id: req.params.id } });
    if (!motoboy) return res.status(404).json({ success: false, message: 'Motoboy não encontrado' });

    await prisma.motoboy.update({
      where: { id: req.params.id },
      data: { status: 'ACTIVE' },
    });

    return res.json({ success: true, message: 'Motoboy aprovado' });
  } catch (err) {
    next(err);
  }
};

// PUT /api/admin/motoboy/:id/status
exports.alterarStatusMotoboy = async (req, res, next) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty())
      return res.status(400).json({ success: false, errors: errors.array() });

    const { status } = req.body;
    const validos = ['ACTIVE', 'INACTIVE', 'SUSPENDED', 'PENDING'];
    if (!validos.includes(status))
      return res.status(400).json({ success: false, message: 'Status inválido' });

    const motoboy = await prisma.motoboy.findUnique({ where: { id: req.params.id } });
    if (!motoboy) return res.status(404).json({ success: false, message: 'Motoboy não encontrado' });

    await prisma.motoboy.update({ where: { id: req.params.id }, data: { status } });
    return res.json({ success: true, message: 'Status atualizado' });
  } catch (err) {
    next(err);
  }
};

// GET /api/admin/pedidos
exports.listarPedidos = async (req, res, next) => {
  try {
    const { page, limit, skip, take } = paginar(req.query.page, req.query.limit);
    const { status } = req.query;
    const where = status ? { status } : {};

    const [total, pedidos] = await Promise.all([
      prisma.pedido.count({ where }),
      prisma.pedido.findMany({
        where, skip, take,
        orderBy: { createdAt: 'desc' },
        include: {
          cliente: { select: { name: true, phone: true } },
          motoboy: { include: { user: { select: { name: true } } } },
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

// GET /api/admin/receita
exports.receita = async (req, res, next) => {
  try {
    const assinaturasAtivas = await prisma.assinatura.findMany({
      where: { status: 'ACTIVE' },
      include: { plano: true },
    });

    const total = assinaturasAtivas.reduce((acc, a) => acc + (a.plano?.price || 0), 0);

    return res.json({
      success: true,
      data: {
        assinaturasAtivas: assinaturasAtivas.length,
        receitaMensal: total,
      },
    });
  } catch (err) {
    next(err);
  }
};

// GET /api/admin/metricas
exports.metricas = async (req, res, next) => {
  try {
    const hoje = new Date();
    hoje.setHours(0, 0, 0, 0);

    const [totalPedidos, entregues, cancelados, pedidosHoje, totalClientes, totalMotoboys] =
      await Promise.all([
        prisma.pedido.count(),
        prisma.pedido.count({ where: { status: 'DELIVERED' } }),
        prisma.pedido.count({ where: { status: 'CANCELLED' } }),
        prisma.pedido.count({ where: { createdAt: { gte: hoje } } }),
        prisma.user.count({ where: { role: 'CLIENT' } }),
        prisma.motoboy.count(),
      ]);

    const taxaConclusao = totalPedidos > 0 ? ((entregues / totalPedidos) * 100).toFixed(1) : 0;

    return res.json({
      success: true,
      data: {
        totalPedidos,
        entregues,
        cancelados,
        pedidosHoje,
        totalClientes,
        totalMotoboys,
        taxaConclusao: `${taxaConclusao}%`,
      },
    });
  } catch (err) {
    next(err);
  }
};
