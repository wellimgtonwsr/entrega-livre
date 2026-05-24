const router = require('express').Router();
const ctrl = require('../controllers/restauranteController');
const auth = require('../middlewares/auth');
const roles = require('../middlewares/roles');

// ─── Público ──────────────────────────────────────────────────────────────────
router.get('/restaurantes', ctrl.listar);

// ─── Loja (owner) — deve vir ANTES de /:id para não ser capturado pelo wildcard ──
router.get('/restaurantes/minha-loja', auth, roles('LOJA'), ctrl.minhaLoja);
router.get('/restaurantes/minha-loja/pedidos', auth, roles('LOJA'), ctrl.minhaLojaPedidos);
router.patch('/restaurantes/pedidos/:pedidoId/status', auth, roles('LOJA'), ctrl.lojaAtualizarStatus);

// ─── Loja — Catálogo (categorias + produtos) ──────────────────────────────────
router.get('/loja/catalogo', auth, roles('LOJA'), ctrl.lojaCatalogo);
router.post('/loja/categorias', auth, roles('LOJA'), ctrl.lojaCriarCategoria);
router.put('/loja/categorias/:catId', auth, roles('LOJA'), ctrl.lojaEditarCategoria);
router.delete('/loja/categorias/:catId', auth, roles('LOJA'), ctrl.lojaDeletarCategoria);
router.post('/loja/produtos', auth, roles('LOJA'), ctrl.lojaCriarProduto);
router.put('/loja/produtos/:prodId', auth, roles('LOJA'), ctrl.lojaEditarProduto);
router.delete('/loja/produtos/:prodId', auth, roles('LOJA'), ctrl.lojaDeletarProduto);
router.patch('/loja/pedidos/:pedidoId/entrega-propria', auth, roles('LOJA'), ctrl.lojaSetEntregaPropria);

// ─── Detalhe público (após rotas fixas) ───────────────────────────────────────
router.get('/restaurantes/:id', ctrl.detalhe);

// ─── Cliente autenticado ──────────────────────────────────────────────────────
router.post('/restaurantes/:id/pedido', auth, ctrl.criarPedido);
router.get('/restaurantes/pedido/:pedidoId', auth, ctrl.statusPedido);

// ─── Admin — restaurantes ─────────────────────────────────────────────────────
router.get('/admin/restaurantes', auth, roles('ADMIN'), ctrl.adminListar);
router.post('/admin/restaurantes', auth, roles('ADMIN'), ctrl.adminCriar);
router.put('/admin/restaurantes/:id', auth, roles('ADMIN'), ctrl.adminEditar);
router.delete('/admin/restaurantes/:id', auth, roles('ADMIN'), ctrl.adminDeletar);

// ─── Admin — categorias ────────────────────────────────────────────────────────
router.post('/admin/restaurantes/:id/categorias', auth, roles('ADMIN'), ctrl.adminCriarCategoria);
router.delete('/admin/categorias/:catId', auth, roles('ADMIN'), ctrl.adminDeletarCategoria);

// ─── Admin — produtos ─────────────────────────────────────────────────────────
router.post('/admin/restaurantes/:id/produtos', auth, roles('ADMIN'), ctrl.adminCriarProduto);
router.put('/admin/produtos/:prodId', auth, roles('ADMIN'), ctrl.adminEditarProduto);
router.delete('/admin/produtos/:prodId', auth, roles('ADMIN'), ctrl.adminDeletarProduto);

// ─── Admin — pedidos do restaurante ───────────────────────────────────────────
router.get('/admin/restaurantes/:id/pedidos', auth, roles('ADMIN'), ctrl.adminListarPedidos);
router.patch('/admin/pedidos-restaurante/:pedidoId/status', auth, roles('ADMIN'), ctrl.adminAtualizarStatus);

module.exports = router;
