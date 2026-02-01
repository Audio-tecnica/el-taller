const adminMiddleware = (req, res, next) => {
  if (!req.usuario) {
    return res.status(401).json({ error: 'No autenticado' });
  }

  // ⭐ Aceptar tanto 'admin' como 'administrador'
  const rolesAdmin = ['admin', 'administrador'];
  if (!rolesAdmin.includes(req.usuario.rol)) {
    return res.status(403).json({ error: 'Acceso denegado. Solo administradores.' });
  }

  next();
};

module.exports = { adminMiddleware };