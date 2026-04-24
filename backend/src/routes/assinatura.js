const router = require('express').Router();
const ctrl = require('../controllers/assinaturaController');
const auth = require('../middlewares/auth');
const roles = require('../middlewares/roles');

router.get('/planos', ctrl.listarPlanos);
router.post('/assinatura/criar', auth, roles('MOTOBOY'), ctrl.criarAssinatura);
router.post('/assinatura/webhook', ctrl.webhook);
router.get('/assinatura/status', auth, roles('MOTOBOY'), ctrl.statusAssinatura);
router.delete('/assinatura/cancelar', auth, roles('MOTOBOY'), ctrl.cancelarAssinatura);

module.exports = router;
