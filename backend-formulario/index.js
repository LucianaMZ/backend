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
  let client;
  try {
    client = await pool.connect();
    // CAMBIADO: Nombre de la tabla de 'pacientes' a 'registros'
    await client.query(`
      CREATE TABLE IF NOT EXISTS registros (
        id SERIAL PRIMARY KEY,
        nombre_apellido VARCHAR(255) NOT NULL,
        edad INTEGER NOT NULL,
        sexo VARCHAR(50) NOT NULL,
        ejercicio VARCHAR(255) NOT NULL,
        fecha_hora TIMESTAMP WITH TIME ZONE NOT NULL
      );
    `);
    console.log('Tabla "registros" verificada/creada exitosamente.');
  } catch (err) {
    console.error('Error al inicializar la base de datos:', err);
    // Es crucial que la aplicación no continúe si la DB no se inicializa
    process.exit(1); // Sale de la aplicación si no se puede inicializar la DB
  } finally {
    if (client) {
      client.release();
    }
  }
}

// Llama a la función de inicialización al iniciar el servidor
// Aseguramos que la DB se inicialice antes de que el servidor empiece a escuchar
initializeDb().then(() => {
  const PORT = process.env.PORT || 3000;
  app.listen(PORT, () => {
    console.log(`Servidor escuchando en puerto ${PORT}`);
  });
});

// Ruta que recibe datos del formulario
app.post('/enviar-datos', async (req, res) => {
  const { nombreApellido, edad, sexo, ejercicio, fechaHora } = req.body;
  console.log('Datos del formulario recibidos:', req.body);

  let client; // Declara client aquí para que esté disponible en finally
  try {
    client = await pool.connect(); // Obtiene un cliente de la pool
    // Guardar en la base de datos
    // CAMBIADO: Nombre de la tabla de 'pacientes' a 'registros'
    await client.query(
      'INSERT INTO registros (nombre_apellido, edad, sexo, ejercicio, fecha_hora) VALUES ($1, $2, $3, $4, $5)',
      [nombreApellido, edad, sexo, ejercicio, fechaHora]
    );
    client.release(); // Libera el cliente de vuelta a la pool

    // Avisar a la ESP32
    // Asegúrate de que esta IP sea la correcta para tu ESP32
    await axios.get('http://192.168.1.29/activar');

    res.json({ mensaje: 'Formulario recibido, datos guardados y ESP32 activada.' });
  } catch (err) {
    console.error('Error en el servidor:', err);
    if (client) {
      client.release(); // Asegura que el cliente se libere incluso en caso de error
    }
    res.status(500).json({ mensaje: `Error al guardar o activar ESP32: ${err.message}` });
  }
});
