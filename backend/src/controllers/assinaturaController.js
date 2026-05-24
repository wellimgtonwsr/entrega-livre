const { MercadoPagoConfig, PreApproval } = require('mercadopago');
const crypto = require('crypto');
const prisma = require('../lib/prisma');

const getMPClient = () => {
  if (!process.env.MERCADOPAGO_ACCESS_TOKEN)
    throw new Error('MERCADOPAGO_ACCESS_TOKEN não configurado');
  return new MercadoPagoConfig({ accessToken: process.env.MERCADOPAGO_ACCESS_TOKEN });
};

// Verifica assinatura HMAC do webhook Mercado Pago
function validarAssinaturaWebhook(req) {
  const secret = process.env.MERCADOPAGO_WEBHOOK_SECRET;
  if (!secret) return true; // se não configurado, pula validação (dev)

  const xSignature = req.headers['x-signature'];
  const xRequestId = req.headers['x-request-id'];
  if (!xSignature) return false;

  const parts = Object.fromEntries(xSignature.split(',').map(p => p.trim().split('=')));
  const ts = parts['ts'];
  const v1 = parts['v1'];
  if (!ts || !v1) return false;

  const dataId = req.body?.data?.id || '';
  const manifest = `id:${dataId};request-id:${xRequestId || ''};ts:${ts};`;
  const expected = crypto.createHmac('sha256', secret).update(manifest).digest('hex');
  return crypto.timingSafeEqual(Buffer.from(v1, 'hex'), Buffer.from(expected, 'hex'));
}

// GET /api/planos
exports.listarPlanos = async (req, res, next) => {
  try {
    const planos = await prisma.plano.findMany({ where: { active: true } });
    return res.json({ success: true, data: planos });
  } catch (err) {
    next(err);
  }
};

// POST /api/assinatura/criar
exports.criarAssinatura = async (req, res, next) => {
  try {
    const { planoId } = req.body;
    if (!planoId)
      return res.status(400).json({ success: false, message: 'Plano obrigatório' });

    const motoboy = await prisma.motoboy.findUnique({
      where: { userId: req.user.id },
      include: { assinatura: true },
    });
    if (!motoboy) return res.status(404).json({ success: false, message: 'Motoboy não encontrado' });

    if (motoboy.assinatura && motoboy.assinatura.status === 'ACTIVE')
      return res.status(409).json({ success: false, message: 'Já possui assinatura ativa' });

    const plano = await prisma.plano.findUnique({ where: { id: planoId } });
    if (!plano || !plano.active)
      return res.status(404).json({ success: false, message: 'Plano não encontrado' });

    const user = await prisma.user.findUnique({ where: { id: req.user.id } });

    let initPoint = '#';
    let mpSubId = null;

    try {
      const client = getMPClient();
      const preApproval = new PreApproval(client);
      const result = await preApproval.create({
        body: {
          reason: `Assinatura ${plano.name} - Entrega Livre`,
          auto_recurring: {
            frequency: 1,
            frequency_type: 'months',
            transaction_amount: plano.price,
            currency_id: 'BRL',
          },
          back_url: `${process.env.FRONTEND_URL}/motoboy/assinatura?status=`,
          payer_email: user.email,
        },
      });
      initPoint = result.init_point;
      mpSubId = result.id;
    } catch (mpErr) {
      console.error('[MP] Erro ao criar assinatura:', mpErr.message);
    }

    if (motoboy.assinatura) {
      await prisma.assinatura.update({
        where: { motoboyId: motoboy.id },
        data: { planoId, status: 'PENDING', mpSubId, startDate: null, endDate: null },
      });
    } else {
      await prisma.assinatura.create({
        data: { motoboyId: motoboy.id, planoId, status: 'PENDING', mpSubId },
      });
    }

    return res.json({ success: true, data: { initPoint } });
  } catch (err) {
    next(err);
  }
};

// POST /api/assinatura/webhook
exports.webhook = async (req, res, next) => {
  try {
    if (!validarAssinaturaWebhook(req)) {
      return res.status(401).json({ success: false, message: 'Assinatura inválida' });
    }

    const { type, data } = req.body;

    if (type === 'subscription_preapproval' && data?.id) {
      const assinatura = await prisma.assinatura.findFirst({
        where: { mpSubId: data.id },
        include: { motoboy: true },
      });

      if (assinatura) {
        const { status } = data;
        const isActive = status === 'authorized';
        const isCancelled = ['cancelled', 'paused', 'ended'].includes(status);

        if (isActive) {
          const endDate = new Date();
          endDate.setMonth(endDate.getMonth() + 1);
          await prisma.assinatura.update({
            where: { id: assinatura.id },
            data: { status: 'ACTIVE', startDate: new Date(), endDate },
          });
          await prisma.motoboy.update({
            where: { id: assinatura.motoboyId },
            data: { status: 'ACTIVE' },
          });
        } else if (isCancelled) {
          await prisma.assinatura.update({
            where: { id: assinatura.id },
            data: { status: 'EXPIRED' },
          });
          await prisma.motoboy.update({
            where: { id: assinatura.motoboyId },
            data: { status: 'INACTIVE' },
          });
        }
      }
    }

    return res.sendStatus(200);
  } catch (err) {
    next(err);
  }
};

// GET /api/assinatura/status
exports.statusAssinatura = async (req, res, next) => {
  try {
    const motoboy = await prisma.motoboy.findUnique({
      where: { userId: req.user.id },
      include: { assinatura: { include: { plano: true } } },
    });
    if (!motoboy) return res.status(404).json({ success: false, message: 'Motoboy não encontrado' });
    return res.json({ success: true, data: motoboy.assinatura });
  } catch (err) {
    next(err);
  }
};

// DELETE /api/assinatura/cancelar
exports.cancelarAssinatura = async (req, res, next) => {
  try {
    const motoboy = await prisma.motoboy.findUnique({
      where: { userId: req.user.id },
      include: { assinatura: true },
    });
    if (!motoboy || !motoboy.assinatura)
      return res.status(404).json({ success: false, message: 'Assinatura não encontrada' });

    await prisma.assinatura.update({
      where: { id: motoboy.assinatura.id },
      data: { status: 'CANCELLED' },
    });
    await prisma.motoboy.update({
      where: { id: motoboy.id },
      data: { status: 'INACTIVE' },
    });

    return res.json({ success: true, message: 'Assinatura cancelada' });
  } catch (err) {
    next(err);
  }
};
