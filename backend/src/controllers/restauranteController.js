const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

// ─────────────────────────────────────────────
// PUBLIC
// ─────────────────────────────────────────────

// GET /api/restaurantes
exports.listar = async (req, res, next) => {
  try {
    const { categoria, busca } = req.query;
    const where = { ativa: true };
    if (categoria && categoria !== 'Todos') where.categoria = categoria;
    if (busca) where.nome = { contains: busca, mode: 'insensitive' };

    const restaurantes = await prisma.restaurante.findMany({
      where,
      select: {
        id: true, nome: true, descricao: true,
        categoria: true, logo: true, endereco: true,
        _count: { select: { produtos: true } },
      },
      orderBy: { createdAt: 'desc' },
    });
    return res.json({ success: true, data: restaurantes });
  } catch (err) { next(err); }
};

// GET /api/restaurantes/:id
exports.detalhe = async (req, res, next) => {
  try {
    const restaurante = await prisma.restaurante.findUnique({
      where: { id: req.params.id },
      include: {
        categorias: {
          include: {
            produtos: { where: { disponivel: true }, orderBy: { nome: 'asc' } },
          },
          orderBy: { nome: 'asc' },
        },
      },
    });
    if (!restaurante || !restaurante.ativa)
      return res.status(404).json({ success: false, message: 'Restaurante não encontrado' });
    return res.json({ success: true, data: restaurante });
  } catch (err) { next(err); }
};

// ─────────────────────────────────────────────
// PEDIDOS (CLIENT)
// ─────────────────────────────────────────────

// POST /api/restaurantes/:id/pedido
exports.criarPedido = async (req, res, next) => {
  try {
    const { itens, observacoes, nomeCliente } = req.body;

    if (!Array.isArray(itens) || itens.length === 0)
      return res.status(400).json({ success: false, message: 'Carrinho vazio.' });

    const restaurante = await prisma.restaurante.findUnique({
      where: { id: req.params.id },
    });
    if (!restaurante || !restaurante.ativa)
      return res.status(404).json({ success: false, message: 'Restaurante não encontrado' });

    // Validar produtos e calcular total
    const produtosIds = itens.map(i => i.produtoId);
    const produtos = await prisma.produtoCardapio.findMany({
      where: { id: { in: produtosIds }, restauranteId: req.params.id, disponivel: true },
    });

    if (produtos.length !== produtosIds.length)
      return res.status(400).json({ success: false, message: 'Um ou mais produtos inválidos.' });

    const produtoMap = Object.fromEntries(produtos.map(p => [p.id, p]));
    let total = 0;
    const itensData = itens.map(item => {
      const prod = produtoMap[item.produtoId];
      const qtd = Math.max(1, parseInt(item.quantidade) || 1);
      total += prod.preco * qtd;
      return { nome: prod.nome, preco: prod.preco, quantidade: qtd, imagem: prod.imagem || null };
    });

    // Próximo número do pedido
    const ultimo = await prisma.pedidoRestaurante.findFirst({
      where: { restauranteId: req.params.id },
      orderBy: { numero: 'desc' },
      select: { numero: true },
    });
    const numero = (ultimo?.numero || 0) + 1;

    const pedido = await prisma.pedidoRestaurante.create({
      data: {
        numero,
        nomeCliente: nomeCliente || req.user?.name || '-',
        total: parseFloat(total.toFixed(2)),
        observacoes: observacoes || null,
        restauranteId: req.params.id,
        clienteId: req.user?.id || null,
        itens: { create: itensData },
      },
      include: { itens: true },
    });

    // Notificar cozinha em tempo real
    if (req.io) {
      req.io.to(`restaurante:${req.params.id}`).emit('restaurante:novo_pedido', pedido);
    }

    return res.status(201).json({ success: true, data: pedido });
  } catch (err) { next(err); }
};

// GET /api/restaurantes/pedido/:pedidoId
exports.statusPedido = async (req, res, next) => {
  try {
    const pedido = await prisma.pedidoRestaurante.findUnique({
      where: { id: req.params.pedidoId },
      include: {
        itens: true,
        restaurante: { select: { id: true, nome: true, logo: true } },
      },
    });
    if (!pedido) return res.status(404).json({ success: false, message: 'Pedido não encontrado' });
    return res.json({ success: true, data: pedido });
  } catch (err) { next(err); }
};

// ─────────────────────────────────────────────
// ADMIN — Restaurantes
// ─────────────────────────────────────────────

// GET /api/admin/restaurantes
exports.adminListar = async (req, res, next) => {
  try {
    const restaurantes = await prisma.restaurante.findMany({
      include: {
        _count: { select: { produtos: true, pedidos: true } },
      },
      orderBy: { createdAt: 'desc' },
    });
    return res.json({ success: true, data: restaurantes });
  } catch (err) { next(err); }
};

// POST /api/admin/restaurantes
exports.adminCriar = async (req, res, next) => {
  try {
    const { nome, descricao, categoria, logo, endereco } = req.body;
    if (!nome) return res.status(400).json({ success: false, message: 'Nome obrigatório' });
    const r = await prisma.restaurante.create({
      data: { nome, descricao: descricao || null, categoria: categoria || 'Restaurante', logo: logo || null, endereco: endereco || null },
    });
    return res.status(201).json({ success: true, data: r });
  } catch (err) { next(err); }
};

// PUT /api/admin/restaurantes/:id
exports.adminEditar = async (req, res, next) => {
  try {
    const { nome, descricao, categoria, logo, endereco, ativa } = req.body;
    const r = await prisma.restaurante.update({
      where: { id: req.params.id },
      data: {
        ...(nome !== undefined && { nome }),
        ...(descricao !== undefined && { descricao }),
        ...(categoria !== undefined && { categoria }),
        ...(logo !== undefined && { logo }),
        ...(endereco !== undefined && { endereco }),
        ...(ativa !== undefined && { ativa: Boolean(ativa) }),
      },
    });
    return res.json({ success: true, data: r });
  } catch (err) { next(err); }
};

// DELETE /api/admin/restaurantes/:id
exports.adminDeletar = async (req, res, next) => {
  try {
    await prisma.restaurante.update({ where: { id: req.params.id }, data: { ativa: false } });
    return res.json({ success: true });
  } catch (err) { next(err); }
};

// ─────────────────────────────────────────────
// ADMIN — Categorias
// ─────────────────────────────────────────────

// POST /api/admin/restaurantes/:id/categorias
exports.adminCriarCategoria = async (req, res, next) => {
  try {
    const { nome, icone } = req.body;
    if (!nome) return res.status(400).json({ success: false, message: 'Nome obrigatório' });
    const c = await prisma.categoriaCardapio.create({
      data: { nome, icone: icone || '🍽️', restauranteId: req.params.id },
    });
    return res.status(201).json({ success: true, data: c });
  } catch (err) { next(err); }
};

// DELETE /api/admin/categorias/:catId
exports.adminDeletarCategoria = async (req, res, next) => {
  try {
    const cat = await prisma.categoriaCardapio.findUnique({ where: { id: req.params.catId } });
    if (!cat) return res.status(404).json({ success: false, message: 'Categoria não encontrada' });
    await prisma.categoriaCardapio.delete({ where: { id: req.params.catId } });
    return res.json({ success: true });
  } catch (err) { next(err); }
};

// ─────────────────────────────────────────────
// ADMIN — Produtos
// ─────────────────────────────────────────────

// POST /api/admin/restaurantes/:id/produtos
exports.adminCriarProduto = async (req, res, next) => {
  try {
    const { nome, preco, descricao, imagem, categoriaId } = req.body;
    if (!nome || preco === undefined || !categoriaId)
      return res.status(400).json({ success: false, message: 'nome, preco e categoriaId são obrigatórios' });
    const p = await prisma.produtoCardapio.create({
      data: {
        nome, preco: parseFloat(preco),
        descricao: descricao || null,
        imagem: imagem || null,
        categoriaId,
        restauranteId: req.params.id,
      },
    });
    return res.status(201).json({ success: true, data: p });
  } catch (err) { next(err); }
};

// PUT /api/admin/produtos/:prodId
exports.adminEditarProduto = async (req, res, next) => {
  try {
    const { nome, preco, descricao, imagem, disponivel, categoriaId } = req.body;
    const p = await prisma.produtoCardapio.update({
      where: { id: req.params.prodId },
      data: {
        ...(nome !== undefined && { nome }),
        ...(preco !== undefined && { preco: parseFloat(preco) }),
        ...(descricao !== undefined && { descricao }),
        ...(imagem !== undefined && { imagem }),
        ...(disponivel !== undefined && { disponivel: Boolean(disponivel) }),
        ...(categoriaId !== undefined && { categoriaId }),
      },
    });
    return res.json({ success: true, data: p });
  } catch (err) { next(err); }
};

// DELETE /api/admin/produtos/:prodId
exports.adminDeletarProduto = async (req, res, next) => {
  try {
    await prisma.produtoCardapio.delete({ where: { id: req.params.prodId } });
    return res.json({ success: true });
  } catch (err) { next(err); }
};

// ─────────────────────────────────────────────
// ADMIN — Pedidos do restaurante
// ─────────────────────────────────────────────

// GET /api/admin/restaurantes/:id/pedidos
exports.adminListarPedidos = async (req, res, next) => {
  try {
    const { status } = req.query;
    const where = { restauranteId: req.params.id };
    if (status) where.status = status;
    const pedidos = await prisma.pedidoRestaurante.findMany({
      where,
      include: { itens: true },
      orderBy: { createdAt: 'desc' },
      take: 100,
    });
    return res.json({ success: true, data: pedidos });
  } catch (err) { next(err); }
};

// PATCH /api/admin/pedidos-restaurante/:pedidoId/status
exports.adminAtualizarStatus = async (req, res, next) => {
  try {
    const STATUS_VALIDOS = ['PENDENTE', 'PREPARANDO', 'PRONTO', 'CANCELADO', 'CONCLUIDO'];
    const { status } = req.body;
    if (!STATUS_VALIDOS.includes(status))
      return res.status(400).json({ success: false, message: 'Status inválido' });

    const pedido = await prisma.pedidoRestaurante.update({
      where: { id: req.params.pedidoId },
      data: { status },
      include: { itens: true },
    });

    // Notificar cliente em tempo real
    if (req.io) {
      req.io.to(`pedido_rest:${req.params.pedidoId}`).emit('restaurante:status', { status, pedidoId: req.params.pedidoId });
    }

    return res.json({ success: true, data: pedido });
  } catch (err) { next(err); }
};

// ─────────────────────────────────────────────
// LOJA — Owner endpoints
// ─────────────────────────────────────────────

// GET /api/restaurantes/minha-loja
exports.minhaLoja = async (req, res, next) => {
  try {
    const perfil = await prisma.lojaProfile.findUnique({
      where: { userId: req.user.id },
      include: { restaurante: true },
    });
    if (!perfil) return res.status(404).json({ success: false, message: 'Perfil de loja não encontrado' });
    return res.json({ success: true, data: perfil.restaurante || null });
  } catch (err) { next(err); }
};

// GET /api/restaurantes/minha-loja/pedidos
exports.minhaLojaPedidos = async (req, res, next) => {
  try {
    const perfil = await prisma.lojaProfile.findUnique({
      where: { userId: req.user.id },
      select: { restauranteId: true, restaurante: { select: { id: true, nome: true } } },
    });
    if (!perfil || !perfil.restauranteId)
      return res.json({ success: true, data: [], restaurante: null });

    const { status } = req.query;
    const where = { restauranteId: perfil.restauranteId };
    if (status) where.status = status;

    const pedidos = await prisma.pedidoRestaurante.findMany({
      where,
      include: {
        itens: {
          include: { produto: { select: { nome: true } } },
        },
      },
      orderBy: { createdAt: 'desc' },
      take: 100,
    });
    return res.json({ success: true, data: pedidos, restaurante: perfil.restaurante });
  } catch (err) { next(err); }
};

// PATCH /api/restaurantes/pedidos/:pedidoId/status
exports.lojaAtualizarStatus = async (req, res, next) => {
  try {
    const STATUS_VALIDOS = ['PREPARANDO', 'PRONTO', 'ENTREGANDO', 'ENTREGUE', 'CANCELADO'];
    const { status } = req.body;
    if (!STATUS_VALIDOS.includes(status))
      return res.status(400).json({ success: false, message: 'Status inválido' });

    const perfil = await prisma.lojaProfile.findUnique({
      where: { userId: req.user.id },
      select: { restauranteId: true },
    });
    if (!perfil?.restauranteId)
      return res.status(403).json({ success: false, message: 'Loja sem restaurante vinculado' });

    const pedido = await prisma.pedidoRestaurante.findUnique({ where: { id: req.params.pedidoId } });
    if (!pedido) return res.status(404).json({ success: false, message: 'Pedido não encontrado' });
    if (pedido.restauranteId !== perfil.restauranteId)
      return res.status(403).json({ success: false, message: 'Acesso negado' });

    const atualizado = await prisma.pedidoRestaurante.update({
      where: { id: req.params.pedidoId },
      data: { status },
      include: { itens: true },
    });

    if (req.io) {
      req.io.to(`pedido_rest:${req.params.pedidoId}`).emit('restaurante:status', { status, pedidoId: req.params.pedidoId });
      req.io.to(`restaurante:${perfil.restauranteId}`).emit('restaurante:status_atualizado', { pedidoId: req.params.pedidoId, status });
    }

    return res.json({ success: true, data: atualizado });
  } catch (err) { next(err); }
};
