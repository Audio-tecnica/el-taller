const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const Pedido = sequelize.define('Pedido', {
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true
  },
  mesa_id: {
    type: DataTypes.UUID,
    allowNull: true
  },
  local_id: {
    type: DataTypes.UUID,
    allowNull: false
  },
  usuario_id: {
    type: DataTypes.UUID,
    allowNull: false
  },
  estado: {
    type: DataTypes.ENUM('abierto', 'cerrado', 'cancelado'),
    defaultValue: 'abierto'
  },
  subtotal: {
    type: DataTypes.DECIMAL(10, 2),
    defaultValue: 0
  },
  tiene_cortesia: {
    type: DataTypes.BOOLEAN,
    defaultValue: false
  },
  monto_cortesia: {
    type: DataTypes.DECIMAL(10, 2),
    defaultValue: 0
  },
  razon_cortesia: {
    type: DataTypes.TEXT,
    allowNull: true
  },
  total_final: {
    type: DataTypes.DECIMAL(10, 2),
    allowNull: true
  },
  metodo_pago: {
    type: DataTypes.ENUM('efectivo', 'transferencia', 'nequi'),
    allowNull: true
  },
  closed_at: {
    type: DataTypes.DATE,
    allowNull: true
  }
}, {
  tableName: 'pedidos',
  timestamps: true,
  createdAt: 'created_at',
  updatedAt: false
});

module.exports = Pedido;