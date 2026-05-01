const router = require('express').Router();
const { body } = require('express-validator');
const ctrl = require('../controllers/corridaController');
const auth = require('../middlewares/auth');
const roles = require('../middlewares/roles');

// POST /api/corridas/calcular — retorna distância, tempo e valor sugerido (sem criar corrida)
router.post(
  '/corridas/calcular',
  auth,
  [
    body('origemLat').isFloat().withMessage('origemLat inválido'),
    body('origemLng').isFloat().withMessage('origemLng inválido'),
    body('destinoLat').isFloat().withMessage('destinoLat inválido'),
    body('destinoLng').isFloat().withMessage('destinoLng inválido'),
  ],
  ctrl.calcularValorCorrida,
);

// POST /api/corridas — passageiro solicita corrida
router.post(
  '/corridas',
  auth,
  roles('CLIENT'),
  [
    body('origemEndereco').notEmpty().withMessage('origemEndereco obrigatório'),
    body('origemLat').isFloat().withMessage('origemLat inválido'),
    body('origemLng').isFloat().withMessage('origemLng inválido'),
    body('destinoEndereco').notEmpty().withMessage('destinoEndereco obrigatório'),
    body('destinoLat').isFloat().withMessage('destinoLat inválido'),
    body('destinoLng').isFloat().withMessage('destinoLng inválido'),
    body('valorSugerido').isFloat({ min: 7 }).withMessage('valorSugerido deve ser no mínimo R$ 7,00'),
  ],
  ctrl.criarCorrida,
);

// GET /api/corridas/disponiveis — motoboy lista corridas abertas na área
router.get('/corridas/disponiveis', auth, roles('MOTOBOY'), ctrl.corridasDisponiveis);

// GET /api/corridas/:id — detalhes (passageiro ou motoboy da corrida)
router.get('/corridas/:id', auth, ctrl.obterCorrida);

// DELETE /api/corridas/:id — passageiro cancela
router.delete('/corridas/:id', auth, roles('CLIENT'), ctrl.cancelarCorrida);

// POST /api/corridas/:id/proposta — motoboy envia proposta
router.post(
  '/corridas/:id/proposta',
  auth,
  roles('MOTOBOY'),
  [
    body('valor').isFloat({ min: 1 }).withMessage('valor inválido'),
  ],
  ctrl.enviarPropostaCorrida,
);

// POST /api/corridas/:id/aceitar — passageiro aceita proposta
router.post(
  '/corridas/:id/aceitar',
  auth,
  roles('CLIENT'),
  [
    body('propostaId').notEmpty().withMessage('propostaId obrigatório'),
  ],
  ctrl.aceitarPropostaCorrida,
);

// PATCH /api/corridas/:id/status — motoboy atualiza status
router.patch(
  '/corridas/:id/status',
  auth,
  roles('MOTOBOY'),
  [
    body('status').isIn(['EM_ANDAMENTO', 'CONCLUIDA']).withMessage('status inválido'),
  ],
  ctrl.atualizarStatusCorrida,
);

module.exports = router;
