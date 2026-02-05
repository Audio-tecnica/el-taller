const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const VentaB2B = sequelize.define('VentaB2B', {
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true
  },
  numero_factura: {
    type: DataTypes.STRING(50),
    allowNull: false,
    unique: true
  },
  cliente_b2b_id: {
    type: DataTypes.UUID,
    allowNull: false,
    references: {
      model: 'clientes_b2b',
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
  pedido_id: {
    type: DataTypes.UUID,
    allowNull: true,
    references: {
      model: 'pedidos',
      key: 'id'
    },
    comment: 'Referencia al pedido original si la venta viene del POS'
  },
  // Montos
  subtotal: {
    type: DataTypes.DECIMAL(12, 2),
    allowNull: false,
    defaultValue: 0
  },
  descuento: {
    type: DataTypes.DECIMAL(12, 2),
    allowNull: false,
    defaultValue: 0
  },
  iva: {
    type: DataTypes.DECIMAL(12, 2),
    allowNull: false,
    defaultValue: 0
  },
  total: {
    type: DataTypes.DECIMAL(12, 2),
    allowNull: false
  },
  // Control de pagos
  monto_pagado: {
    type: DataTypes.DECIMAL(12, 2),
    allowNull: false,
    defaultValue: 0
  },
  saldo_pendiente: {
    type: DataTypes.DECIMAL(12, 2),
    allowNull: false,
    defaultValue: 0
  },
  estado_pago: {
    type: DataTypes.ENUM('Pendiente', 'Parcial', 'Pagado', 'Vencido', 'Anulado'),
    allowNull: false,
    defaultValue: 'Pendiente'
  },
  // Fechas importantes
  fecha_venta: {
    type: DataTypes.DATE,
    allowNull: false,
    defaultValue: DataTypes.NOW
  },
  fecha_vencimiento: {
    type: DataTypes.DATE,
    allowNull: false
  },
  fecha_pago_completo: {
    type: DataTypes.DATE,
    allowNull: true
  },
  dias_mora: {
    type: DataTypes.INTEGER,
    defaultValue: 0
  },
  // Forma de pago
  metodo_pago: {
    type: DataTypes.ENUM('Credito', 'Efectivo', 'Transferencia', 'Mixto'),
    allowNull: false,
    defaultValue: 'Credito'
  },
  // Campos fiscales
  base_imponible: {
    type: DataTypes.DECIMAL(12, 2),
    defaultValue: 0,
    comment: 'Base gravable sin IVA'
  },
  iva_porcentaje: {
    type: DataTypes.DECIMAL(5, 2),
    defaultValue: 19.00,
    comment: 'Porcentaje de IVA aplicado'
  },
  iva_monto: {
    type: DataTypes.DECIMAL(12, 2),
    defaultValue: 0,
    comment: 'Monto de IVA calculado'
  },
  otros_impuestos: {
    type: DataTypes.DECIMAL(12, 2),
    defaultValue: 0,
    comment: 'Otros impuestos (INC, etc.)'
  },
  retefuente: {
    type: DataTypes.DECIMAL(12, 2),
    defaultValue: 0,
    comment: 'Retención en la fuente si aplica'
  },
  reteiva: {
    type: DataTypes.DECIMAL(12, 2),
    defaultValue: 0,
    comment: 'Retención de IVA si aplica'
  },
  cufe: {
    type: DataTypes.STRING(100),
    allowNull: true,
    comment: 'Código Único de Factura Electrónica'
  },
  qr_code: {
    type: DataTypes.TEXT,
    allowNull: true,
    comment: 'Código QR de la factura electrónica'
  },
  estado_dian: {
    type: DataTypes.ENUM('Pendiente', 'Enviado', 'Aprobado', 'Rechazado'),
    defaultValue: 'Pendiente',
    comment: 'Estado de la factura ante la DIAN'
  },
  fecha_envio_dian: {
    type: DataTypes.DATE,
    allowNull: true
  },
  respuesta_dian: {
    type: DataTypes.TEXT,
    allowNull: true,
    comment: 'Respuesta XML de la DIAN'
  },
  // Observaciones
  notas: {
    type: DataTypes.TEXT,
    allowNull: true
  },
  observaciones_anulacion: {
    type: DataTypes.TEXT,
    allowNull: true
  },
  // Control
  vendedor_id: {
    type: DataTypes.UUID,
    allowNull: false,
    references: {
      model: 'usuarios',
      key: 'id'
    }
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
  }
}, {
  tableName: 'ventas_b2b',
  timestamps: true,
  createdAt: 'fecha_creacion',
  updatedAt: 'fecha_actualizacion',
  indexes: [
    {
      unique: true,
      fields: ['numero_factura']
    },
    {
      fields: ['cliente_b2b_id']
    },
    {
      fields: ['estado_pago']
    },
    {
      fields: ['fecha_venta']
    },
    {
      fields: ['fecha_vencimiento']
    },
    {
      fields: ['local_id']
    }
  ]
});

// Método para calcular días de mora
VentaB2B.prototype.calcularDiasMora = function() {
  if (this.estado_pago === 'Pagado' || this.estado_pago === 'Anulado') {
    return 0;
  }
  
  const hoy = new Date();
  const vencimiento = new Date(this.fecha_vencimiento);
  
  if (hoy <= vencimiento) {
    return 0;
  }
  
  const diferencia = Math.floor((hoy - vencimiento) / (1000 * 60 * 60 * 24));
  return diferencia;
};


// Método para actualizar estado de pago
VentaB2B.prototype.actualizarEstadoPago = async function () {
  const saldo = parseFloat(this.saldo_pendiente);
  const total = parseFloat(this.total);
  
  if (saldo <= 0) {
    this.estado_pago = 'Pagado';
    this.fecha_pago_completo = new Date();
  } else if (saldo < total) {
    this.estado_pago = 'Parcial';
  } else if (new Date() > new Date(this.fecha_vencimiento)) {
    this.estado_pago = 'Vencido';
  } else {
    this.estado_pago = 'Pendiente';
  }
  
  await this.save();
};

module.exports = VentaB2B;
