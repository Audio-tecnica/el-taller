const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const Compra = sequelize.define('Compra', {
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true
  },
  numero_compra: {
    type: DataTypes.STRING(20),
    unique: true,
    allowNull: false
  },
  fecha_compra: {
    type: DataTypes.DATE,
    defaultValue: DataTypes.NOW
  },
  proveedor_id: {
    type: DataTypes.UUID,
    allowNull: false,
    references: {
      model: 'proveedores',
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
  numero_factura: {
    type: DataTypes.STRING(100),
    allowNull: true
  },
  fecha_factura: {
    type: DataTypes.DATEONLY,
    allowNull: true
  },
  subtotal: {
    type: DataTypes.DECIMAL(14, 4),
    allowNull: false,
    defaultValue: 0
  },
  impuestos: {
    type: DataTypes.DECIMAL(14, 4),
    defaultValue: 0
  },
  descuento: {
    type: DataTypes.DECIMAL(14, 4),
    defaultValue: 0
  },
  total: {
    type: DataTypes.DECIMAL(14, 4),
    allowNull: false,
    defaultValue: 0
  },
  estado: {
    type: DataTypes.ENUM('pendiente', 'recibida', 'cancelada'),
    defaultValue: 'pendiente'
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
  }
}, {
  tableName: 'compras',
  timestamps: true,
  createdAt: 'created_at',
  updatedAt: 'updated_at'
});

module.exports = Compra;
