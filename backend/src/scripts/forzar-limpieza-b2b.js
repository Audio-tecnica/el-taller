require('dotenv').config();
const sequelize = require('../config/database');

async function forzarLimpiezaB2B() {
  const transaction = await sequelize.transaction();
  
  try {
    console.log('🗑️  FORZANDO LIMPIEZA TOTAL DE B2B...\n');
    
    // 1. Desactivar constraints temporalmente
    await sequelize.query('SET CONSTRAINTS ALL DEFERRED', { transaction });
    console.log('✅ Constraints diferidos');

    // 2. Eliminar pagos B2B
    try {
      const [, pagosMeta] = await sequelize.query(
        'DELETE FROM pagos_b2b RETURNING id',
        { transaction }
      );
      console.log(`✅ ${pagosMeta.rowCount || 0} pagos B2B eliminados`);
    } catch (e) {
      console.log('⚠️  Tabla pagos_b2b no existe (normal si no se ha creado)');
    }

    // 3. Eliminar items de ventas
    const [, itemsMeta] = await sequelize.query(
      'DELETE FROM items_venta_b2b RETURNING id',
      { transaction }
    );
    console.log(`✅ ${itemsMeta.rowCount || 0} items de ventas eliminados`);

    // 4. Eliminar movimientos de inventario
    const [, movMeta] = await sequelize.query(
      `DELETE FROM movimientos_inventario 
       WHERE tipo_movimiento LIKE '%B2B%' 
          OR observaciones LIKE '%B2B%'
       RETURNING id`,
      { transaction }
    );
    console.log(`✅ ${movMeta.rowCount || 0} movimientos de inventario eliminados`);

    // 5. Eliminar ventas
    const [, ventasMeta] = await sequelize.query(
      'DELETE FROM ventas_b2b RETURNING id',
      { transaction }
    );
    console.log(`✅ ${ventasMeta.rowCount || 0} ventas B2B eliminadas`);

    // 6. Resetear clientes
    const [, clientesMeta] = await sequelize.query(
      `UPDATE clientes_b2b 
       SET credito_utilizado = 0,
           total_ventas = 0,
           total_facturas = 0,
           ultima_compra = NULL
       WHERE TRUE
       RETURNING id`,
      { transaction }
    );
    console.log(`✅ ${clientesMeta.rowCount || 0} clientes reseteados`);

    // COMMIT
    await transaction.commit();
    console.log('\n🎉 ¡LIMPIEZA COMPLETA EXITOSA!\n');

    // Verificación final
    console.log('📊 VERIFICACIÓN FINAL:\n');
    const [ventas] = await sequelize.query('SELECT COUNT(*) as count FROM ventas_b2b');
    const [items] = await sequelize.query('SELECT COUNT(*) as count FROM items_venta_b2b');
    const [clientes] = await sequelize.query(
      'SELECT razon_social, credito_utilizado, total_ventas, total_facturas FROM clientes_b2b'
    );

    console.log(`Ventas B2B: ${ventas[0].count}`);
    console.log(`Items: ${items[0].count}`);
    console.log('\nClientes:');
    console.table(clientes);

    process.exit(0);
  } catch (error) {
    await transaction.rollback();
    console.error('❌ ERROR:', error);
    process.exit(1);
  }
}

forzarLimpiezaB2B();