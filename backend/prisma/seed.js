/**
 * Seed — 6 usuários de teste
 *
 * Logins:
 *  1. cliente@teste.com      / 123456   (CLIENT)
 *  2. motoboy@teste.com      / 123456   (MOTOBOY)
 *  3. admin@teste.com        / 123456   (ADMIN)
 *  4. loja.pf@teste.com      / 123456   (LOJA - Pessoa Física)
 *  5. loja.pj@teste.com      / 123456   (LOJA - Pessoa Jurídica)
 *  6. passageiro@teste.com   / 123456   (CLIENT - usa mototaxi)
 */

const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');

const prisma = new PrismaClient();

async function main() {
  const senha = await bcrypt.hash('123456', 10);

  // 1. Cliente
  const cliente = await prisma.user.upsert({
    where: { email: 'cliente@teste.com' },
    update: {},
    create: { name: 'Ana Cliente', email: 'cliente@teste.com', password: senha, phone: '(11) 91111-0001', role: 'CLIENT' },
  });

  // 2. Motoboy
  const motoboyUser = await prisma.user.upsert({
    where: { email: 'motoboy@teste.com' },
    update: {},
    create: { name: 'Bruno Motoboy', email: 'motoboy@teste.com', password: senha, phone: '(11) 92222-0002', role: 'MOTOBOY' },
  });
  await prisma.motoboy.upsert({
    where: { userId: motoboyUser.id },
    update: {},
    create: {
      userId: motoboyUser.id,
      cnh: '12345678901',
      vehicle: 'Honda CG 160',
      plate: 'BRA-2025',
      status: 'ACTIVE',
    },
  });

  // 3. Admin
  await prisma.user.upsert({
    where: { email: 'admin@teste.com' },
    update: {},
    create: { name: 'Carlos Admin', email: 'admin@teste.com', password: senha, phone: '(11) 93333-0003', role: 'ADMIN' },
  });

  // 4. Loja PF
  const lojaPF = await prisma.user.upsert({
    where: { email: 'loja.pf@teste.com' },
    update: {},
    create: { name: 'Diana Doces', email: 'loja.pf@teste.com', password: senha, phone: '(11) 94444-0004', role: 'LOJA' },
  });
  await prisma.lojaProfile.upsert({
    where: { userId: lojaPF.id },
    update: {},
    create: {
      userId: lojaPF.id,
      tipo: 'PF',
      documento: '123.456.789-01',
      nomeFantasia: 'Doceria da Diana',
    },
  });

  // 5. Loja PJ
  const lojaPJ = await prisma.user.upsert({
    where: { email: 'loja.pj@teste.com' },
    update: {},
    create: { name: 'Eduardo Burguer LTDA', email: 'loja.pj@teste.com', password: senha, phone: '(11) 95555-0005', role: 'LOJA' },
  });
  await prisma.lojaProfile.upsert({
    where: { userId: lojaPJ.id },
    update: {},
    create: {
      userId: lojaPJ.id,
      tipo: 'PJ',
      documento: '12.345.678/0001-99',
      nomeFantasia: 'Burger do Eduardo',
    },
  });

  // 6. Passageiro (usa mototaxi, role CLIENT)
  await prisma.user.upsert({
    where: { email: 'passageiro@teste.com' },
    update: {},
    create: { name: 'Fernanda Passageira', email: 'passageiro@teste.com', password: senha, phone: '(11) 96666-0006', role: 'CLIENT' },
  });

  console.log('\n✅ Seed concluído! Usuários criados:\n');
  console.table([
    { email: 'cliente@teste.com',    senha: '123456', role: 'CLIENT' },
    { email: 'motoboy@teste.com',    senha: '123456', role: 'MOTOBOY' },
    { email: 'admin@teste.com',      senha: '123456', role: 'ADMIN' },
    { email: 'loja.pf@teste.com',    senha: '123456', role: 'LOJA (PF)' },
    { email: 'loja.pj@teste.com',    senha: '123456', role: 'LOJA (PJ)' },
    { email: 'passageiro@teste.com', senha: '123456', role: 'CLIENT (mototaxi)' },
  ]);
}

main()
  .catch((e) => { console.error(e); process.exit(1); })
  .finally(() => prisma.$disconnect());
