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
  iva_porcentaje: {
    type: DataTypes.DECIMAL(5, 2),
    allowNull: true,
    defaultValue: 0,
    comment: 'Porcentaje de IVA aplicado (ej: 19.00 para 19%) - DEPRECADO: usar compras_impuestos'
  },
  impuestos: {
    type: DataTypes.DECIMAL(14, 4),
    defaultValue: 0,
    comment: 'Total de impuestos - se calcula de compras_impuestos'
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
  // ⭐ NUEVOS CAMPOS PARA GESTIÓN DE PAGOS
  forma_pago: {
    type: DataTypes.ENUM('contado', 'credito'),
    allowNull: false,
    defaultValue: 'contado',
    comment: 'Forma de pago: contado o crédito'
  },
  estado_pago: {
    type: DataTypes.ENUM('pendiente', 'pagado', 'parcial'),
    allowNull: false,
    defaultValue: 'pendiente',
    comment: 'Estado del pago de la compra'
  },
  fecha_vencimiento: {
    type: DataTypes.DATEONLY,
    allowNull: true,
    comment: 'Fecha de vencimiento para compras a crédito'
  },
  dias_credito: {
    type: DataTypes.INTEGER,
    allowNull: true,
    comment: 'Días de crédito otorgados por el proveedor'
  },
  monto_pagado: {
    type: DataTypes.DECIMAL(14, 4),
    allowNull: false,
    defaultValue: 0,
    comment: 'Monto total pagado de la compra'
  },
  saldo_pendiente: {
    type: DataTypes.DECIMAL(14, 4),
    allowNull: false,
    defaultValue: 0,
    comment: 'Saldo pendiente de pago'
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
  },
  factura_pdf_url: {
    type: DataTypes.TEXT,
    allowNull: true,
    comment: 'URL del PDF de factura generado'
  }
}, {
  tableName: 'compras',
  timestamps: true,
  createdAt: 'created_at',
  updatedAt: 'updated_at'
});

// Métodos del modelo
Compra.prototype.calcularVencimiento = function() {
  if (this.forma_pago === 'credito' && this.dias_credito && this.fecha_factura) {
    const fechaFactura = new Date(this.fecha_factura);
    fechaFactura.setDate(fechaFactura.getDate() + this.dias_credito);
    return fechaFactura;
  }
  return null;
};

Compra.prototype.actualizarEstadoPago = function() {
  const saldo = parseFloat(this.saldo_pendiente) || 0;
  const pagado = parseFloat(this.monto_pagado) || 0;
  
  if (saldo === 0 || pagado >= parseFloat(this.total)) {
    this.estado_pago = 'pagado';
  } else if (pagado > 0) {
    this.estado_pago = 'parcial';
  } else {
    this.estado_pago = 'pendiente';
  }
};

Compra.prototype.estaVencida = function() {
  if (this.forma_pago === 'credito' && this.fecha_vencimiento && this.estado_pago !== 'pagado') {
    const hoy = new Date();
    hoy.setHours(0, 0, 0, 0);
    const vencimiento = new Date(this.fecha_vencimiento);
    vencimiento.setHours(0, 0, 0, 0);
    return vencimiento < hoy;
  }
  return false;
};

Compra.prototype.diasParaVencimiento = function() {
  if (this.forma_pago === 'credito' && this.fecha_vencimiento) {
    const hoy = new Date();
    hoy.setHours(0, 0, 0, 0);
    const vencimiento = new Date(this.fecha_vencimiento);
    vencimiento.setHours(0, 0, 0, 0);
    const diff = vencimiento - hoy;
    return Math.ceil(diff / (1000 * 60 * 60 * 24));
  }
  return null;
};

module.exports = Compra;