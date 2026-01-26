const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const MovimientoInventario = sequelize.define('MovimientoInventario', {
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true
  },
  numero_movimiento: {
    type: DataTypes.STRING(20),
    allowNull: true
  },
  fecha_movimiento: {
    type: DataTypes.DATE,
    allowNull: false,
    defaultValue: DataTypes.NOW
  },
  producto_id: {
    type: DataTypes.UUID,
    allowNull: false,
    references: {
      model: 'productos',
      key: 'id'
    }
  },
  local_id: {
    type: DataTypes.UUID,
    allowNull: false,
    references: {
      model: 'locales',
      key: 'id'
    }
  },
  tipo: {
    type: DataTypes.ENUM(
      'entrada',
      'salida',
      'ajuste',
      'venta',
      'compra',
      'devolucion_proveedor',
      'ajuste_positivo',
      'ajuste_negativo',
      'merma',
      'donacion',
      'consumo_interno',
      'salida_transferencia',
      'entrada_transferencia',
      'transferencia_entrada',
      'transferencia_salida'
    ),
    allowNull: false
  },
  cantidad: {
    type: DataTypes.INTEGER,
    allowNull: false
  },
  stock_anterior: {
    type: DataTypes.INTEGER,
    allowNull: false
  },
  stock_nuevo: {
    type: DataTypes.INTEGER,
    allowNull: false
  },
  costo_unitario: {
    type: DataTypes.DECIMAL(10, 2),
    allowNull: true
  },
  costo_total: {
    type: DataTypes.DECIMAL(10, 2),
    allowNull: true
  },
  valor_venta: {
    type: DataTypes.DECIMAL(10, 2),
    allowNull: true
  },
  motivo: {
    type: DataTypes.STRING(500),
    allowNull: true
  },
  observaciones: {
    type: DataTypes.TEXT,
    allowNull: true
  },
  usuario_id: {
    type: DataTypes.UUID,
    allowNull: true,
    references: {
      model: 'usuarios',
      key: 'id'
    }
  },
  pedido_id: {
    type: DataTypes.UUID,
    allowNull: true,
    references: {
      model: 'pedidos',
      key: 'id'
    }
  },
  proveedor_id: {
    type: DataTypes.UUID,
    allowNull: true,
    references: {
      model: 'proveedores',
      key: 'id'
    }
  },
  numero_factura: {
    type: DataTypes.STRING(50),
    allowNull: true
  },
  fecha_factura: {
    type: DataTypes.DATEONLY,
    allowNull: true
  },
  local_origen_id: {
    type: DataTypes.UUID,
    allowNull: true,
    references: {
      model: 'locales',
      key: 'id'
    }
  },
  local_destino_id: {
    type: DataTypes.UUID,
    allowNull: true,
    references: {
      model: 'locales',
      key: 'id'
    }
  },
  movimiento_relacionado_id: {
    type: DataTypes.UUID,
    allowNull: true,
    references: {
      model: 'movimientos_inventario',
      key: 'id'
    }
  },
  autorizado_por: {
    type: DataTypes.UUID,
    allowNull: true,
    references: {
      model: 'usuarios',
      key: 'id'
    }
  }
}, {
  tableName: 'movimientos_inventario',
  timestamps: true,
  createdAt: 'created_at',
  updatedAt: 'updated_at'
});

module.exports = MovimientoInventario;