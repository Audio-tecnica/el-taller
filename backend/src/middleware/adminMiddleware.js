const adminMiddleware = (req, res, next) => {
  // El authMiddleware ya validó el token y puso req.usuario
  if (!req.usuario) {
    return res.status(401).json({ 
      error: 'No autenticado' 
    });
  }

  if (req.usuario.rol !== 'administrador') {
    return res.status(403).json({ 
      error: 'Acceso denegado. Solo administradores pueden acceder a este recurso.' 
    });
  }

  next();
};

module.exports = adminMiddleware;
