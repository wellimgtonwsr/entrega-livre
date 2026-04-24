const router = require('express').Router();
const { body } = require('express-validator');
const ctrl = require('../controllers/propostaController');
const auth = require('../middlewares/auth');
const roles = require('../middlewares/roles');

router.post('/pedidos/:id/proposta', auth, roles('MOTOBOY'), [
  body('valor').isFloat({ min: 1 }).withMessage('Valor inválido'),
], ctrl.enviarProposta);

router.get('/pedidos/:id/propostas', auth, ctrl.listarPropostas);
router.post('/propostas/:id/aceitar', auth, roles('CLIENT'), ctrl.aceitarProposta);
router.post('/propostas/:id/recusar', auth, roles('CLIENT'), ctrl.recusarProposta);

module.exports = router;
