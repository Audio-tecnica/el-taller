const sequelize = require('../config/database');

async function ejecutarMigracion() {
  try {
    console.log('🔄 Conectando...');
    await sequelize.authenticate();
    console.log('✅ Conectado');

    console.log('🔄 Creando tablas...');

    await sequelize.query(`
      CREATE TABLE IF NOT EXISTS impuestos (
        id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
        codigo VARCHAR(20) NOT NULL UNIQUE,
        nombre VARCHAR(100) NOT NULL,
        descripcion TEXT,
        tipo VARCHAR(20) NOT NULL DEFAULT 'Impuesto',
        porcentaje DECIMAL(5,2) NOT NULL,
        base_calculo VARCHAR(20) NOT NULL DEFAULT 'Subtotal',
        aplica_a VARCHAR(30) NOT NULL DEFAULT 'Todos',
        cuenta_contable VARCHAR(20),
        orden INTEGER NOT NULL DEFAULT 0,
        activo BOOLEAN NOT NULL DEFAULT true,
        fecha_creacion TIMESTAMP DEFAULT NOW(),
        fecha_actualizacion TIMESTAMP DEFAULT NOW()
      );
    `);
    console.log('✅ Tabla impuestos');

    await sequelize.query(`
      CREATE TABLE IF NOT EXISTS cliente_impuestos (
        id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
        cliente_b2b_id UUID NOT NULL REFERENCES clientes_b2b(id) ON DELETE CASCADE,
        impuesto_id UUID NOT NULL REFERENCES impuestos(id) ON DELETE CASCADE,
        porcentaje_personalizado DECIMAL(5,2),
        activo BOOLEAN NOT NULL DEFAULT true,
        fecha_creacion TIMESTAMP DEFAULT NOW(),
        UNIQUE(cliente_b2b_id, impuesto_id)
      );
    `);
    console.log('✅ Tabla cliente_impuestos');

    await sequelize.query(`
      CREATE TABLE IF NOT EXISTS venta_impuestos (
        id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
        venta_b2b_id UUID NOT NULL REFERENCES ventas_b2b(id) ON DELETE CASCADE,
        impuesto_id UUID NOT NULL REFERENCES impuestos(id),
        codigo_impuesto VARCHAR(20) NOT NULL,
        nombre_impuesto VARCHAR(100) NOT NULL,
        tipo VARCHAR(20) NOT NULL,
        porcentaje DECIMAL(5,2) NOT NULL,
        base DECIMAL(12,2) NOT NULL,
        monto DECIMAL(12,2) NOT NULL,
        fecha_creacion TIMESTAMP DEFAULT NOW()
      );
    `);
    console.log('✅ Tabla venta_impuestos');

    await sequelize.query(`
      INSERT INTO impuestos (codigo, nombre, descripcion, tipo, porcentaje, base_calculo, aplica_a, orden) VALUES
      ('IVA19', 'IVA 19%', 'Tarifa general', 'Impuesto', 19.00, 'Subtotal', 'Todos', 1),
      ('IVA5', 'IVA 5%', 'Tarifa reducida', 'Impuesto', 5.00, 'Subtotal', 'Todos', 2),
      ('IVA0', 'IVA Exento', 'Exentos', 'Impuesto', 0.00, 'Subtotal', 'Todos', 3),
      ('INC8', 'Impoconsumo 8%', 'Bares y restaurantes', 'Impuesto', 8.00, 'Subtotal', 'Todos', 4),
      ('RFTE25', 'ReteFuente 2.5%', 'Por compras', 'Retencion', 2.50, 'Subtotal', 'Todos', 10),
      ('RFTE35', 'ReteFuente 3.5%', 'Por servicios', 'Retencion', 3.50, 'Subtotal', 'Todos', 11),
      ('RIVA15', 'ReteIVA 15%', '15% del IVA', 'Retencion', 15.00, 'Subtotal', 'Todos', 12),
      ('RICA', 'ReteICA', 'Varía por municipio', 'Retencion', 0.69, 'Subtotal', 'Todos', 13)
      ON CONFLICT (codigo) DO NOTHING;
    `);
    console.log('✅ Datos insertados');

    console.log('🎉 ¡Migración completada!');
    process.exit(0);
  } catch (error) {
    console.error('❌ Error:', error.message);
    process.exit(1);
  }
}

ejecutarMigracion();