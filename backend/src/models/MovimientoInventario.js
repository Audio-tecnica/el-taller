const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const MovimientoInventario = sequelize.define('MovimientoInventario', {
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true
  },
  producto_id: {
    type: DataTypes.UUID,
    allowNull: false,
    references: {
      model: 'productos',
      key: 'id'
    }
  },
  local: {
    type: DataTypes.INTEGER,
    allowNull: false,
    comment: '1 = Castellana, 2 = Avenida 1ra'
  },
  tipo: {
    type: DataTypes.ENUM('entrada', 'salida', 'ajuste', 'venta', 'transferencia_entrada', 'transferencia_salida'),
    allowNull: false
  },
  cantidad: {
    type: DataTypes.INTEGER,
    allowNull: false,
    comment: 'Positivo para entradas, negativo para salidas'
  },
  stock_anterior: {
    type: DataTypes.INTEGER,
    allowNull: false
  },
  stock_nuevo: {
    type: DataTypes.INTEGER,
    allowNull: false
  },
  motivo: {
    type: DataTypes.STRING(500),
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
  }
}, {
  tableName: 'movimientos_inventario',
  timestamps: true,
  createdAt: 'created_at',
  updatedAt: 'updated_at'
});

module.exports = MovimientoInventario;