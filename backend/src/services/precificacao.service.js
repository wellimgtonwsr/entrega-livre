/**
 * Regras de precificação do Entrega Livre
 *
 * - Até 3,5 km  → R$ 7,00 (mínimo)
 * - Acima de 3,5 km → R$ 2,00 / km
 *
 * Exemplo:
 *   3 km  → R$ 7,00
 *   3.5km → R$ 7,00
 *   4 km  → R$ 8,00
 *   10 km → R$ 20,00
 */

const PRECO_POR_KM = 2.0;
const PRECO_MINIMO = 7.0;
const DISTANCIA_MINIMA_KM = 3.5;

/**
 * Calcula o valor da entrega com base na distância em km.
 * @param {number} distanciaKm
 * @returns {number} valor em R$
 */
exports.calcularValor = (distanciaKm) => {
  if (distanciaKm <= DISTANCIA_MINIMA_KM) return PRECO_MINIMO;
  return parseFloat((distanciaKm * PRECO_POR_KM).toFixed(2));
};
