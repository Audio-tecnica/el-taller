const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const PagoB2B = sequelize.define('PagoB2B', {
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true
  },
  numero_recibo: {
    type: DataTypes.STRING(50),
    allowNull: false,
    unique: true
  },
  venta_b2b_id: {
    type: DataTypes.UUID,
    allowNull: false,
    references: {
      model: 'ventas_b2b',
      key: 'id'
    }
  },
  cliente_b2b_id: {
    type: DataTypes.UUID,
    allowNull: false,
    references: {
      model: 'clientes_b2b',
      key: 'id'
    }
  },
  monto: {
    type: DataTypes.DECIMAL(12, 2),
    allowNull: false,
    validate: {
      min: 0.01
    }
  },
  metodo_pago: {
    type: DataTypes.ENUM('Efectivo', 'Transferencia', 'Cheque', 'Tarjeta', 'Otro'),
    allowNull: false
  },
  // Detalles según método de pago
  referencia_pago: {
    type: DataTypes.STRING(100),
    allowNull: true,
    comment: 'Número de transferencia, cheque, etc.'
  },
  banco: {
    type: DataTypes.STRING(100),
    allowNull: true
  },
  fecha_pago: {
    type: DataTypes.DATE,
    allowNull: false,
    defaultValue: DataTypes.NOW
  },
  // Observaciones
  notas: {
    type: DataTypes.TEXT,
    allowNull: true
  },
  // Control
  recibido_por: {
    type: DataTypes.UUID,
    allowNull: false,
    references: {
      model: 'usuarios',
      key: 'id'
    }
  },
  turno_id: {
    type: DataTypes.UUID,
    allowNull: true,
    references: {
      model: 'turnos',
      key: 'id'
    },
    comment: 'Turno en el que se registró el pago'
  },
  // Estado
  estado: {
    type: DataTypes.ENUM('Aplicado', 'Anulado'),
    allowNull: false,
    defaultValue: 'Aplicado'
  },
  anulado_por: {
    type: DataTypes.UUID,
    allowNull: true,
    references: {
      model: 'usuarios',
      key: 'id'
    }
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
  tableName: 'pagos_b2b',
  timestamps: true,
  createdAt: 'fecha_creacion',
  updatedAt: 'fecha_actualizacion',
  indexes: [
    {
      unique: true,
      fields: ['numero_recibo']
    },
    {
      fields: ['venta_b2b_id']
    },
    {
      fields: ['cliente_b2b_id']
    },
    {
      fields: ['fecha_pago']
    },
    {
      fields: ['estado']
    }
  ]
});

module.exports = PagoB2B;
