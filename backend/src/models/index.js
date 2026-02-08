const sequelize = require('../config/database');

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
// IMPORTAR MODELO DE INTENTOS DE ACCESO
// ==========================================
const IntentoAcceso = require('./IntentoAcceso');

// ==========================================
// IMPORTAR MODELOS B2B
// ==========================================
const ClienteB2B = require('./ClienteB2B');
const VentaB2B = require('./VentaB2B');
const ItemVentaB2B = require('./ItemVentaB2B');
const PagoB2B = require('./PagoB2B');

// ==========================================
// IMPORTAR MODELOS DE IMPUESTOS
// ==========================================
const Impuesto = require('./Impuesto');
const ClienteImpuesto = require('./ClienteImpuesto');
const VentaImpuesto = require('./VentaImpuesto');

// ==========================================
// IMPORTAR MODELOS DE COMPRAS MEJORADOS
// ==========================================
const CompraImpuesto = require('./CompraImpuesto');
const PagoCompra = require('./PagoCompra');

// ==========================================
// IMPORTAR MODELO DE URLS CORTAS
// ==========================================
const UrlCorta = require('./UrlCorta');

// ==========================================
// RELACIONES EXISTENTES
// ==========================================

// Usuarios - Locales
Usuario.belongsTo(Local, { foreignKey: 'local_asignado_id', as: 'local' });
Local.hasMany(Usuario, { foreignKey: 'local_asignado_id', as: 'usuarios' });

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

// ⭐ TURNOS - USUARIO (CORREGIDO)
// Quien abre el turno (puede ser admin)
Turno.belongsTo(Usuario, { foreignKey: 'usuario_id', as: 'usuario' });
Usuario.hasMany(Turno, { foreignKey: 'usuario_id', as: 'turnos_abiertos' });

// ⭐ NUEVO: Cajero asignado al turno
Turno.belongsTo(Usuario, { foreignKey: 'cajero_id', as: 'cajero' });
Usuario.hasMany(Turno, { foreignKey: 'cajero_id', as: 'turnos_como_cajero' });

// ⭐ INTENTOS DE ACCESO - USUARIO
IntentoAcceso.belongsTo(Usuario, { foreignKey: 'usuario_id', as: 'usuario' });
Usuario.hasMany(IntentoAcceso, { foreignKey: 'usuario_id', as: 'intentos_acceso' });

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
// RELACIONES B2B
// ==========================================

// ClienteB2B - Usuario (creado/actualizado por)
ClienteB2B.belongsTo(Usuario, { foreignKey: 'creado_por', as: 'creador' });
ClienteB2B.belongsTo(Usuario, { foreignKey: 'actualizado_por', as: 'actualizador' });

// VentaB2B - ClienteB2B
VentaB2B.belongsTo(ClienteB2B, { foreignKey: 'cliente_b2b_id', as: 'cliente' });
ClienteB2B.hasMany(VentaB2B, { foreignKey: 'cliente_b2b_id', as: 'ventas' });

// VentaB2B - Local
VentaB2B.belongsTo(Local, { foreignKey: 'local_id', as: 'local' });
Local.hasMany(VentaB2B, { foreignKey: 'local_id', as: 'ventas_b2b' });

// VentaB2B - Pedido
VentaB2B.belongsTo(Pedido, { foreignKey: 'pedido_id', as: 'pedido' });
Pedido.hasOne(VentaB2B, { foreignKey: 'pedido_id', as: 'venta_b2b' });

// VentaB2B - Usuario (vendedor/anulado por)
VentaB2B.belongsTo(Usuario, { foreignKey: 'vendedor_id', as: 'vendedor' });
Usuario.hasMany(VentaB2B, { foreignKey: 'vendedor_id', as: 'ventas_b2b' });
VentaB2B.belongsTo(Usuario, { foreignKey: 'anulado_por', as: 'anulador' });

// ItemVentaB2B - VentaB2B
ItemVentaB2B.belongsTo(VentaB2B, { foreignKey: 'venta_b2b_id', as: 'venta' });
VentaB2B.hasMany(ItemVentaB2B, { foreignKey: 'venta_b2b_id', as: 'items' });

// ItemVentaB2B - Producto
ItemVentaB2B.belongsTo(Producto, { foreignKey: 'producto_id', as: 'producto' });
Producto.hasMany(ItemVentaB2B, { foreignKey: 'producto_id', as: 'items_venta_b2b' });

// PagoB2B - VentaB2B
PagoB2B.belongsTo(VentaB2B, { foreignKey: 'venta_b2b_id', as: 'venta' });
VentaB2B.hasMany(PagoB2B, { foreignKey: 'venta_b2b_id', as: 'pagos' });

// PagoB2B - ClienteB2B
PagoB2B.belongsTo(ClienteB2B, { foreignKey: 'cliente_b2b_id', as: 'cliente' });
ClienteB2B.hasMany(PagoB2B, { foreignKey: 'cliente_b2b_id', as: 'pagos' });

// PagoB2B - Usuario (recibido/anulado por)
PagoB2B.belongsTo(Usuario, { foreignKey: 'recibido_por', as: 'receptor' });
Usuario.hasMany(PagoB2B, { foreignKey: 'recibido_por', as: 'pagos_b2b_recibidos' });
PagoB2B.belongsTo(Usuario, { foreignKey: 'anulado_por', as: 'anulador' });

// PagoB2B - Turno
PagoB2B.belongsTo(Turno, { foreignKey: 'turno_id', as: 'turno' });
Turno.hasMany(PagoB2B, { foreignKey: 'turno_id', as: 'pagos_b2b' });

// ==========================================
// RELACIONES DE IMPUESTOS
// ==========================================

// ClienteImpuesto - ClienteB2B
ClienteImpuesto.belongsTo(ClienteB2B, { foreignKey: 'cliente_b2b_id', as: 'cliente' });
ClienteB2B.hasMany(ClienteImpuesto, { foreignKey: 'cliente_b2b_id', as: 'impuestos_cliente' });

// ClienteImpuesto - Impuesto
ClienteImpuesto.belongsTo(Impuesto, { foreignKey: 'impuesto_id', as: 'impuesto' });
Impuesto.hasMany(ClienteImpuesto, { foreignKey: 'impuesto_id', as: 'clientes_impuesto' });

// VentaImpuesto - VentaB2B
VentaImpuesto.belongsTo(VentaB2B, { foreignKey: 'venta_b2b_id', as: 'venta' });
VentaB2B.hasMany(VentaImpuesto, { foreignKey: 'venta_b2b_id', as: 'impuestos_aplicados' });

// VentaImpuesto - Impuesto
VentaImpuesto.belongsTo(Impuesto, { foreignKey: 'impuesto_id', as: 'impuesto' });
Impuesto.hasMany(VentaImpuesto, { foreignKey: 'impuesto_id', as: 'ventas_impuesto' });

// ==========================================
// RELACIONES DE COMPRAS CON IMPUESTOS Y PAGOS
// ==========================================

// Relaciones de CompraImpuesto
Compra.hasMany(CompraImpuesto, { 
  foreignKey: 'compra_id', 
  as: 'impuestosAplicados' 
});
CompraImpuesto.belongsTo(Compra, { 
  foreignKey: 'compra_id', 
  as: 'compra' 
});

Impuesto.hasMany(CompraImpuesto, { 
  foreignKey: 'impuesto_id', 
  as: 'compras_impuesto' 
});
CompraImpuesto.belongsTo(Impuesto, { 
  foreignKey: 'impuesto_id', 
  as: 'impuesto' 
});

// Relaciones de PagoCompra
Compra.hasMany(PagoCompra, { 
  foreignKey: 'compra_id', 
  as: 'pagos' 
});
PagoCompra.belongsTo(Compra, { 
  foreignKey: 'compra_id', 
  as: 'compra' 
});

Usuario.hasMany(PagoCompra, { 
  foreignKey: 'usuario_id', 
  as: 'pagos_compras_realizados' 
});
PagoCompra.belongsTo(Usuario, { 
  foreignKey: 'usuario_id', 
  as: 'usuario' 
});

// Importar el modelo de Gasto
const Gasto = require('./Gasto');

// Relaciones de Gasto
Gasto.belongsTo(Local, { foreignKey: 'local_id', as: 'local' });
Gasto.belongsTo(Proveedor, { foreignKey: 'proveedor_id', as: 'proveedor' });
Gasto.belongsTo(Usuario, { foreignKey: 'usuario_id', as: 'usuario' });

// Exportar el modelo
module.exports.Gasto = Gasto;

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
  
  // ⭐ Modelo de intentos de acceso
  IntentoAcceso,
  
  // Modelos B2B
  ClienteB2B,
  VentaB2B,
  ItemVentaB2B,
  PagoB2B,
  
  // Modelos de Impuestos
  Impuesto,
  ClienteImpuesto,
  VentaImpuesto,
  
  // ⭐ Modelos de Compras Mejorados
  CompraImpuesto,
  PagoCompra,
  
  // ⭐ Modelo de URLs Cortas
  UrlCorta
};