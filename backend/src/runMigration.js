require('dotenv').config();
const { addBarrilFields } = require('./migrations/add-barril-fields');
const { sequelize } = require('./models');

// ⭐ Importar la nueva migración de intentos_acceso
const crearIntentosAcceso = require('./migrations/20260127-crear-intentos-acceso');

async function runMigrations() {
  try {
    console.log('🚀 Iniciando migraciones...');
    
    await sequelize.authenticate();
    console.log('✅ Conexión a base de datos establecida');
    
    // Migración existente
    await addBarrilFields();
    
    // ⭐ Nueva migración - Tabla intentos_acceso
    console.log('🔐 Creando tabla intentos_acceso...');
    try {
      await crearIntentosAcceso.up(sequelize.getQueryInterface(), sequelize.constructor);
      console.log('✅ Tabla intentos_acceso creada exitosamente');
    } catch (error) {
      if (error.name === 'SequelizeDatabaseError' && error.message.includes('already exists')) {
        console.log('⚠️  Tabla intentos_acceso ya existe');
      } else {
        throw error;
      }
    }
    
    console.log('🎉 Migraciones completadas exitosamente');
    process.exit(0);
  } catch (error) {
    console.error('❌ Error en migraciones:', error);
    process.exit(1);
  }
}

runMigrations();