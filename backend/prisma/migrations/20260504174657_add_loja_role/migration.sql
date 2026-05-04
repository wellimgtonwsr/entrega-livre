-- CreateEnum
CREATE TYPE "TipoLoja" AS ENUM ('PF', 'PJ');

-- AlterEnum
ALTER TYPE "Role" ADD VALUE 'LOJA';

-- CreateTable
CREATE TABLE "LojaProfile" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "tipo" "TipoLoja" NOT NULL DEFAULT 'PF',
    "documento" TEXT NOT NULL,
    "nomeFantasia" TEXT,
    "restauranteId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "LojaProfile_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "LojaProfile_userId_key" ON "LojaProfile"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "LojaProfile_restauranteId_key" ON "LojaProfile"("restauranteId");

-- AddForeignKey
ALTER TABLE "LojaProfile" ADD CONSTRAINT "LojaProfile_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "LojaProfile" ADD CONSTRAINT "LojaProfile_restauranteId_fkey" FOREIGN KEY ("restauranteId") REFERENCES "Restaurante"("id") ON DELETE SET NULL ON UPDATE CASCADE;
