// Para instalar estas librerías:
// npm install express cors pg axios dotenv

const express = require('express');
const cors = require('cors');
const { Pool } = require('pg');
const axios = require('axios');
// Si usas dotenv para variables de entorno en desarrollo local
// require('dotenv').config();

const app = express();
app.use(cors());
app.use(express.json());

// PostgreSQL config (usa variables de entorno en Railway)
const pool = new Pool({
  // Se recomienda usar process.env.DATABASE_URL en producción con Railway
  // Para desarrollo local, puedes usar la cadena directamente o dotenv
  connectionString: process.env.DATABASE_URL || "postgresql://postgres:rRomCPOCtDNtMVqNmJCwgpPGRRNzxfBE@caboose.proxy.rlwy.net:52156/railway",
  ssl: {
    // Solo si tu base de datos requiere SSL y no está auto-firmado
    // En Railway, a menudo es necesario para conexiones externas
    rejectUnauthorized: false
  }
});

// Función para inicializar la base de datos (crear tabla si no existe)
async function initializeDb() {
  try {
    const client = await pool.connect();
    await client.query(`
      CREATE TABLE IF NOT EXISTS pacientes (
        id SERIAL PRIMARY KEY,
        nombre_apellido VARCHAR(255) NOT NULL,
        edad INTEGER NOT NULL,
        sexo VARCHAR(50) NOT NULL,
        ejercicio VARCHAR(255) NOT NULL,
        fecha_hora TIMESTAMP WITH TIME ZONE NOTALL
      );
    `);
    client.release();
    console.log('Tabla "pacientes" verificada/creada exitosamente.');
  } catch (err) {
    console.error('Error al inicializar la base de datos:', err);
  }
}

// Llama a la función de inicialización al iniciar el servidor
initializeDb();

// Ruta que recibe datos del formulario
// CAMBIADO: La ruta ahora es '/enviar-datos' para coincidir con el frontend
app.post('/enviar-datos', async (req, res) => {
  // CAMBIADO: Nombres de campos para coincidir con el frontend
  const { nombreApellido, edad, sexo, ejercicio, fechaHora } = req.body;
  console.log('Datos del formulario recibidos:', req.body);

  try {
    // Guardar en la base de datos
    // CAMBIADO: Nombres de columnas y número de parámetros para coincidir con la tabla 'pacientes'
    await pool.query(
      'INSERT INTO pacientes (nombre_apellido, edad, sexo, ejercicio, fecha_hora) VALUES ($1, $2, $3, $4, $5)',
      [nombreApellido, edad, sexo, ejercicio, fechaHora]
    );

    // Avisar a la ESP32
    // Asegúrate de que esta IP sea la correcta para tu ESP32
    await axios.get('http://192.168.1.29/activar');

    res.json({ mensaje: 'Formulario recibido, datos guardados y ESP32 activada.' });
  } catch (err) {
    console.error('Error en el servidor:', err);
    // Enviar una respuesta JSON de error
    res.status(500).json({ mensaje: `Error al guardar o activar ESP32: ${err.message}` });
  }
});

// El puerto debe ser el proporcionado por Railway en la variable de entorno PORT
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Servidor escuchando en puerto ${PORT}`);
});
