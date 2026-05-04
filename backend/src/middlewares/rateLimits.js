/**
 * Rate limiters centralizados
 *
 * Estratégia por tipo de rota:
 *  loginLimiter      — 5 tentativas / 15 min por IP  (anti brute-force)
 *  registerLimiter   — 10 cadastros / hora por IP
 *  uploadLimiter     — 10 uploads / hora por IP
 *  strictLimiter     — 30 req / min por IP  (operações sensíveis: propostas, corridas)
 *  apiLimiter        — 100 req / min por IP  (geral autenticado)
 *  userLimiter       — 300 req / min por user ID  (evita abuso de contas legítimas)
 */

const rateLimit = require('express-rate-limit');

const BASE_OPTS = {
  standardHeaders: true,  // Retorna RateLimit-* headers (RFC 6585)
  legacyHeaders: false,
};

// ── Login: proteção contra brute-force ──────────────────────────────────────
exports.loginLimiter = rateLimit({
  ...BASE_OPTS,
  windowMs: 15 * 60 * 1000,   // 15 min
  max: 5,
  skipSuccessfulRequests: true, // só conta falhas — não penaliza login bem-sucedido
  message: { success: false, message: 'Muitas tentativas de login. Aguarde 15 minutos.' },
});

// ── Cadastro: evita criação em massa de contas ───────────────────────────────
exports.registerLimiter = rateLimit({
  ...BASE_OPTS,
  windowMs: 60 * 60 * 1000,   // 1 hora
  max: 10,
  message: { success: false, message: 'Limite de cadastros atingido. Tente novamente em 1 hora.' },
});

// ── Upload de documentos ─────────────────────────────────────────────────────
exports.uploadLimiter = rateLimit({
  ...BASE_OPTS,
  windowMs: 60 * 60 * 1000,   // 1 hora
  max: 10,
  message: { success: false, message: 'Limite de uploads atingido. Tente novamente em 1 hora.' },
});

// ── Operações sensíveis (propostas, corridas, webhooks) ──────────────────────
exports.strictLimiter = rateLimit({
  ...BASE_OPTS,
  windowMs: 60 * 1000,        // 1 min
  max: 30,
  message: { success: false, message: 'Muitas requisições. Tente novamente em 1 minuto.' },
});

// ── API geral: fallback para rotas não cobertas ──────────────────────────────
exports.apiLimiter = rateLimit({
  ...BASE_OPTS,
  windowMs: 60 * 1000,        // 1 min
  max: 100,
  message: { success: false, message: 'Muitas requisições. Tente novamente em 1 minuto.' },
});

// ── Por usuário autenticado (chave = user ID, não IP) ────────────────────────
// Aplica DEPOIS do middleware auth.js (req.user já disponível)
exports.userLimiter = rateLimit({
  ...BASE_OPTS,
  windowMs: 60 * 1000,        // 1 min
  max: 300,
  keyGenerator: (req) => req.user?.id || req.ip,
  message: { success: false, message: 'Limite por usuário atingido. Aguarde 1 minuto.' },
});
