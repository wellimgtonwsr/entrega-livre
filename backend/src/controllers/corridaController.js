const { validationResult } = require('express-validator');
const { calcularRota } = require('../services/mapsService');
const prisma = require('../lib/prisma');
const EXPIRACAO_MIN = 7;
const RAIO_KM = 5;

// ─── Utils ────────────────────────────────────────────────────────────────────

function haversineKm(lat1, lng1, lat2, lng2) {
  const R = 6371;
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLng = ((lng2 - lng1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLng / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

// ─── Controllers ──────────────────────────────────────────────────────────────

// POST /api/corridas/calcular — calcula distância, tempo e valor sugerido (sem criar)
exports.calcularValorCorrida = async (req, res, next) => {
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
    return res.json({ success: true, data: rota });
  } catch (err) {
    next(err);
  }
};

// POST /api/corridas
exports.criarCorrida = async (req, res, next) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty())
      return res.status(400).json({ success: false, message: 'Dados inválidos', errors: errors.array() });

    const {
      origemEndereco, origemLat, origemLng,
      destinoEndereco, destinoLat, destinoLng,
      valorSugerido,
    } = req.body;

    const rota = await calcularRota({
      origemLat: parseFloat(origemLat),
      origemLng: parseFloat(origemLng),
      destinoLat: parseFloat(destinoLat),
      destinoLng: parseFloat(destinoLng),
    });

    const expiresAt = new Date(Date.now() + EXPIRACAO_MIN * 60 * 1000);

    const corrida = await prisma.corrida.create({
      data: {
        passageiroId: req.user.id,
        origemEndereco,
        origemLat: parseFloat(origemLat),
        origemLng: parseFloat(origemLng),
        destinoEndereco,
        destinoLat: parseFloat(destinoLat),
        destinoLng: parseFloat(destinoLng),
        distanciaKm: rota.distanciaKm,
        tempoEstimadoMin: rota.tempoEstimadoMin,
        valorSugerido: parseFloat(valorSugerido),
        expiresAt,
      },
      include: {
        passageiro: { select: { id: true, name: true, avatar: true, rating: true, phone: true } },
      },
    });

    // Notificar motoboys ativos na área
    const motoboysAtivos = await prisma.motoboy.findMany({
      where: {
        status: 'ACTIVE',
        lat: { not: null },
        lng: { not: null },
        assinatura: { status: 'ACTIVE' },
      },
      select: { id: true, userId: true, lat: true, lng: true },
    });

    const payload = {
      corridaId: corrida.id,
      origemEndereco: corrida.origemEndereco,
      destinoEndereco: corrida.destinoEndereco,
      distanciaKm: corrida.distanciaKm,
      tempoEstimadoMin: corrida.tempoEstimadoMin,
      valorSugerido: corrida.valorSugerido,
      passageiro: corrida.passageiro,
    };

    for (const mb of motoboysAtivos) {
      const dist = haversineKm(
        parseFloat(origemLat), parseFloat(origemLng),
        mb.lat, mb.lng,
      );
      if (dist <= RAIO_KM) {
        req.io.to(`user:${mb.userId}`).emit('corrida:nova', payload);
      }
    }

    return res.status(201).json({ success: true, data: corrida });
  } catch (err) {
    next(err);
  }
};

// GET /api/corridas/:id
exports.obterCorrida = async (req, res, next) => {
  try {
    const corrida = await prisma.corrida.findUnique({
      where: { id: req.params.id },
      include: {
        passageiro: { select: { id: true, name: true, avatar: true, rating: true, phone: true } },
        motoboy: {
          select: {
            id: true, vehicle: true, plate: true, lat: true, lng: true,
            user: { select: { name: true, avatar: true, rating: true, phone: true } },
          },
        },
        propostas: {
          where: { status: { not: 'REJEITADA' } },
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

    if (!corrida)
      return res.status(404).json({ success: false, message: 'Corrida não encontrada' });

    // Verificar permissão
    const isPassageiro = corrida.passageiroId === req.user.id;
    const isAdmin = req.user.role === 'ADMIN';
    let isMotoboy = false;

    if (req.user.role === 'MOTOBOY') {
      const mb = await prisma.motoboy.findUnique({ where: { userId: req.user.id } });
      // Pode ver se: corrida está aberta (AGUARDANDO), OU é o motoboy atribuído, OU tem proposta
      isMotoboy =
        mb &&
        (corrida.status === 'AGUARDANDO' ||
          corrida.motoboyId === mb.id ||
          corrida.propostas.some((p) => p.motoboyId === mb.id));
    }

    if (!isPassageiro && !isMotoboy && !isAdmin)
      return res.status(403).json({ success: false, message: 'Acesso negado' });

    // Expor info do motoboy de forma flatten para o frontend
    const corridaFormatada = {
      ...corrida,
      motoboy: corrida.motoboy
        ? {
            id: corrida.motoboy.id,
            nome: corrida.motoboy.user.name,
            telefone: corrida.motoboy.user.phone,
            avatar: corrida.motoboy.user.avatar,
            rating: corrida.motoboy.user.rating,
            vehicle: corrida.motoboy.vehicle,
            plate: corrida.motoboy.plate,
            lat: corrida.motoboy.lat,
            lng: corrida.motoboy.lng,
          }
        : null,
    };

    return res.json({ success: true, data: corridaFormatada });
  } catch (err) {
    next(err);
  }
};

// DELETE /api/corridas/:id  (cancelar - passageiro)
exports.cancelarCorrida = async (req, res, next) => {
  try {
    const corrida = await prisma.corrida.findUnique({ where: { id: req.params.id } });

    if (!corrida)
      return res.status(404).json({ success: false, message: 'Corrida não encontrada' });
    if (corrida.passageiroId !== req.user.id)
      return res.status(403).json({ success: false, message: 'Acesso negado' });
    if (!['AGUARDANDO', 'ACEITA'].includes(corrida.status))
      return res.status(400).json({ success: false, message: 'Não é possível cancelar corrida neste estado' });

    await prisma.corrida.update({
      where: { id: corrida.id },
      data: { status: 'CANCELADA' },
    });

    // Notificar motoboy se já havia aceito
    if (corrida.motoboyId) {
      const mb = await prisma.motoboy.findUnique({
        where: { id: corrida.motoboyId },
        select: { userId: true },
      });
      if (mb) req.io.to(`user:${mb.userId}`).emit('corrida:cancelada', { corridaId: corrida.id });
    }

    req.io.to(`corrida:${corrida.id}`).emit('corrida_status', { status: 'CANCELADA' });

    return res.json({ success: true, message: 'Corrida cancelada' });
  } catch (err) {
    next(err);
  }
};

// POST /api/corridas/:id/proposta  (motoboy envia proposta)
exports.enviarPropostaCorrida = async (req, res, next) => {
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
      return res.status(403).json({ success: false, message: 'Assinatura inativa. Assine um plano para receber corridas.' });

    const corrida = await prisma.corrida.findUnique({
      where: { id: req.params.id },
      select: { id: true, passageiroId: true, status: true, expiresAt: true },
    });

    if (!corrida)
      return res.status(404).json({ success: false, message: 'Corrida não encontrada' });
    if (corrida.status !== 'AGUARDANDO')
      return res.status(400).json({ success: false, message: 'Corrida não está mais disponível' });
    if (new Date() > corrida.expiresAt)
      return res.status(400).json({ success: false, message: 'Corrida expirada' });

    const jaEnviou = await prisma.propostaCorrida.findFirst({
      where: { corridaId: corrida.id, motoboyId: motoboy.id, status: 'PENDENTE' },
    });
    if (jaEnviou)
      return res.status(409).json({ success: false, message: 'Você já enviou uma proposta para esta corrida' });

    const { valor } = req.body;
    const proposta = await prisma.propostaCorrida.create({
      data: { corridaId: corrida.id, motoboyId: motoboy.id, valor: parseFloat(valor) },
      include: {
        motoboy: {
          select: {
            id: true, vehicle: true, plate: true,
            user: { select: { name: true, avatar: true, rating: true } },
          },
        },
      },
    });

    // Notificar passageiro
    req.io.to(`user:${corrida.passageiroId}`).emit('nova_proposta_corrida', {
      id: proposta.id,
      corridaId: corrida.id,
      valor: proposta.valor,
      status: proposta.status,
      motoboy: {
        id: proposta.motoboy.id,
        nome: proposta.motoboy.user.name,
        avatar: proposta.motoboy.user.avatar,
        rating: proposta.motoboy.user.rating,
        vehicle: proposta.motoboy.vehicle,
        plate: proposta.motoboy.plate,
      },
    });

    return res.status(201).json({ success: true, data: proposta });
  } catch (err) {
    next(err);
  }
};

// POST /api/corridas/:id/aceitar  (passageiro aceita proposta)
exports.aceitarPropostaCorrida = async (req, res, next) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty())
      return res.status(400).json({ success: false, message: 'Dados inválidos', errors: errors.array() });

    const corrida = await prisma.corrida.findUnique({
      where: { id: req.params.id },
    });

    if (!corrida)
      return res.status(404).json({ success: false, message: 'Corrida não encontrada' });
    if (corrida.passageiroId !== req.user.id)
      return res.status(403).json({ success: false, message: 'Acesso negado' });
    if (corrida.status !== 'AGUARDANDO')
      return res.status(400).json({ success: false, message: 'Corrida não está aguardando' });

    const { propostaId } = req.body;

    const proposta = await prisma.propostaCorrida.findUnique({
      where: { id: propostaId },
      include: { motoboy: { select: { id: true, userId: true } } },
    });

    if (!proposta || proposta.corridaId !== corrida.id)
      return res.status(404).json({ success: false, message: 'Proposta não encontrada' });
    if (proposta.status !== 'PENDENTE')
      return res.status(400).json({ success: false, message: 'Proposta não está pendente' });

    // Transação: aceitar proposta + rejeitar outras + atualizar corrida
    await prisma.$transaction([
      prisma.propostaCorrida.update({
        where: { id: proposta.id },
        data: { status: 'ACEITA' },
      }),
      prisma.propostaCorrida.updateMany({
        where: { corridaId: corrida.id, id: { not: proposta.id }, status: 'PENDENTE' },
        data: { status: 'REJEITADA' },
      }),
      prisma.corrida.update({
        where: { id: corrida.id },
        data: {
          status: 'ACEITA',
          motoboyId: proposta.motoboy.id,
          valorFinal: proposta.valor,
          aceitaAt: new Date(),
        },
      }),
    ]);

    // Notificar motoboy aceito
    req.io.to(`user:${proposta.motoboy.userId}`).emit('corrida_status', {
      corridaId: corrida.id,
      status: 'ACEITA',
    });

    // Notificar sala da corrida
    req.io.to(`corrida:${corrida.id}`).emit('corrida_status', {
      corridaId: corrida.id,
      status: 'ACEITA',
    });

    return res.json({ success: true, message: 'Proposta aceita' });
  } catch (err) {
    next(err);
  }
};

// PATCH /api/corridas/:id/status  (motoboy atualiza status: EM_ANDAMENTO / CONCLUIDA)
exports.atualizarStatusCorrida = async (req, res, next) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty())
      return res.status(400).json({ success: false, message: 'Dados inválidos', errors: errors.array() });

    const motoboy = await prisma.motoboy.findUnique({ where: { userId: req.user.id } });
    if (!motoboy)
      return res.status(403).json({ success: false, message: 'Acesso negado' });

    const corrida = await prisma.corrida.findUnique({ where: { id: req.params.id } });
    if (!corrida)
      return res.status(404).json({ success: false, message: 'Corrida não encontrada' });
    if (corrida.motoboyId !== motoboy.id)
      return res.status(403).json({ success: false, message: 'Acesso negado' });

    const { status } = req.body;
    const TRANSICOES = { ACEITA: ['EM_ANDAMENTO'], EM_ANDAMENTO: ['CONCLUIDA'] };

    if (!TRANSICOES[corrida.status]?.includes(status))
      return res.status(400).json({ success: false, message: `Transição inválida: ${corrida.status} → ${status}` });

    const updateData = { status };
    if (status === 'CONCLUIDA') {
      updateData.concluidaAt = new Date();
      // Incrementar totalTrips do passageiro e do motoboy
      await prisma.user.update({ where: { id: corrida.passageiroId }, data: { totalTrips: { increment: 1 } } });
      await prisma.user.update({ where: { id: motoboy.userId }, data: { totalTrips: { increment: 1 } } });
    }

    await prisma.corrida.update({ where: { id: corrida.id }, data: updateData });

    // Notificar passageiro e sala
    req.io.to(`user:${corrida.passageiroId}`).emit('corrida_status', { corridaId: corrida.id, status });
    req.io.to(`corrida:${corrida.id}`).emit('corrida_status', { corridaId: corrida.id, status });

    return res.json({ success: true, message: `Status atualizado para ${status}` });
  } catch (err) {
    next(err);
  }
};

// GET /api/corridas/disponiveis  (motoboy lista corridas abertas na área)
exports.corridasDisponiveis = async (req, res, next) => {  try {
    const motoboy = await prisma.motoboy.findUnique({
      where: { userId: req.user.id },
      include: { assinatura: true },
    });

    if (!motoboy || motoboy.status !== 'ACTIVE')
      return res.status(403).json({ success: false, message: 'Cadastro pendente de aprovação' });

    const corridas = await prisma.corrida.findMany({
      where: {
        status: 'AGUARDANDO',
        expiresAt: { gt: new Date() },
      },
      include: {
        passageiro: { select: { id: true, name: true, avatar: true, rating: true } },
      },
      orderBy: { createdAt: 'desc' },
    });

    // Filtrar por raio se motoboy tem posição
    let resultado = corridas;
    if (motoboy.lat && motoboy.lng) {
      resultado = corridas.filter(c => {
        const dist = haversineKm(motoboy.lat, motoboy.lng, c.origemLat, c.origemLng);
        return dist <= RAIO_KM;
      });
    }

    return res.json({ success: true, data: resultado });
  } catch (err) {
    next(err);
  }
};

// POST /api/corridas/:id/avaliar  (passageiro ou motoboy avalia após conclusão)
exports.avaliarCorrida = async (req, res, next) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty())
      return res.status(400).json({ success: false, message: 'Dados inválidos', errors: errors.array() });

    const corrida = await prisma.corrida.findUnique({ where: { id: req.params.id } });
    if (!corrida)
      return res.status(404).json({ success: false, message: 'Corrida não encontrada' });
    if (corrida.status !== 'CONCLUIDA')
      return res.status(400).json({ success: false, message: 'Corrida não finalizada' });

    // Verificar que o avaliador é parte da corrida
    const motoboy = req.user.role === 'MOTOBOY'
      ? await prisma.motoboy.findUnique({ where: { userId: req.user.id } })
      : null;

    const isPassageiro = corrida.passageiroId === req.user.id;
    const isMotoboy = motoboy && corrida.motoboyId === motoboy.id;
    if (!isPassageiro && !isMotoboy)
      return res.status(403).json({ success: false, message: 'Acesso negado' });

    const { avaliadoId, nota, comentario } = req.body;

    // Validar que o avaliado é a outra parte da corrida
    const motoboyDaCorrida = await prisma.motoboy.findUnique({
      where: { id: corrida.motoboyId },
      select: { userId: true },
    });
    const partesDaCorrida = [corrida.passageiroId, motoboyDaCorrida?.userId].filter(Boolean);
    if (!partesDaCorrida.includes(avaliadoId))
      return res.status(400).json({ success: false, message: 'Avaliado não participa desta corrida' });
    if (avaliadoId === req.user.id)
      return res.status(400).json({ success: false, message: 'Não é possível avaliar a si mesmo' });

    const jaAvaliou = await prisma.avaliacao.findFirst({
      where: { pedidoId: corrida.id, avaliadorId: req.user.id },
    });
    if (jaAvaliou)
      return res.status(409).json({ success: false, message: 'Você já avaliou esta corrida' });

    const avaliacao = await prisma.avaliacao.create({
      data: {
        pedidoId: corrida.id,
        avaliadorId: req.user.id,
        avaliadoId,
        nota: parseInt(nota),
        comentario,
      },
    });

    // Recalcular rating (média das últimas 50 avaliações)
    const avaliacoes = await prisma.avaliacao.findMany({
      where: { avaliadoId },
      orderBy: { createdAt: 'desc' },
      take: 50,
      select: { nota: true },
    });
    if (avaliacoes.length > 0) {
      const media = avaliacoes.reduce((s, a) => s + a.nota, 0) / avaliacoes.length;
      await prisma.user.update({ where: { id: avaliadoId }, data: { rating: media } });
    }

    return res.status(201).json({ success: true, data: avaliacao });
  } catch (err) {
    next(err);
  }
};
