const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const PagoCompra = sequelize.define('PagoCompra', {
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
  numero_pago: {
    type: DataTypes.STRING(20),
    allowNull: false,
    unique: true,
    comment: 'Número consecutivo del pago (PAG-2026-00001)'
  },
  fecha_pago: {
    type: DataTypes.DATE,
    allowNull: false,
    defaultValue: DataTypes.NOW,
    comment: 'Fecha en que se realizó el pago'
  },
  monto_pago: {
    type: DataTypes.DECIMAL(14, 4),
    allowNull: false,
    comment: 'Monto del pago realizado'
  },
  forma_pago: {
    type: DataTypes.ENUM('efectivo', 'transferencia', 'cheque', 'tarjeta', 'otro'),
    allowNull: false,
    defaultValue: 'efectivo',
    comment: 'Forma de pago utilizada'
  },
  numero_referencia: {
    type: DataTypes.STRING(100),
    allowNull: true,
    comment: 'Número de referencia del pago (cheque, transferencia, etc.)'
  },
  banco: {
    type: DataTypes.STRING(100),
    allowNull: true,
    comment: 'Banco utilizado para el pago'
  },
  observaciones: {
    type: DataTypes.TEXT,
    allowNull: true
  },
  usuario_id: {
    type: DataTypes.UUID,
    allowNull: false,
    references: {
      model: 'usuarios',
      key: 'id'
    }
  },
  anulado: {
    type: DataTypes.BOOLEAN,
    allowNull: false,
    defaultValue: false
  },
  fecha_anulacion: {
    type: DataTypes.DATE,
    allowNull: true
  },
  motivo_anulacion: {
    type: DataTypes.TEXT,
    allowNull: true
  }
}, {
  tableName: 'pagos_compras',
  timestamps: true,
  createdAt: 'created_at',
  updatedAt: 'updated_at'
});

module.exports = PagoCompra;