const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

module.exports = async (req, res, next) => {
  try {
    if (req.user.role !== 'MOTOBOY') return next();

    const motoboy = await prisma.motoboy.findUnique({
      where: { userId: req.user.id },
      include: { assinatura: true },
    });

    if (!motoboy || motoboy.status !== 'ACTIVE')
      return res.status(403).json({ success: false, message: 'Cadastro inativo ou pendente' });

    if (!motoboy.assinatura || motoboy.assinatura.status !== 'ACTIVE')
      return res.status(403).json({ success: false, message: 'Assinatura inativa' });

    next();
  } catch (err) {
    next(err);
  }
};
