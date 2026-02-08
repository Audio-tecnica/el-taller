const UrlCorta = require('../models/UrlCorta');
const { Op } = require('sequelize');

// Generar código único aleatorio
const generarCodigoUnico = async () => {
  const caracteres = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  const longitud = 6; // Código de 6 caracteres
  
  let codigo;
  let existe = true;
  
  // Intentar hasta encontrar un código único
  while (existe) {
    codigo = '';
    for (let i = 0; i < longitud; i++) {
      codigo += caracteres.charAt(Math.floor(Math.random() * caracteres.length));
    }
    
    // Verificar si ya existe
    const urlExistente = await UrlCorta.findOne({ where: { codigo } });
    existe = urlExistente !== null;
  }
  
  return codigo;
};

// Crear URL corta
exports.crearUrlCorta = async (req, res) => {
  try {
    const { url_original, tipo = 'factura', expira_dias } = req.body;
    
    if (!url_original) {
      return res.status(400).json({ error: 'URL original es requerida' });
    }
    
    // Verificar si ya existe una URL corta para esta URL original (activa)
    const urlExistente = await UrlCorta.findOne({
      where: {
        url_original,
        activo: true,
        [Op.or]: [
          { expira_en: null },
          { expira_en: { [Op.gt]: new Date() } }
        ]
      }
    });
    
    if (urlExistente) {
      // Retornar la existente si aún es válida
      return res.json({
        codigo: urlExistente.codigo,
        url_corta: `${req.protocol}://${req.get('host')}/s/${urlExistente.codigo}`,
        url_original: urlExistente.url_original,
        existente: true
      });
    }
    
    // Generar nuevo código único
    const codigo = await generarCodigoUnico();
    
    // Calcular fecha de expiración si se especifica
    let expira_en = null;
    if (expira_dias) {
      expira_en = new Date();
      expira_en.setDate(expira_en.getDate() + expira_dias);
    }
    
    // Crear registro
    const urlCorta = await UrlCorta.create({
      codigo,
      url_original,
      tipo,
      expira_en
    });
    
    res.status(201).json({
      codigo: urlCorta.codigo,
      url_corta: `${req.protocol}://${req.get('host')}/s/${urlCorta.codigo}`,
      url_original: urlCorta.url_original,
      expira_en: urlCorta.expira_en
    });
    
  } catch (error) {
    console.error('Error al crear URL corta:', error);
    res.status(500).json({ error: 'Error al crear URL corta' });
  }
};

// Redirigir a URL original
exports.redirigirUrl = async (req, res) => {
  try {
    const { codigo } = req.params;
    
    const urlCorta = await UrlCorta.findOne({
      where: {
        codigo,
        activo: true
      }
    });
    
    if (!urlCorta) {
      return res.status(404).send(`
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="UTF-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <title>Enlace no encontrado</title>
          <style>
            body {
              font-family: system-ui, -apple-system, sans-serif;
              display: flex;
              align-items: center;
              justify-content: center;
              min-height: 100vh;
              margin: 0;
              background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
              color: white;
              text-align: center;
              padding: 20px;
            }
            .container {
              max-width: 500px;
            }
            h1 { font-size: 3em; margin: 0 0 20px 0; }
            p { font-size: 1.2em; opacity: 0.9; }
          </style>
        </head>
        <body>
          <div class="container">
            <h1>😕</h1>
            <h1>Enlace no encontrado</h1>
            <p>Este enlace no existe o ha expirado</p>
          </div>
        </body>
        </html>
      `);
    }
    
    // Verificar si ha expirado
    if (urlCorta.expira_en && new Date() > urlCorta.expira_en) {
      return res.status(410).send(`
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="UTF-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <title>Enlace expirado</title>
          <style>
            body {
              font-family: system-ui, -apple-system, sans-serif;
              display: flex;
              align-items: center;
              justify-content: center;
              min-height: 100vh;
              margin: 0;
              background: linear-gradient(135deg, #f093fb 0%, #f5576c 100%);
              color: white;
              text-align: center;
              padding: 20px;
            }
            .container {
              max-width: 500px;
            }
            h1 { font-size: 3em; margin: 0 0 20px 0; }
            p { font-size: 1.2em; opacity: 0.9; }
          </style>
        </head>
        <body>
          <div class="container">
            <h1>⏱️</h1>
            <h1>Enlace expirado</h1>
            <p>Este enlace ya no está disponible</p>
          </div>
        </body>
        </html>
      `);
    }
    
    // Incrementar contador de vistas
    await urlCorta.increment('vistas');
    
    // Redirigir a la URL original
    res.redirect(urlCorta.url_original);
    
  } catch (error) {
    console.error('Error al redirigir URL:', error);
    res.status(500).send(`
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Error</title>
        <style>
          body {
            font-family: system-ui, -apple-system, sans-serif;
            display: flex;
            align-items: center;
            justify-content: center;
            min-height: 100vh;
            margin: 0;
            background: linear-gradient(135deg, #fa709a 0%, #fee140 100%);
            color: white;
            text-align: center;
            padding: 20px;
          }
          .container {
            max-width: 500px;
          }
          h1 { font-size: 3em; margin: 0 0 20px 0; }
          p { font-size: 1.2em; opacity: 0.9; }
        </style>
      </head>
      <body>
        <div class="container">
          <h1>⚠️</h1>
          <h1>Error</h1>
          <p>Ocurrió un error al procesar tu solicitud</p>
        </div>
      </body>
      </html>
    `);
  }
};

// Obtener estadísticas de una URL corta (opcional)
exports.obtenerEstadisticas = async (req, res) => {
  try {
    const { codigo } = req.params;
    
    const urlCorta = await UrlCorta.findOne({
      where: { codigo }
    });
    
    if (!urlCorta) {
      return res.status(404).json({ error: 'URL no encontrada' });
    }
    
    res.json({
      codigo: urlCorta.codigo,
      vistas: urlCorta.vistas,
      tipo: urlCorta.tipo,
      activo: urlCorta.activo,
      expira_en: urlCorta.expira_en,
      createdAt: urlCorta.createdAt
    });
    
  } catch (error) {
    console.error('Error al obtener estadísticas:', error);
    res.status(500).json({ error: 'Error al obtener estadísticas' });
  }
};

// Desactivar URL corta
exports.desactivarUrl = async (req, res) => {
  try {
    const { codigo } = req.params;
    
    const urlCorta = await UrlCorta.findOne({
      where: { codigo }
    });
    
    if (!urlCorta) {
      return res.status(404).json({ error: 'URL no encontrada' });
    }
    
    await urlCorta.update({ activo: false });
    
    res.json({ mensaje: 'URL desactivada correctamente' });
    
  } catch (error) {
    console.error('Error al desactivar URL:', error);
    res.status(500).json({ error: 'Error al desactivar URL' });
  }
};
