const axios = require('axios');

const MAPS_API = 'https://maps.googleapis.com/maps/api/directions/json';

exports.calcularRota = async ({ origemLat, origemLng, destinoLat, destinoLng }) => {
  if (!process.env.GOOGLE_MAPS_API_KEY) {
    // Fallback: distância em linha reta
    const { calcularDistancia } = require('../utils/calcularDistancia');
    const dist = calcularDistancia(origemLat, origemLng, destinoLat, destinoLng);
    return { distanciaKm: dist, tempoEstimadoMin: Math.round((dist / 30) * 60) };
  }

  try {
    const res = await axios.get(MAPS_API, {
      params: {
        origin: `${origemLat},${origemLng}`,
        destination: `${destinoLat},${destinoLng}`,
        mode: 'driving',
        key: process.env.GOOGLE_MAPS_API_KEY,
      },
    });

    const route = res.data.routes?.[0]?.legs?.[0];
    if (!route) throw new Error('Rota não encontrada');

    return {
      distanciaKm: route.distance.value / 1000,
      tempoEstimadoMin: Math.ceil(route.duration.value / 60),
    };
  } catch (err) {
    console.error('[MAPS] Erro:', err.message);
    throw err;
  }
};
