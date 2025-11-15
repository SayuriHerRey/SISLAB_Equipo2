import pg from 'pg';
import 'dotenv/config'; // Carga las variables de .env

const { Pool } = pg;

// Configura el pool de conexiones usando las variables de entorno
const pool = new Pool({
  user: process.env.DB_USER,
  host: process.env.DB_HOST,
  database: process.env.DB_DATABASE,
  password: process.env.DB_PASSWORD,
  port: process.env.DB_PORT,
});

// Mensaje de éxito si la conexión funciona
pool.query('SELECT NOW()', (err, res) => {
  if (err) {
    console.error('Error al conectar con la base de datos:', err.stack);
  } else {
    console.log(`Conexión exitosa a la base de datos [${process.env.DB_DATABASE}]`);
  }
});

// Exportamos una función 'query' para usarla en los modelos
export const query = (text, params) => pool.query(text, params);