const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const CompraImpuesto = sequelize.define('CompraImpuesto', {
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true
  },
  compra_id: {
    type: DataTypes.UUID,
    allowNull: false,
    references: {
      model: 'compras',
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
  base_calculo: {
    type: DataTypes.DECIMAL(14, 4),
    allowNull: false,
    comment: 'Monto sobre el cual se calcula el impuesto'
  },
  monto_impuesto: {
    type: DataTypes.DECIMAL(14, 4),
    allowNull: false,
    comment: 'Monto calculado del impuesto'
  },
  tipo: {
    type: DataTypes.ENUM('Impuesto', 'Retencion'),
    allowNull: false,
    comment: 'Tipo de impuesto aplicado'
  },
  porcentaje_aplicado: {
    type: DataTypes.DECIMAL(5, 2),
    allowNull: false,
    comment: 'Porcentaje del impuesto al momento de la compra'
  },
  orden_aplicacion: {
    type: DataTypes.INTEGER,
    allowNull: false,
    defaultValue: 0,
    comment: 'Orden en que se aplicó el impuesto'
  }
}, {
  tableName: 'compras_impuestos',
  timestamps: true,
  createdAt: 'created_at',
  updatedAt: 'updated_at'
});

module.exports = CompraImpuesto;