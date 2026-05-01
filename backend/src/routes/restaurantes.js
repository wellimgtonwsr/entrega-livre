const router = require('express').Router();
const ctrl = require('../controllers/restauranteController');
const auth = require('../middlewares/auth');
const roles = require('../middlewares/roles');

// ─── Público ──────────────────────────────────────────────────────────────────
router.get('/restaurantes', ctrl.listar);
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
