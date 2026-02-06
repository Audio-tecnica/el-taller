const sequelize = require('./config/database');

async function ejecutarMigracionIVA() {
  try {
    console.log('🔌 Conectando a la base de datos...');
    await sequelize.authenticate();
    console.log('✅ Conexión establecida');

    const migration = require('./migrations/20260206-agregar-iva-porcentaje-compras');
    
    console.log('🚀 Ejecutando migración: agregar campo iva_porcentaje a compras...');
    await migration.up(sequelize.getQueryInterface(), sequelize.constructor);
    console.log('✅ Migración completada exitosamente');
    
    process.exit(0);
  } catch (error) {
    console.error('❌ Error ejecutando migración:', error.message);
    console.error('Stack:', error.stack);
    process.exit(1);
  }
}

ejecutarMigracionIVA();