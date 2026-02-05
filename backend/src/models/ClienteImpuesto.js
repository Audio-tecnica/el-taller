const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const ClienteImpuesto = sequelize.define('ClienteImpuesto', {
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true
  },
  cliente_b2b_id: {
    type: DataTypes.UUID,
    allowNull: false,
    references: {
      model: 'clientes_b2b',
      key: 'id'
    }
  },
  impuesto_id: {
    type: DataTypes.UUID,
    allowNull: false,
    references: {
      model: 'impuestos',
      key: 'id'
    }
  },
  porcentaje_personalizado: {
    type: DataTypes.DECIMAL(5, 2),
    allowNull: true,
    comment: 'Si es null, usa el porcentaje del catálogo'
  },
  activo: {
    type: DataTypes.BOOLEAN,
    allowNull: false,
    defaultValue: true
  }
}, {
  tableName: 'cliente_impuestos',
  timestamps: true,
  createdAt: 'fecha_creacion',
  updatedAt: false,
  indexes: [
    {
      unique: true,
      fields: ['cliente_b2b_id', 'impuesto_id']
    }
  ]
});

module.exports = ClienteImpuesto;
