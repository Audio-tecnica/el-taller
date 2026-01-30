const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const ItemVentaB2B = sequelize.define('ItemVentaB2B', {
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
    },
    onDelete: 'CASCADE'
  },
  producto_id: {
    type: DataTypes.UUID,
    allowNull: false,
    references: {
      model: 'productos',
      key: 'id'
    }
  },
  nombre_producto: {
    type: DataTypes.STRING(200),
    allowNull: false,
    comment: 'Nombre del producto al momento de la venta'
  },
  cantidad: {
    type: DataTypes.INTEGER,
    allowNull: false,
    validate: {
      min: 1
    }
  },
  precio_unitario: {
    type: DataTypes.DECIMAL(10, 2),
    allowNull: false
  },
  descuento_porcentaje: {
    type: DataTypes.DECIMAL(5, 2),
    defaultValue: 0
  },
  descuento_monto: {
    type: DataTypes.DECIMAL(10, 2),
    defaultValue: 0
  },
  subtotal: {
    type: DataTypes.DECIMAL(10, 2),
    allowNull: false,
    comment: 'cantidad * precio_unitario'
  },
  total: {
    type: DataTypes.DECIMAL(10, 2),
    allowNull: false,
    comment: 'subtotal - descuento_monto'
  }
}, {
  tableName: 'items_venta_b2b',
  timestamps: true,
  createdAt: 'fecha_creacion',
  updatedAt: 'fecha_actualizacion',
  indexes: [
    {
      fields: ['venta_b2b_id']
    },
    {
      fields: ['producto_id']
    }
  ]
});

module.exports = ItemVentaB2B;
