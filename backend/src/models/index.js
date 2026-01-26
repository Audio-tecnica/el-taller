const sequelize = require('../config/database');

// Importar modelos
const Usuario = require('./Usuario');
const Local = require('./Local');
const Mesa = require('./Mesa');
const Categoria = require('./Categoria');
const Producto = require('./Producto');
const Pedido = require('./Pedido');
const DetallePedido = require('./DetallePedido');
const Cortesia = require('./Cortesia');
const Turno = require('./Turno');
const MovimientoInventario = require('./MovimientoInventario');

// ============ RELACIONES ============

// Usuarios - Locales
Usuario.belongsTo(Local, { foreignKey: 'local_id', as: 'local' });
Local.hasMany(Usuario, { foreignKey: 'local_id', as: 'usuarios' });

// Mesas - Locales
Mesa.belongsTo(Local, { foreignKey: 'local_id', as: 'local' });
Local.hasMany(Mesa, { foreignKey: 'local_id', as: 'mesas' });

// Productos - Categorías
Producto.belongsTo(Categoria, { foreignKey: 'categoria_id', as: 'categoria' });
Categoria.hasMany(Producto, { foreignKey: 'categoria_id', as: 'productos' });

// Pedidos - Mesa
Pedido.belongsTo(Mesa, { foreignKey: 'mesa_id', as: 'mesa' });
Mesa.hasMany(Pedido, { foreignKey: 'mesa_id', as: 'pedidos' });

// Pedidos - Usuario (mesero)
Pedido.belongsTo(Usuario, { foreignKey: 'usuario_id', as: 'usuario' });
Usuario.hasMany(Pedido, { foreignKey: 'usuario_id', as: 'pedidos' });

// Pedidos - Local
Pedido.belongsTo(Local, { foreignKey: 'local_id', as: 'local' });
Local.hasMany(Pedido, { foreignKey: 'local_id', as: 'pedidos' });

// DetallePedido - Pedido
DetallePedido.belongsTo(Pedido, { foreignKey: 'pedido_id', as: 'pedido' });
Pedido.hasMany(DetallePedido, { foreignKey: 'pedido_id', as: 'detalles' });

// DetallePedido - Producto
DetallePedido.belongsTo(Producto, { foreignKey: 'producto_id', as: 'producto' });
Producto.hasMany(DetallePedido, { foreignKey: 'producto_id', as: 'detalles' });

// Cortesías - Pedido
Cortesia.belongsTo(Pedido, { foreignKey: 'pedido_id', as: 'pedido' });
Pedido.hasMany(Cortesia, { foreignKey: 'pedido_id', as: 'cortesias' });

// Cortesías - Usuario
Cortesia.belongsTo(Usuario, { foreignKey: 'autorizado_por', as: 'autorizador' });
Usuario.hasMany(Cortesia, { foreignKey: 'autorizado_por', as: 'cortesias_autorizadas' });

// Turnos - Local
Turno.belongsTo(Local, { foreignKey: 'local_id', as: 'local' });
Local.hasMany(Turno, { foreignKey: 'local_id', as: 'turnos' });

// Turnos - Usuario
Turno.belongsTo(Usuario, { foreignKey: 'usuario_apertura', as: 'usuario' });
Usuario.hasMany(Turno, { foreignKey: 'usuario_apertura', as: 'turnos_abiertos' });

Turno.belongsTo(Usuario, { foreignKey: 'usuario_cierre', as: 'usuario_cierre_rel' });
Usuario.hasMany(Turno, { foreignKey: 'usuario_cierre', as: 'turnos_cerrados' });

// MovimientoInventario - Producto
MovimientoInventario.belongsTo(Producto, { foreignKey: 'producto_id', as: 'producto' });
Producto.hasMany(MovimientoInventario, { foreignKey: 'producto_id', as: 'movimientos' });

// MovimientoInventario - Usuario
MovimientoInventario.belongsTo(Usuario, { foreignKey: 'usuario_id', as: 'usuario' });
Usuario.hasMany(MovimientoInventario, { foreignKey: 'usuario_id', as: 'movimientos_inventario' });

// MovimientoInventario - Pedido
MovimientoInventario.belongsTo(Pedido, { foreignKey: 'pedido_id', as: 'pedido' });
Pedido.hasMany(MovimientoInventario, { foreignKey: 'pedido_id', as: 'movimientos' });

// ============ EXPORTAR ============
module.exports = {
  sequelize,
  Usuario,
  Local,
  Mesa,
  Categoria,
  Producto,
  Pedido,
  DetallePedido,
  Cortesia,
  Turno,
  MovimientoInventario
};