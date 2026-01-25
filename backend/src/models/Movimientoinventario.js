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
    allowNull: false
  },
  local_id: {
    type: DataTypes.UUID,
    allowNull: false
  },
  tipo: {
    type: DataTypes.ENUM('entrada', 'salida', 'transferencia_entrada', 'transferencia_salida', 'ajuste', 'venta'),
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
  motivo: {
    type: DataTypes.TEXT,
    allowNull: true
  },
  referencia_id: {
    type: DataTypes.UUID,
    allowNull: true,
    comment: 'ID de pedido, transferencia u otro documento relacionado'
  },
  usuario_id: {
    type: DataTypes.UUID,
    allowNull: false
  }
}, {
  tableName: 'movimientos_inventario',
  timestamps: true,
  createdAt: 'created_at',
  updatedAt: false
});

module.exports = MovimientoInventario;