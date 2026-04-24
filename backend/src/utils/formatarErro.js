exports.formatarErro = (err) => ({
  message: err.message || 'Erro interno',
  stack: process.env.NODE_ENV === 'development' ? err.stack : undefined,
});
