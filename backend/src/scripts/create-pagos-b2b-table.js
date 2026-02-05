require('dotenv').config();
const sequelize = require('../config/database');

async function crearTablaPagosB2B() {
  try {
    console.log('🔄 Conectando a la base de datos...');
    await sequelize.authenticate();
    console.log('✅ Conexión establecida');

    console.log('🔄 Creando tabla pagos_b2b...');

    await sequelize.query(`
      CREATE TABLE IF NOT EXISTS pagos_b2b (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        numero_recibo VARCHAR(50) UNIQUE NOT NULL,
        venta_b2b_id UUID NOT NULL REFERENCES ventas_b2b(id) ON DELETE RESTRICT,
        cliente_b2b_id UUID NOT NULL REFERENCES clientes_b2b(id) ON DELETE RESTRICT,
        monto DECIMAL(12, 2) NOT NULL CHECK (monto > 0),
        metodo_pago VARCHAR(50) NOT NULL CHECK (metodo_pago IN ('Efectivo', 'Transferencia', 'Cheque', 'Tarjeta')),
        referencia_pago VARCHAR(100),
        banco VARCHAR(100),
        fecha_pago TIMESTAMP NOT NULL DEFAULT NOW(),
        recibido_por UUID REFERENCES usuarios(id),
        turno_id UUID REFERENCES turnos(id),
        estado VARCHAR(20) NOT NULL DEFAULT 'Aplicado' CHECK (estado IN ('Aplicado', 'Anulado')),
        anulado_por UUID REFERENCES usuarios(id),
        fecha_anulacion TIMESTAMP,
        motivo_anulacion TEXT,
        notas TEXT,
        fecha_creacion TIMESTAMP NOT NULL DEFAULT NOW(),
        fecha_actualizacion TIMESTAMP NOT NULL DEFAULT NOW()
      );
    `);

    console.log('✅ Tabla pagos_b2b creada');

    console.log('🔄 Creando índices...');

    await sequelize.query(`
      CREATE INDEX IF NOT EXISTS idx_pagos_b2b_venta ON pagos_b2b(venta_b2b_id);
      CREATE INDEX IF NOT EXISTS idx_pagos_b2b_cliente ON pagos_b2b(cliente_b2b_id);
      CREATE INDEX IF NOT EXISTS idx_pagos_b2b_fecha ON pagos_b2b(fecha_pago);
      CREATE INDEX IF NOT EXISTS idx_pagos_b2b_estado ON pagos_b2b(estado);
      CREATE INDEX IF NOT EXISTS idx_pagos_b2b_numero ON pagos_b2b(numero_recibo);
    `);

    console.log('✅ Índices creados');
    console.log('');
    console.log('🎉 ¡Tabla pagos_b2b lista para usar!');
    console.log('');

    process.exit(0);
  } catch (error) {
    console.error('❌ Error al crear tabla pagos_b2b:', error);
    console.error('Detalles:', error.message);
    process.exit(1);
  }
}

crearTablaPagosB2B();