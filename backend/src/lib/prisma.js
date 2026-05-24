const { PrismaClient } = require('@prisma/client');

// Singleton compartilhado entre todos os módulos — evita múltiplos connection pools
const prisma = new PrismaClient();

module.exports = prisma;
