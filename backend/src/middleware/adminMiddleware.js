const adminMiddleware = (req, res, next) => {
  if (!req.usuario) {  // ⭐ Usar req.usuario
    return res.status(401).json({ error: 'No autenticado' });
  }

  if (req.usuario.rol !== 'admin') {  // ⭐ Usar req.usuario
    return res.status(403).json({ error: 'Acceso denegado. Solo administradores.' });
  }

  next();
};

module.exports = { adminMiddleware };