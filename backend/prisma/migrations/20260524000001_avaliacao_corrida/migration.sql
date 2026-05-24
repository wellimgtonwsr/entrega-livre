-- AlterTable: tornar pedidoId opcional e adicionar corridaId em Avaliacao
ALTER TABLE "Avaliacao" ALTER COLUMN "pedidoId" DROP NOT NULL;
ALTER TABLE "Avaliacao" ADD COLUMN "corridaId" TEXT;

-- AddForeignKey
ALTER TABLE "Avaliacao" ADD CONSTRAINT "Avaliacao_corridaId_fkey"
  FOREIGN KEY ("corridaId") REFERENCES "Corrida"("id")
  ON DELETE SET NULL ON UPDATE CASCADE;
