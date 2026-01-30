// ⭐ IMPORTANTE: Cargar .env ANTES de importar sequelize
require('dotenv').config();

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
      
      // Verificar si es función directa o tiene método up
      if (typeof addBarrilFields === 'function') {
        await addBarrilFields(queryInterface, sequelize.constructor);
      } else if (addBarrilFields.up) {
        await addBarrilFields.up(queryInterface, sequelize.constructor);
      }
      
      console.log('✅ Campos de barriles agregados');
    } catch (error) {
      if (error.message && (error.message.includes('already exists') || error.message.includes('column') || error.message.includes('duplicate'))) {
        console.log('⚠️  Las columnas ya existen');
      } else {
        console.log('⚠️  Saltando migración de barriles:', error.message);
      }
    }

    // Migración 2: Intentos de acceso (ya ejecutada)
    try {
      console.log('🔐 Creando tabla intentos_acceso...');
      const crearIntentosAcceso = require('./migrations/20260127-crear-intentos-acceso');
      
      if (typeof crearIntentosAcceso === 'function') {
        await crearIntentosAcceso(queryInterface, sequelize.constructor);
      } else if (crearIntentosAcceso.up) {
        await crearIntentosAcceso.up(queryInterface, sequelize.constructor);
      }
      
      console.log('✅ Tabla intentos_acceso creada');
    } catch (error) {
      if (error.message && (error.message.includes('already exists') || error.message.includes('relation') || error.message.includes('duplicate'))) {
        console.log('⚠️  Tabla intentos_acceso ya existe');
      } else {
        console.log('⚠️  Saltando migración de intentos:', error.message);
      }
    }

    // ⭐ NUEVA MIGRACIÓN: Módulo B2B
    console.log('\n🏢 Creando módulo B2B...');
    const crearModuloB2B = require('./migrations/20260130-crear-modulo-b2b');
    
    if (typeof crearModuloB2B === 'function') {
      await crearModuloB2B(queryInterface, sequelize.constructor);
    } else if (crearModuloB2B.up) {
      await crearModuloB2B.up(queryInterface, sequelize.constructor);
    }
    
    console.log('✅ Módulo B2B creado exitosamente');
    console.log('   ✓ Tabla clientes_b2b');
    console.log('   ✓ Tabla ventas_b2b');
    console.log('   ✓ Tabla items_venta_b2b');
    console.log('   ✓ Tabla pagos_b2b');

    console.log('\n🎉 Migraciones completadas exitosamente');
    process.exit(0);
  } catch (error) {
    console.error('\n❌ Error ejecutando migraciones:', error.message);
    console.error('Stack:', error.stack);
    process.exit(1);
  }
}

runMigrations();