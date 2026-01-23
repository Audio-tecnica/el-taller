const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const Cortesia = sequelize.define('Cortesia', {
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true
  },
  tipo: {
    type: DataTypes.ENUM('total', 'parcial', 'item_individual'),
    allowNull: false
  },
  pedido_id: {
    type: DataTypes.UUID,
    allowNull: false
  },
  item_pedido_id: {
    type: DataTypes.UUID,
    allowNull: true
  },
  monto_cortesia: {
    type: DataTypes.DECIMAL(10, 2),
    allowNull: false
  },
  razon: {
    type: DataTypes.STRING(100),
    allowNull: true
  },
  descripcion: {
    type: DataTypes.TEXT,
    allowNull: true
  },
  autorizado_por_usuario_id: {
    type: DataTypes.UUID,
    allowNull: true
  },
  local_id: {
    type: DataTypes.UUID,
    allowNull: true
  },
  turno_id: {
    type: DataTypes.UUID,
    allowNull: true
  }
}, {
  tableName: 'cortesias',
  timestamps: true,
  createdAt: 'created_at',
  updatedAt: false
});

module.exports = Cortesia;