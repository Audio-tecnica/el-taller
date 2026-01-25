const Usuario = require('./Usuario');
const Categoria = require('./Categoria');
const Producto = require('./Producto');
const Local = require('./Local');
const Mesa = require('./Mesa');
const Pedido = require('./Pedido');
const ItemPedido = require('./ItemPedido');
const Cortesia = require('./Cortesia');
const Turno = require('./Turno');
const MovimientoInventario = require('./MovimientoInventario'); // ⭐ AGREGAR

// Relaciones Producto - Categoria
Producto.belongsTo(Categoria, { foreignKey: 'categoria_id', as: 'categoria' });
Categoria.hasMany(Producto, { foreignKey: 'categoria_id', as: 'productos' });

// Relaciones Mesa - Local
Mesa.belongsTo(Local, { foreignKey: 'local_id', as: 'local' });
Local.hasMany(Mesa, { foreignKey: 'local_id', as: 'mesas' });

// Relaciones Pedido
Pedido.belongsTo(Mesa, { foreignKey: 'mesa_id', as: 'mesa' });
Pedido.belongsTo(Local, { foreignKey: 'local_id', as: 'local' });
Pedido.belongsTo(Usuario, { foreignKey: 'usuario_id', as: 'usuario' });
Pedido.hasMany(ItemPedido, { foreignKey: 'pedido_id', as: 'items' });

// Relaciones ItemPedido
ItemPedido.belongsTo(Pedido, { foreignKey: 'pedido_id', as: 'pedido' });
ItemPedido.belongsTo(Producto, { foreignKey: 'producto_id', as: 'producto' });

// Relaciones Mesa - Pedido
Mesa.hasMany(Pedido, { foreignKey: 'mesa_id', as: 'pedidos' });

// Relaciones Cortesia
Cortesia.belongsTo(Pedido, { foreignKey: 'pedido_id', as: 'pedido' });
Cortesia.belongsTo(Usuario, { foreignKey: 'autorizado_por_usuario_id', as: 'autorizador' });
Cortesia.belongsTo(Local, { foreignKey: 'local_id', as: 'local' });

// Relaciones Turno
Turno.belongsTo(Local, { foreignKey: 'local_id', as: 'local' });
Turno.belongsTo(Usuario, { foreignKey: 'usuario_id', as: 'usuario' });

// ⭐ AGREGAR: Relaciones MovimientoInventario
MovimientoInventario.belongsTo(Producto, { foreignKey: 'producto_id', as: 'producto' });
MovimientoInventario.belongsTo(Local, { foreignKey: 'local_id', as: 'local' });
MovimientoInventario.belongsTo(Usuario, { foreignKey: 'usuario_id', as: 'usuario' });

Producto.hasMany(MovimientoInventario, { foreignKey: 'producto_id', as: 'movimientos' });
Local.hasMany(MovimientoInventario, { foreignKey: 'local_id', as: 'movimientos' });

module.exports = {
  Usuario,
  Categoria,
  Producto,
  Local,
  Mesa,
  Pedido,
  ItemPedido,
  Cortesia,
  Turno,
  MovimientoInventario  // ⭐ AGREGAR
};