require('dotenv').config();
const { addBarrilFields } = require('./migrations/add-barril-fields');
const { sequelize } = require('./models');

async function runMigrations() {
  try {
    console.log('🚀 Iniciando migraciones...');
    
    await sequelize.authenticate();
    console.log('✅ Conexión a base de datos establecida');
    
    await addBarrilFields();
    
    console.log('🎉 Migraciones completadas exitosamente');
    process.exit(0);
  } catch (error) {
    console.error('❌ Error en migraciones:', error);
    process.exit(1);
  }
}

runMigrations();