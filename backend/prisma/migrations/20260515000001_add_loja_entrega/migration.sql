-- Add ENTREGANDO and ENTREGUE to StatusPedidoRestaurante enum
-- These must run outside a transaction in PostgreSQL
ALTER TYPE "StatusPedidoRestaurante" ADD VALUE IF NOT EXISTS 'ENTREGANDO';
ALTER TYPE "StatusPedidoRestaurante" ADD VALUE IF NOT EXISTS 'ENTREGUE';

-- Add entregaPropria field to PedidoRestaurante
ALTER TABLE "PedidoRestaurante" ADD COLUMN IF NOT EXISTS "entregaPropria" BOOLEAN NOT NULL DEFAULT true;
