const argon2 = require('@node-rs/argon2');
const jwt = require('jsonwebtoken');
const { validationResult } = require('express-validator');
const { createClient } = require('@supabase/supabase-js');
const prisma = require('../lib/prisma');

const supabase = process.env.SUPABASE_URL
  ? createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_KEY)
  : null;

// Argon2id — parâmetros OWASP recomendados para autenticação interativa
const ARGON2_OPTIONS = {
  algorithm: 2, // argon2id
  memoryCost: 65536, // 64 MB
  timeCost: 3,
  parallelism: 2,
};

/**
 * Hash com Argon2id. Usado em cadastros novos e na migração transparente.
 */
const hashPassword = (plain) => argon2.hash(plain, ARGON2_OPTIONS);

/**
 * Verifica senha. Suporta migração transparente: se o hash for bcrypt ($2b/$2a)
 * faz fallback com bcrypt puro, retorna match + flag needsRehash para
 * re-hashar com Argon2id na próxima oportunidade.
 */
const verifyPassword = async (plain, hash) => {
  if (hash.startsWith('$2b$') || hash.startsWith('$2a$') || hash.startsWith('$2y$')) {
    // Hash legado — bcrypt. Usar verificação manual via timingSafeEqual.
    const bcrypt = require('bcryptjs');
    const match = await bcrypt.compare(plain, hash);
    return { match, needsRehash: match }; // se bateu, migra
  }
  const match = await argon2.verify(hash, plain);
  return { match, needsRehash: false };
};

const generateToken = (user) =>
  jwt.sign(
    { id: user.id, role: user.role },
    process.env.JWT_SECRET,
    { expiresIn: process.env.JWT_EXPIRES_IN || '7d' }
  );

const safeUser = (user) => {
  const { password, ...rest } = user;
  return rest;
};

// POST /api/auth/register
exports.register = async (req, res, next) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty())
      return res.status(400).json({ success: false, message: 'Dados inválidos', errors: errors.array() });

    const { name, email, password, phone, role, cnh, vehicle, plate } = req.body;

    const existing = await prisma.user.findUnique({ where: { email } });
    if (existing)
      return res.status(409).json({ success: false, message: 'E-mail já cadastrado' });

    const hashed = await hashPassword(password);
    const allowedRoles = ['CLIENT', 'MOTOBOY', 'LOJA'];
    const userRole = allowedRoles.includes(role) ? role : 'CLIENT';

    const user = await prisma.user.create({
      data: { name, email, password: hashed, phone, role: userRole },
    });

    if (userRole === 'MOTOBOY') {
      await prisma.motoboy.create({
        data: {
          userId: user.id,
          cnh: cnh || '',
          vehicle: vehicle || '',
          plate: plate || '',
        },
      });
    }

    if (userRole === 'LOJA') {
      const { tipo, documento, nomeFantasia } = req.body;
      if (!documento)
        return res.status(400).json({ success: false, message: 'CPF/CNPJ obrigatório para loja' });

      await prisma.lojaProfile.create({
        data: {
          userId: user.id,
          tipo: tipo === 'PJ' ? 'PJ' : 'PF',
          documento,
          nomeFantasia: nomeFantasia || name,
        },
      });
    }

    const token = generateToken(user);
    return res.status(201).json({ success: true, data: { token, user: safeUser(user) } });
  } catch (err) {
    next(err);
  }
};

// POST /api/auth/login
exports.login = async (req, res, next) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty())
      return res.status(400).json({ success: false, message: 'Dados inválidos', errors: errors.array() });

    const { email, password } = req.body;

    const user = await prisma.user.findUnique({
      where: { email },
      include: {
        motoboy: { include: { assinatura: true } },
        lojaProfile: true,
      },
    });

    if (!user) return res.status(401).json({ success: false, message: 'Credenciais inválidas' });

    const { match, needsRehash } = await verifyPassword(password, user.password);
    if (!match) return res.status(401).json({ success: false, message: 'Credenciais inválidas' });

    // Migração transparente: usuário ainda tem hash bcrypt → re-hashar com Argon2id
    if (needsRehash) {
      const newHash = await hashPassword(password);
      await prisma.user.update({ where: { id: user.id }, data: { password: newHash } });
    }

    const token = generateToken(user);
    return res.json({ success: true, data: { token, user: safeUser(user) } });
  } catch (err) {
    next(err);
  }
};

// GET /api/auth/me
exports.me = async (req, res, next) => {
  try {
    const user = await prisma.user.findUnique({
      where: { id: req.user.id },
      include: {
        motoboy: { include: { assinatura: { include: { plano: true } } } },
        lojaProfile: { include: { restaurante: true } },
      },
    });
    if (!user) return res.status(404).json({ success: false, message: 'Usuário não encontrado' });
    return res.json({ success: true, data: safeUser(user) });
  } catch (err) {
    next(err);
  }
};

// POST /api/auth/upload-docs
exports.uploadDocs = async (req, res, next) => {
  try {
    if (!supabase) return res.status(503).json({ success: false, message: 'Storage não configurado' });

    const motoboy = await prisma.motoboy.findUnique({ where: { userId: req.user.id } });
    if (!motoboy) return res.status(404).json({ success: false, message: 'Motoboy não encontrado' });

    const { cnhBase64, fileName } = req.body;
    if (!cnhBase64 || !fileName)
      return res.status(400).json({ success: false, message: 'Arquivo obrigatório' });

    // Sanitizar fileName: manter só caracteres seguros e limitar tamanho
    const safeName = fileName.replace(/[^a-zA-Z0-9._-]/g, '_').slice(0, 100);
    if (!safeName)
      return res.status(400).json({ success: false, message: 'Nome de arquivo inválido' });

    const buffer = Buffer.from(cnhBase64, 'base64');
    const path = `cnh/${motoboy.id}/${safeName}`;

    const { error } = await supabase.storage
      .from('documentos')
      .upload(path, buffer, { upsert: true, contentType: 'image/jpeg' });

    if (error) throw new Error(error.message);

    const { data: urlData } = supabase.storage.from('documentos').getPublicUrl(path);

    await prisma.motoboy.update({
      where: { id: motoboy.id },
      data: { cnhUrl: urlData.publicUrl },
    });

    return res.json({ success: true, data: { cnhUrl: urlData.publicUrl } });
  } catch (err) {
    next(err);
  }
};

// PUT /api/auth/fcm-token
exports.updateFcmToken = async (req, res, next) => {
  try {
    const { fcmToken } = req.body;
    if (!fcmToken)
      return res.status(400).json({ success: false, message: 'Token FCM obrigatório' });

    await prisma.user.update({
      where: { id: req.user.id },
      data: { fcmToken },
    });
    return res.json({ success: true, message: 'Token atualizado' });
  } catch (err) {
    next(err);
  }
};
