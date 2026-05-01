-- CreateEnum
CREATE TYPE "CorridaStatus" AS ENUM ('AGUARDANDO', 'ACEITA', 'EM_ANDAMENTO', 'CONCLUIDA', 'CANCELADA', 'EXPIRADA');

-- CreateEnum
CREATE TYPE "PropostaCorridaStatus" AS ENUM ('PENDENTE', 'ACEITA', 'REJEITADA');

-- CreateTable
CREATE TABLE "Corrida" (
    "id" TEXT NOT NULL,
    "passageiroId" TEXT NOT NULL,
    "motoboyId" TEXT,
    "origemEndereco" TEXT NOT NULL,
    "origemLat" DOUBLE PRECISION NOT NULL,
    "origemLng" DOUBLE PRECISION NOT NULL,
    "destinoEndereco" TEXT NOT NULL,
    "destinoLat" DOUBLE PRECISION NOT NULL,
    "destinoLng" DOUBLE PRECISION NOT NULL,
    "distanciaKm" DOUBLE PRECISION NOT NULL,
    "tempoEstimadoMin" INTEGER NOT NULL,
    "valorSugerido" DOUBLE PRECISION NOT NULL,
    "valorFinal" DOUBLE PRECISION,
    "status" "CorridaStatus" NOT NULL DEFAULT 'AGUARDANDO',
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "aceitaAt" TIMESTAMP(3),
    "concluidaAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Corrida_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PropostaCorrida" (
    "id" TEXT NOT NULL,
    "corridaId" TEXT NOT NULL,
    "motoboyId" TEXT NOT NULL,
    "valor" DOUBLE PRECISION NOT NULL,
    "status" "PropostaCorridaStatus" NOT NULL DEFAULT 'PENDENTE',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "PropostaCorrida_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "Corrida" ADD CONSTRAINT "Corrida_passageiroId_fkey" FOREIGN KEY ("passageiroId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Corrida" ADD CONSTRAINT "Corrida_motoboyId_fkey" FOREIGN KEY ("motoboyId") REFERENCES "Motoboy"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PropostaCorrida" ADD CONSTRAINT "PropostaCorrida_corridaId_fkey" FOREIGN KEY ("corridaId") REFERENCES "Corrida"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PropostaCorrida" ADD CONSTRAINT "PropostaCorrida_motoboyId_fkey" FOREIGN KEY ("motoboyId") REFERENCES "Motoboy"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
