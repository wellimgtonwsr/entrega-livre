const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { validationResult } = require('express-validator');
const { PrismaClient } = require('@prisma/client');
const { createClient } = require('@supabase/supabase-js');

const prisma = new PrismaClient();

const supabase = process.env.SUPABASE_URL
  ? createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_KEY)
  : null;

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

    const hashed = await bcrypt.hash(password, 10);
    const userRole = role === 'MOTOBOY' ? 'MOTOBOY' : 'CLIENT';

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
      include: { motoboy: { include: { assinatura: true } } },
    });

    if (!user || !(await bcrypt.compare(password, user.password)))
      return res.status(401).json({ success: false, message: 'Credenciais inválidas' });

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
      include: { motoboy: { include: { assinatura: { include: { plano: true } } } } },
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

    const buffer = Buffer.from(cnhBase64, 'base64');
    const path = `cnh/${motoboy.id}/${fileName}`;

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
