const express = require('express')
const cors = require('cors')
const { Pool } = require('pg')
const axios = require('axios')

const app = express()
app.use(cors())
app.use(express.json())

// PostgreSQL config (usa variables de entorno en Railway)
const pool = new Pool({
  connectionString: "postgresql://postgres:rRomCPOCtDNtMVqNmJCwgpPGRRNzxfBE@caboose.proxy.rlwy.net:52156/railway",
  ssl: {
    rejectUnauthorized: false
  }
})

// Ruta que recibe datos del formulario
app.post('/formulario', async (req, res) => {
  const { nombre, ejercicio, fecha } = req.body
  console.log('Formulario recibido:', req.body)

  try {
    // Guardar en la base de datos
    await pool.query(
      'INSERT INTO ejercicios (nombre, ejercicio, fecha) VALUES ($1, $2, $3)',
      [nombre, ejercicio, fecha]
    )

    // Avisar a la ESP32
    await axios.get('http://192.168.1.29/activar') // Cambiar por IP real

    res.send('Formulario recibido, datos guardados y ESP32 activada.')
  } catch (err) {
    console.error('Error en el servidor:', err)
    res.status(500).send('Error al guardar o activar ESP32.')
  }
})

app.listen(process.env.PORT || 3000, () => {
  console.log('Servidor escuchando en puerto 3000')
})
