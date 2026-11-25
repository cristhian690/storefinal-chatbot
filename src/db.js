import "dotenv/config";
import pg from "pg";


const { Pool } = pg;

//Pool de conexión usando las variables del archivo .env
export const pool = new Pool({
  host: process.env.DB_HOST || "localhost",
  port: Number(process.env.DB_PORT) || 5432,
  user: process.env.DB_USER || "postgres",
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME || "storefinal",
});

// Verifica la conexión (útil para el endpoint GET /api/salud)
export async function verificarConexion() {
  const { rows } = await pool.query("SELECT NOW() AS hora_servidor");
  return rows[0];
}

// Requisito 1: Buscar productos por texto (marca, modelo, categoría, descripción) o precio máximo
export async function buscarProductos({ consulta, categoria, precioMax } = {}) {
  const texto = (consulta ?? "").trim();
  const cat = (categoria ?? "").trim();
  const condiciones = [];
  const valores = [];

  if (texto) {
    valores.push(`%${texto}%`);
    const i = valores.length;
    condiciones.push(
      `(marca ILIKE $${i} OR modelo ILIKE $${i} OR categoria ILIKE $${i} OR descripcion ILIKE $${i})`
    );
  }

  if (cat) {
    valores.push(`%${cat}%`);
    condiciones.push(`categoria ILIKE $${valores.length}`);
  }

  if (precioMax !== null && precioMax !== undefined && Number(precioMax) > 0) {
    valores.push(Number(precioMax));
    condiciones.push(`precio <= $${valores.length}`);
  }

  const where = condiciones.length > 0 ? `WHERE ${condiciones.join(" AND ")}` : "";

  const sql = `
    SELECT id, categoria, marca, modelo, descripcion, garantia, stock, fotografia, metodopago, precio::float AS precio, disponible
    FROM productos
    ${where}
    ORDER BY disponible DESC, precio ASC
    LIMIT 10
  `;

  const { rows } = await pool.query(sql, valores);
  return rows;
}

// Obtener especificaciones técnicas y registrar la consulta en "consultados"
export async function verEspecificaciones({ idproducto }) {
  const id = Number(idproducto);
  if (!Number.isInteger(id) || id <= 0) {
    return { exito: false, mensaje: "ID de producto inválido." };
  }

  //1.Verificar que el producto exista
  const prodRes = await pool.query(
    `SELECT id, marca, modelo, categoria, precio::float AS precio, garantia, stock, metodopago, disponible
     FROM productos
     WHERE id = $1`,
    [id]
  );

  if (prodRes.rows.length === 0) {
    return { exito: false, mensaje: `No existe ningún producto  con el ID ${id}.` };
  }

  //2.Obtener sus especificaciones técnicas
  const espRes = await pool.query(
    `SELECT especificacion, valor
     FROM especificaciones
     WHERE idproducto = $1
     ORDER BY id ASC`,
    [id]
  );

  //3.Registrar automáticamente en la tabla "consultados"
  await pool.query(
    `INSERT INTO consultados (idproducto, fechahora) VALUES ($1, NOW())`,
    [id]
  );

  return {
    exito: true,
    producto: prodRes.rows[0],
    especificaciones: espRes.rows,
  };
}

//Extra: Reporte de productos más consultados (para video)
export async function obtenerMasConsultados() {
  const { rows } = await pool.query(`
    SELECT p.id, p.marca, p.modelo, COUNT(c.id)::int AS total_consultas
    FROM consultados c
    JOIN productos p ON p.id = c.idproducto
    GROUP BY p.id, p.marca, p.modelo
    ORDER BY total_consultas DESC
  `);
  return rows;
}
