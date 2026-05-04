const router = require('express').Router();
const { body } = require('express-validator');
const ctrl = require('../controllers/authController');
const auth = require('../middlewares/auth');
const { loginLimiter, registerLimiter, uploadLimiter } = require('../middlewares/rateLimits');

router.post('/register', registerLimiter, [
  body('name').trim().notEmpty().withMessage('Nome obrigatório'),
  body('email').isEmail().normalizeEmail().withMessage('E-mail inválido'),
  body('password').isLength({ min: 6 }).withMessage('Senha mínimo 6 caracteres'),
  body('phone').trim().notEmpty().withMessage('Telefone obrigatório'),
  body('role').optional().isIn(['CLIENT', 'MOTOBOY', 'LOJA']),
  body('tipo').optional().isIn(['PF', 'PJ']),
  body('documento').optional().trim().notEmpty(),
], ctrl.register);

router.post('/login', loginLimiter, [
  body('email').isEmail().normalizeEmail(),
  body('password').notEmpty(),
], ctrl.login);

router.get('/me', auth, ctrl.me);
router.post('/upload-docs', auth, uploadLimiter, ctrl.uploadDocs);
router.put('/fcm-token', auth, ctrl.updateFcmToken);

module.exports = router;
