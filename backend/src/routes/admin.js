const router = require('express').Router();
const ctrl = require('../controllers/adminController');
const auth = require('../middlewares/auth');
const roles = require('../middlewares/roles');

router.use(auth, roles('ADMIN'));

router.get('/motoboys', ctrl.listarMotoboys);
router.put('/motoboy/:id/aprovar', ctrl.aprovarMotoboy);
router.put('/motoboy/:id/status', ctrl.alterarStatusMotoboy);
router.get('/pedidos', ctrl.listarPedidos);
router.get('/receita', ctrl.receita);
router.get('/metricas', ctrl.metricas);

module.exports = router;
