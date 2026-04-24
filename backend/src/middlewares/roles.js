module.exports = (...allowedRoles) => (req, res, next) => {
  if (!req.user)
    return res.status(401).json({ success: false, message: 'Não autenticado' });

  if (!allowedRoles.includes(req.user.role))
    return res.status(403).json({ success: false, message: 'Acesso negado' });

  next();
};
