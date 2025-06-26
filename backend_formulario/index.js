import express from 'express';
import cors from 'cors';
import pool from './db.js';
import dotenv from 'dotenv';

dotenv.config();
const app = express();
app.use(cors());
app.use(express.json());

app.post('/enviar-datos', async (req, res) => {
  const { nombreApellido, fechaHora, edad, sexo, ejercicio } = req.body;
  try {
    const result = await pool.query(
      `INSERT INTO registros (nombre_apellido, fecha_hora, edad, sexo, ejercicio)
       VALUES ($1, $2, $3, $4, $5) RETURNING *`,
      [nombreApellido, fechaHora, edad, sexo, ejercicio]
    );
    res.status(200).json({ mensaje: 'Datos guardados', data: result.rows[0] });
  } catch (error) {
    console.error(error);
    res.status(500).json({ mensaje: 'Error en el servidor' });
  }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Servidor corriendo en puerto ${PORT}`);
});
