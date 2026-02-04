require('dotenv').config();
const sequelize = require('./config/database');

async function ejecutarMigracion() {
  try {
    console.log('🔄 Conectando a la base de datos...');
    await sequelize.authenticate();
    console.log('✅ Conexión establecida');

    console.log('🔄 Ejecutando migración B2B...');
    const migration = require('./migrations/fix-b2b-schema');
    const queryInterface = sequelize.getQueryInterface();
    
    await migration.up(queryInterface, sequelize.Sequelize);
    
    console.log('✅ Migración completada exitosamente');
    process.exit(0);
  } catch (error) {
    console.error('❌ Error al ejecutar migración:', error);
    process.exit(1);
  }
}

ejecutarMigracion();