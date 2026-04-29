const axios = require('axios');
const { calcularDistancia } = require('../utils/calcularDistancia');
const { calcularValor } = require('./precificacao.service');

const MAPS_API = 'https://maps.googleapis.com/maps/api/directions/json';

/**
 * Calcula rota real via Google Maps Directions API.
 * Fallback: distância Haversine se a chave não estiver configurada.
 * Retorna distanciaKm, tempoEstimadoMin e valorCalculado.
 */
exports.calcularRota = async ({ origemLat, origemLng, destinoLat, destinoLng }) => {
  let distanciaKm;
  let tempoEstimadoMin;

  if (!process.env.GOOGLE_MAPS_API_KEY) {
    // Fallback: distância em linha reta (Haversine)
    distanciaKm = calcularDistancia(origemLat, origemLng, destinoLat, destinoLng);
    tempoEstimadoMin = Math.round((distanciaKm / 30) * 60);
  } else {
    try {
      const res = await axios.get(MAPS_API, {
        params: {
          origin: `${origemLat},${origemLng}`,
          destination: `${destinoLat},${destinoLng}`,
          mode: 'driving',
          key: process.env.GOOGLE_MAPS_API_KEY,
        },
        timeout: 8000,
      });

      const route = res.data.routes?.[0]?.legs?.[0];
      if (!route) throw new Error('Rota não encontrada pelo Google Maps');

      distanciaKm = route.distance.value / 1000;
      tempoEstimadoMin = Math.ceil(route.duration.value / 60);
    } catch (err) {
      console.error('[MAPS] Erro ao chamar Google Maps, usando Haversine como fallback:', err.message);
      distanciaKm = calcularDistancia(origemLat, origemLng, destinoLat, destinoLng);
      tempoEstimadoMin = Math.round((distanciaKm / 30) * 60);
    }
  }

  return {
    distanciaKm: parseFloat(distanciaKm.toFixed(2)),
    tempoEstimadoMin,
    valorCalculado: calcularValor(distanciaKm),
  };
};
