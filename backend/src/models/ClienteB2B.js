const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const ClienteB2B = sequelize.define('ClienteB2B', {
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true
  },
  tipo_documento: {
    type: DataTypes.ENUM('NIT', 'CC', 'CE', 'RUT'),
    allowNull: false,
    defaultValue: 'NIT'
  },
  numero_documento: {
    type: DataTypes.STRING(50),
    allowNull: false,
    unique: true
  },
  razon_social: {
    type: DataTypes.STRING(200),
    allowNull: false
  },
  nombre_comercial: {
    type: DataTypes.STRING(200),
    allowNull: true
  },
  nombre_contacto: {
    type: DataTypes.STRING(100),
    allowNull: false
  },
  cargo_contacto: {
    type: DataTypes.STRING(100),
    allowNull: true
  },
  email: {
    type: DataTypes.STRING(100),
    allowNull: false,
    validate: {
      isEmail: true
    }
  },
  telefono: {
    type: DataTypes.STRING(20),
    allowNull: false
  },
  telefono_secundario: {
    type: DataTypes.STRING(20),
    allowNull: true
  },
  direccion: {
    type: DataTypes.STRING(200),
    allowNull: false
  },
  ciudad: {
    type: DataTypes.STRING(100),
    allowNull: false,
    defaultValue: 'Montería'
  },
  departamento: {
    type: DataTypes.STRING(100),
    allowNull: false,
    defaultValue: 'Córdoba'
  },
  codigo_postal: {
    type: DataTypes.STRING(10),
    allowNull: true
  },
  // Información comercial
  limite_credito: {
    type: DataTypes.DECIMAL(12, 2),
    allowNull: false,
    defaultValue: 0
  },
  credito_disponible: {
    type: DataTypes.DECIMAL(12, 2),
    allowNull: false,
    defaultValue: 0
  },
  dias_credito: {
    type: DataTypes.INTEGER,
    allowNull: false,
    defaultValue: 30,
    comment: 'Días de plazo para pago'
  },
  descuento_porcentaje: {
    type: DataTypes.DECIMAL(5, 2),
    allowNull: true,
    defaultValue: 0,
    validate: {
      min: 0,
      max: 100
    }
  },
  // Información bancaria (opcional)
  banco: {
    type: DataTypes.STRING(100),
    allowNull: true
  },
  tipo_cuenta: {
    type: DataTypes.ENUM('Ahorros', 'Corriente'),
    allowNull: true
  },
  numero_cuenta: {
    type: DataTypes.STRING(50),
    allowNull: true
  },
  // Estado y control
  estado: {
    type: DataTypes.ENUM('Activo', 'Inactivo', 'Suspendido', 'Bloqueado'),
    allowNull: false,
    defaultValue: 'Activo'
  },
  bloqueado_por_mora: {
    type: DataTypes.BOOLEAN,
    defaultValue: false
  },
  dias_mora_maximo: {
    type: DataTypes.INTEGER,
    defaultValue: 0,
    comment: 'Máximo días de mora histórico'
  },
  // Observaciones
  notas: {
    type: DataTypes.TEXT,
    allowNull: true
  },
  // Estadísticas
  total_ventas: {
    type: DataTypes.DECIMAL(12, 2),
    defaultValue: 0
  },
  total_facturas: {
    type: DataTypes.INTEGER,
    defaultValue: 0
  },
  ultima_compra: {
    type: DataTypes.DATE,
    allowNull: true
  },
  // Auditoría
  creado_por: {
    type: DataTypes.UUID,
    allowNull: true,
    references: {
      model: 'usuarios',
      key: 'id'
    }
  },
  actualizado_por: {
    type: DataTypes.UUID,
    allowNull: true,
    references: {
      model: 'usuarios',
      key: 'id'
    }
  }
}, {
  tableName: 'clientes_b2b',
  timestamps: true,
  createdAt: 'fecha_creacion',
  updatedAt: 'fecha_actualizacion',
  indexes: [
    {
      unique: true,
      fields: ['numero_documento']
    },
    {
      fields: ['razon_social']
    },
    {
      fields: ['estado']
    },
    {
      fields: ['email']
    }
  ]
});

// Método para calcular crédito disponible
ClienteB2B.prototype.calcularCreditoDisponible = async function() {
  const { VentaB2B } = require('./index');
  
  // Obtener total de facturas pendientes
  const ventasPendientes = await VentaB2B.sum('saldo_pendiente', {
    where: {
      cliente_b2b_id: this.id,
      estado_pago: ['Pendiente', 'Parcial']
    }
  }) || 0;

  const creditoDisponible = parseFloat(this.limite_credito) - parseFloat(ventasPendientes);
  
  this.credito_disponible = creditoDisponible;
  await this.save();
  
  return creditoDisponible;
};

// Método para verificar si el cliente puede comprar
ClienteB2B.prototype.puedeComprar = function(montoVenta) {
  if (this.estado !== 'Activo') {
    return { puede: false, razon: 'Cliente inactivo' };
  }
  
  if (this.bloqueado_por_mora) {
    return { puede: false, razon: 'Cliente bloqueado por mora' };
  }
  
  if (parseFloat(this.credito_disponible) < parseFloat(montoVenta)) {
    return { puede: false, razon: 'Crédito insuficiente' };
  }
  
  return { puede: true };
};

module.exports = ClienteB2B;
