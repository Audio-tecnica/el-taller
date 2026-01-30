const sequelize = require('./config/database');

async function runMigrations() {
  try {
    console.log('🚀 Iniciando migraciones...');
    
    // Verificar conexión
    await sequelize.authenticate();
    console.log('✅ Conexión a base de datos establecida');

    const queryInterface = sequelize.getQueryInterface();

    // Migración 1: Barriles (ya ejecutada)
    try {
      console.log('🚀 Agregando campos para gestión de barriles...');
      const addBarrilFields = require('./migrations/add-barril-fields');
      await addBarrilFields.up(queryInterface, sequelize.constructor);
      console.log('✅ Campos de barriles agregados');
    } catch (error) {
      if (error.message && error.message.includes('already exists')) {
        console.log('⚠️  Las columnas ya existen');
      } else {
        throw error;
      }
    }

    // Migración 2: Intentos de acceso (ya ejecutada)
    try {
      console.log('🔐 Creando tabla intentos_acceso...');
      const crearIntentosAcceso = require('./migrations/20260127-crear-intentos-acceso');
      await crearIntentosAcceso.up(queryInterface, sequelize.constructor);
      console.log('✅ Tabla intentos_acceso creada');
    } catch (error) {
      if (error.message && error.message.includes('already exists')) {
        console.log('⚠️  Tabla intentos_acceso ya existe');
      } else {
        throw error;
      }
    }

    // ⭐ NUEVA MIGRACIÓN: Módulo B2B
    try {
      console.log('🏢 Creando módulo B2B...');
      const crearModuloB2B = require('./migrations/20260130-crear-modulo-b2b');
      await crearModuloB2B.up(queryInterface, sequelize.constructor);
      console.log('✅ Módulo B2B creado exitosamente');
      console.log('   - Tabla clientes_b2b ✓');
      console.log('   - Tabla ventas_b2b ✓');
      console.log('   - Tabla items_venta_b2b ✓');
      console.log('   - Tabla pagos_b2b ✓');
    } catch (error) {
      if (error.message && error.message.includes('already exists')) {
        console.log('⚠️  Las tablas B2B ya existen');
      } else {
        console.error('❌ Error creando módulo B2B:', error);
        throw error;
      }
    }

    console.log('🎉 Migraciones completadas exitosamente');
    process.exit(0);
  } catch (error) {
    console.error('❌ Error ejecutando migraciones:', error);
    process.exit(1);
  }
}

runMigrations();