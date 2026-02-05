const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const VentaImpuesto = sequelize.define('VentaImpuesto', {
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true
  },
  venta_b2b_id: {
    type: DataTypes.UUID,
    allowNull: false,
    references: {
      model: 'ventas_b2b',
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
  codigo_impuesto: {
    type: DataTypes.STRING(20),
    allowNull: false,
    comment: 'Copia del código para histórico'
  },
  nombre_impuesto: {
    type: DataTypes.STRING(100),
    allowNull: false,
    comment: 'Copia del nombre para histórico'
  },
  tipo: {
    type: DataTypes.ENUM('Impuesto', 'Retencion'),
    allowNull: false,
    comment: 'Copia del tipo para histórico'
  },
  porcentaje: {
    type: DataTypes.DECIMAL(5, 2),
    allowNull: false,
    comment: 'Porcentaje aplicado'
  },
  base: {
    type: DataTypes.DECIMAL(12, 2),
    allowNull: false,
    comment: 'Base sobre la que se calculó'
  },
  monto: {
    type: DataTypes.DECIMAL(12, 2),
    allowNull: false,
    comment: 'Monto calculado del impuesto/retención'
  }
}, {
  tableName: 'venta_impuestos',
  timestamps: true,
  createdAt: 'fecha_creacion',
  updatedAt: false
});

module.exports = VentaImpuesto;
