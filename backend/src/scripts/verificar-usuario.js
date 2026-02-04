require('dotenv').config();
const { Usuario } = require('../models');
const sequelize = require('../config/database');

async function verificarUsuario() {
  try {
    await sequelize.authenticate();
    
    const usuarios = await Usuario.findAll({
      attributes: ['id', 'nombre', 'email', 'rol', 'local_asignado_id']
    });

    console.log('👥 Usuarios en el sistema:\n');
    usuarios.forEach(u => {
      console.log(`- ${u.nombre} (${u.email})`);
      console.log(`  Rol: ${u.rol}`);
      console.log(`  Local asignado: ${u.local_asignado_id || '❌ NO TIENE'}`);
      console.log('');
    });

    process.exit(0);
  } catch (error) {
    console.error('❌ Error:', error);
    process.exit(1);
  }
}

verificarUsuario();