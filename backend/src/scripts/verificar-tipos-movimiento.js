require('dotenv').config();
const sequelize = require('../config/database');

async function verificarTipos() {
  try {
    const [results] = await sequelize.query(`
      SELECT 
        constraint_name,
        check_clause
      FROM information_schema.check_constraints
      WHERE constraint_name = 'movimientos_inventario_tipo_check';
    `);
    
    console.log('✅ Constraint encontrado:');
    console.log(results);
    
    // También consultar el ENUM si existe
    const [enumResults] = await sequelize.query(`
      SELECT 
        t.typname,
        e.enumlabel
      FROM pg_type t 
      JOIN pg_enum e ON t.oid = e.enumtypid  
      WHERE t.typname LIKE '%movimiento%tipo%'
      ORDER BY e.enumsortorder;
    `);
    
    console.log('\n✅ Valores ENUM permitidos:');
    console.log(enumResults);
    
    process.exit(0);
  } catch (error) {
    console.error('❌ Error:', error);
    process.exit(1);
  }
}

verificarTipos();