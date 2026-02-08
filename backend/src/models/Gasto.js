const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const Gasto = sequelize.define('Gasto', {
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true
  },
  fecha: {
    type: DataTypes.DATEONLY,
    allowNull: false,
    defaultValue: DataTypes.NOW,
    comment: 'Fecha del gasto'
  },
  categoria: {
    type: DataTypes.ENUM(
      'servicios_publicos',
      'arriendo',
      'nomina',
      'mantenimiento',
      'publicidad',
      'transporte',
      'seguros',
      'impuestos',
      'papeleria',
      'limpieza',
      'tecnologia',
      'otros'
    ),
    allowNull: false,
    comment: 'Categoría del gasto operativo'
  },
  concepto: {
    type: DataTypes.STRING(200),
    allowNull: false,
    comment: 'Descripción del gasto'
  },
  monto: {
    type: DataTypes.DECIMAL(12, 2),
    allowNull: false,
    validate: {
      min: 0
    },
    comment: 'Valor del gasto'
  },
  local_id: {
    type: DataTypes.UUID,
    allowNull: true,
    references: {
      model: 'locales',
      key: 'id'
    },
    comment: 'Local al que aplica el gasto (null = ambos locales)'
  },
  proveedor_id: {
    type: DataTypes.UUID,
    allowNull: true,
    references: {
      model: 'proveedores',
      key: 'id'
    },
    comment: 'Proveedor del servicio/gasto'
  },
  metodo_pago: {
    type: DataTypes.ENUM('efectivo', 'transferencia', 'tarjeta', 'datafono', 'cheque'),
    defaultValue: 'efectivo'
  },
  numero_factura: {
    type: DataTypes.STRING(100),
    allowNull: true,
    comment: 'Número de factura o documento'
  },
  periodicidad: {
    type: DataTypes.ENUM('unico', 'mensual', 'trimestral', 'anual'),
    defaultValue: 'unico',
    comment: 'Indica si es un gasto recurrente'
  },
  mes_aplicacion: {
    type: DataTypes.INTEGER,
    allowNull: true,
    validate: {
      min: 1,
      max: 12
    },
    comment: 'Mes al que aplica el gasto (1-12)'
  },
  anio_aplicacion: {
    type: DataTypes.INTEGER,
    allowNull: true,
    comment: 'Año al que aplica el gasto'
  },
  usuario_id: {
    type: DataTypes.UUID,
    allowNull: false,
    references: {
      model: 'usuarios',
      key: 'id'
    },
    comment: 'Usuario que registró el gasto'
  },
  aprobado: {
    type: DataTypes.BOOLEAN,
    defaultValue: true,
    comment: 'Indica si el gasto está aprobado'
  },
  notas: {
    type: DataTypes.TEXT,
    allowNull: true,
    comment: 'Observaciones adicionales'
  },
  archivo_adjunto: {
    type: DataTypes.TEXT,
    allowNull: true,
    comment: 'URL o path del archivo adjunto (factura, recibo)'
  }
}, {
  tableName: 'gastos',
  timestamps: true,
  createdAt: 'created_at',
  updatedAt: 'updated_at',
  indexes: [
    {
      fields: ['fecha']
    },
    {
      fields: ['categoria']
    },
    {
      fields: ['local_id']
    },
    {
      fields: ['mes_aplicacion', 'anio_aplicacion']
    }
  ]
});

module.exports = Gasto;