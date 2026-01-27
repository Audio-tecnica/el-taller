const sequelize = require('../config/database');
const IntentoAcceso = require('./IntentoAcceso');

// ==========================================
// IMPORTAR MODELOS EXISTENTES
// ==========================================
const Usuario = require('./Usuario');
const Local = require('./Local');
const Mesa = require('./Mesa');
const Categoria = require('./Categoria');
const Producto = require('./Producto');
const Pedido = require('./Pedido');
const ItemPedido = require('./ItemPedido');
const Cortesia = require('./Cortesia');
const Turno = require('./Turno');

// ==========================================
// IMPORTAR NUEVOS MODELOS KARDEX
// ==========================================
const MovimientoInventario = require('./MovimientoInventario');
const Proveedor = require('./Proveedor');
const Compra = require('./Compra');

// ==========================================
// ⭐ IMPORTAR MODELO DE INTENTOS DE ACCESO
// ==========================================
const IntentoAcceso = require('./IntentoAcceso');

// ==========================================
// RELACIONES EXISTENTES
// ==========================================

// Usuarios - Locales
Usuario.belongsTo(Local, { foreignKey: 'local_asignado_id', as: 'local' });
Local.hasMany(Usuario, { foreignKey: 'local_asignado_id', as: 'usuarios' });

// IntentoAcceso - Usuario
IntentoAcceso.belongsTo(Usuario, { foreignKey: 'usuario_id', as: 'usuario' });
Usuario.hasMany(IntentoAcceso, { foreignKey: 'usuario_id', as: 'intentos_acceso' });

// Mesas - Locales
Mesa.belongsTo(Local, { foreignKey: 'local_id', as: 'local' });
Local.hasMany(Mesa, { foreignKey: 'local_id', as: 'mesas' });

// Productos - Categorías
Producto.belongsTo(Categoria, { foreignKey: 'categoria_id', as: 'categoria' });
Categoria.hasMany(Producto, { foreignKey: 'categoria_id', as: 'productos' });

// Pedidos - Mesa
Pedido.belongsTo(Mesa, { foreignKey: 'mesa_id', as: 'mesa' });
Mesa.hasMany(Pedido, { foreignKey: 'mesa_id', as: 'pedidos' });

// Pedidos - Usuario
Pedido.belongsTo(Usuario, { foreignKey: 'usuario_id', as: 'usuario' });
Usuario.hasMany(Pedido, { foreignKey: 'usuario_id', as: 'pedidos' });

// Pedidos - Local
Pedido.belongsTo(Local, { foreignKey: 'local_id', as: 'local' });
Local.hasMany(Pedido, { foreignKey: 'local_id', as: 'pedidos' });

// ItemPedido - Pedido
ItemPedido.belongsTo(Pedido, { foreignKey: 'pedido_id', as: 'pedido' });
Pedido.hasMany(ItemPedido, { foreignKey: 'pedido_id', as: 'items' });

// ItemPedido - Producto
ItemPedido.belongsTo(Producto, { foreignKey: 'producto_id', as: 'producto' });
Producto.hasMany(ItemPedido, { foreignKey: 'producto_id', as: 'items' });

// Cortesías - Pedido
Cortesia.belongsTo(Pedido, { foreignKey: 'pedido_id', as: 'pedido' });
Pedido.hasMany(Cortesia, { foreignKey: 'pedido_id', as: 'cortesias' });

// Cortesías - Usuario
Cortesia.belongsTo(Usuario, { foreignKey: 'autorizado_por', as: 'autorizador' });
Usuario.hasMany(Cortesia, { foreignKey: 'autorizado_por', as: 'cortesias_autorizadas' });

// Turnos - Local
Turno.belongsTo(Local, { foreignKey: 'local_id', as: 'local' });
Local.hasMany(Turno, { foreignKey: 'local_id', as: 'turnos' });

// Turno - Cajero
Turno.belongsTo(Usuario, { foreignKey: 'cajero_id', as: 'cajero' });
Usuario.hasMany(Turno, { foreignKey: 'cajero_id', as: 'turnos_como_cajero' });

// Turnos - Usuario
Turno.belongsTo(Usuario, { foreignKey: 'usuario_id', as: 'usuario' });
Usuario.hasMany(Turno, { foreignKey: 'usuario_id', as: 'turnos' });

// ==========================================
// NUEVAS RELACIONES KARDEX
// ==========================================

// MovimientoInventario - Producto
MovimientoInventario.belongsTo(Producto, { foreignKey: 'producto_id', as: 'producto' });
Producto.hasMany(MovimientoInventario, { foreignKey: 'producto_id', as: 'movimientos' });

// MovimientoInventario - Local
MovimientoInventario.belongsTo(Local, { foreignKey: 'local_id', as: 'local' });
Local.hasMany(MovimientoInventario, { foreignKey: 'local_id', as: 'movimientos_inventario' });

// MovimientoInventario - Proveedor
MovimientoInventario.belongsTo(Proveedor, { foreignKey: 'proveedor_id', as: 'proveedor' });
Proveedor.hasMany(MovimientoInventario, { foreignKey: 'proveedor_id', as: 'movimientos' });

// MovimientoInventario - Usuario
MovimientoInventario.belongsTo(Usuario, { foreignKey: 'usuario_id', as: 'usuario' });
Usuario.hasMany(MovimientoInventario, { foreignKey: 'usuario_id', as: 'movimientos_realizados' });

MovimientoInventario.belongsTo(Usuario, { foreignKey: 'autorizado_por', as: 'autorizador' });
Usuario.hasMany(MovimientoInventario, { foreignKey: 'autorizado_por', as: 'movimientos_autorizados' });

// MovimientoInventario - Pedido
MovimientoInventario.belongsTo(Pedido, { foreignKey: 'pedido_id', as: 'pedido' });
Pedido.hasMany(MovimientoInventario, { foreignKey: 'pedido_id', as: 'movimientos' });

// MovimientoInventario - Transferencias (origen/destino)
MovimientoInventario.belongsTo(Local, { foreignKey: 'local_origen_id', as: 'local_origen' });
MovimientoInventario.belongsTo(Local, { foreignKey: 'local_destino_id', as: 'local_destino' });

// MovimientoInventario - Movimiento relacionado (para transferencias)
MovimientoInventario.belongsTo(MovimientoInventario, { 
  foreignKey: 'movimiento_relacionado_id', 
  as: 'movimiento_relacionado' 
});

// Compra - Proveedor
Compra.belongsTo(Proveedor, { foreignKey: 'proveedor_id', as: 'proveedor' });
Proveedor.hasMany(Compra, { foreignKey: 'proveedor_id', as: 'compras' });

// Compra - Local
Compra.belongsTo(Local, { foreignKey: 'local_id', as: 'local' });
Local.hasMany(Compra, { foreignKey: 'local_id', as: 'compras' });

// Compra - Usuario
Compra.belongsTo(Usuario, { foreignKey: 'usuario_id', as: 'usuario' });
Usuario.hasMany(Compra, { foreignKey: 'usuario_id', as: 'compras_realizadas' });

// ==========================================
// ⭐ NUEVAS RELACIONES - INTENTOS DE ACCESO
// ==========================================

// IntentoAcceso - Usuario
IntentoAcceso.belongsTo(Usuario, { foreignKey: 'usuario_id', as: 'usuario' });
Usuario.hasMany(IntentoAcceso, { foreignKey: 'usuario_id', as: 'intentos_acceso' });

// ==========================================
// EXPORTAR MODELOS
// ==========================================
module.exports = {
  sequelize,
  
  // Modelos existentes
  Usuario,
  Local,
  Mesa,
  Categoria,
  Producto,
  Pedido,
  ItemPedido,
  Cortesia,
  Turno,
  
  // Modelos nuevos kardex
  MovimientoInventario,
  Proveedor,
  Compra,
  
  // ⭐ Modelo de seguridad
  IntentoAcceso
};
