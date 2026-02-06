const { Turno } = require('../models');

/**
 * Middleware para verificar que un cajero tenga un turno activo
 * Solo se aplica a usuarios con rol 'cajero'
 */
const verificarTurnoActivo = async (req, res, next) => {
  try {
    const usuario = req.usuario;
    
    // Si es administrador, permitir sin verificar turno
    if (usuario.rol === 'administrador') {
      return next();
    }
    
    // Si es cajero, DEBE tener un turno activo
    if (usuario.rol === 'cajero') {
      const turnoActivo = await Turno.findOne({
        where: {
          cajero_id: usuario.id,
          estado: 'abierto'
        }
      });
      
      if (!turnoActivo) {
        return res.status(403).json({ 
          error: 'No tienes un turno activo. Tu turno ha sido cerrado por administración.',
          codigo: 'TURNO_CERRADO'
        });
      }
      
      // Agregar info del turno al request para uso posterior
      req.turnoActivo = turnoActivo;
    }
    
    next();
  } catch (error) {
    console.error('Error en verificarTurnoActivo:', error);
    return res.status(500).json({ error: 'Error al verificar turno' });
  }
};

/**
 * Middleware para verificar que el cajero esté operando en su local asignado
 */
const verificarLocalDelTurno = async (req, res, next) => {
  try {
    const usuario = req.usuario;
    
    // Si es administrador, permitir sin verificar local
    if (usuario.rol === 'administrador') {
      return next();
    }
    
    // Si es cajero, verificar que opere en su local
    if (usuario.rol === 'cajero' && req.turnoActivo) {
      const localIdOperacion = req.body.local_id || req.query.local_id || req.params.local_id;
      
      if (localIdOperacion && localIdOperacion !== req.turnoActivo.local_id) {
        return res.status(403).json({ 
          error: 'No puedes operar en un local diferente al de tu turno',
          codigo: 'LOCAL_NO_AUTORIZADO'
        });
      }
    }
    
    next();
  } catch (error) {
    console.error('Error en verificarLocalDelTurno:', error);
    return res.status(500).json({ error: 'Error al verificar local' });
  }
};

module.exports = { 
  verificarTurnoActivo,
  verificarLocalDelTurno
};