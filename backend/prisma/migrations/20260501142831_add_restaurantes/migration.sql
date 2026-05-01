-- CreateEnum
CREATE TYPE "StatusPedidoRestaurante" AS ENUM ('PENDENTE', 'PREPARANDO', 'PRONTO', 'CANCELADO', 'CONCLUIDO');

-- CreateTable
CREATE TABLE "Restaurante" (
    "id" TEXT NOT NULL,
    "nome" TEXT NOT NULL,
    "descricao" TEXT,
    "categoria" TEXT NOT NULL DEFAULT 'Restaurante',
    "logo" TEXT,
    "endereco" TEXT,
    "ativa" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Restaurante_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CategoriaCardapio" (
    "id" TEXT NOT NULL,
    "nome" TEXT NOT NULL,
    "icone" TEXT DEFAULT '🍽️',
    "restauranteId" TEXT NOT NULL,

    CONSTRAINT "CategoriaCardapio_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ProdutoCardapio" (
    "id" TEXT NOT NULL,
    "nome" TEXT NOT NULL,
    "preco" DOUBLE PRECISION NOT NULL,
    "descricao" TEXT,
    "imagem" TEXT,
    "disponivel" BOOLEAN NOT NULL DEFAULT true,
    "categoriaId" TEXT NOT NULL,
    "restauranteId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ProdutoCardapio_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PedidoRestaurante" (
    "id" TEXT NOT NULL,
    "numero" INTEGER NOT NULL,
    "nomeCliente" TEXT NOT NULL DEFAULT '-',
    "total" DOUBLE PRECISION NOT NULL,
    "observacoes" TEXT,
    "status" "StatusPedidoRestaurante" NOT NULL DEFAULT 'PENDENTE',
    "restauranteId" TEXT NOT NULL,
    "clienteId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "PedidoRestaurante_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ItemPedidoRestaurante" (
    "id" TEXT NOT NULL,
    "nome" TEXT NOT NULL,
    "preco" DOUBLE PRECISION NOT NULL,
    "quantidade" INTEGER NOT NULL DEFAULT 1,
    "imagem" TEXT,
    "pedidoId" TEXT NOT NULL,

    CONSTRAINT "ItemPedidoRestaurante_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "CategoriaCardapio_nome_restauranteId_key" ON "CategoriaCardapio"("nome", "restauranteId");

-- AddForeignKey
ALTER TABLE "CategoriaCardapio" ADD CONSTRAINT "CategoriaCardapio_restauranteId_fkey" FOREIGN KEY ("restauranteId") REFERENCES "Restaurante"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ProdutoCardapio" ADD CONSTRAINT "ProdutoCardapio_categoriaId_fkey" FOREIGN KEY ("categoriaId") REFERENCES "CategoriaCardapio"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ProdutoCardapio" ADD CONSTRAINT "ProdutoCardapio_restauranteId_fkey" FOREIGN KEY ("restauranteId") REFERENCES "Restaurante"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PedidoRestaurante" ADD CONSTRAINT "PedidoRestaurante_restauranteId_fkey" FOREIGN KEY ("restauranteId") REFERENCES "Restaurante"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PedidoRestaurante" ADD CONSTRAINT "PedidoRestaurante_clienteId_fkey" FOREIGN KEY ("clienteId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ItemPedidoRestaurante" ADD CONSTRAINT "ItemPedidoRestaurante_pedidoId_fkey" FOREIGN KEY ("pedidoId") REFERENCES "PedidoRestaurante"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
