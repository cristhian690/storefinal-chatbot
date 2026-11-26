import "dotenv/config";
import express from "express";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { verificarConexion } from "./db.js";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const PORT = Number(process.env.PORT) || 3000;

const app = express();
app.use(express.json({ limit: "100kb" }));
app.use(express.static(path.join(__dirname, "..", "public")));

app.get("/api/salud", async (req, res) => {
  try {
    const db = await verificarConexion();
    res.json({
      ok: true,
      db: "conectada",
      hora_servidor: db.hora_servidor,
    });
  } catch (error) {
    console.error("Error de conexión a la BD:", error.message);
    res.status(500).json({
      ok: false,
      db: "desconectada",
      detalle: error.message,
    });
  }
});

app.post("/api/chat", (req, res) => {
  const mensaje = typeof req.body?.mensaje === "string" ? req.body.mensaje.trim() : "";

  if (!mensaje) {
    return res.status(400).json({ error: "Escribe un mensaje para continuar" });
  }

  res.json({
    respuesta: "¡Hola! Encontré esta computadora disponible en tienda. ¿Te gustaría ver sus datos técnicos?",
    productos: [
      {
        id: 1,
        categoria: "Informática",
        marca: "DELL",
        modelo: "All in One",
        precio: 4500,
        stock: 5,
        disponible: true,
        metodopago: "visa",
        fotografia: "/img/dell-aio.jpg"
      }
    ],
    previousResponseId: req.body?.previousResponseId ?? "mock_1"
  });
});

app.listen(PORT, (error) => {
  if (error) {
    console.error(`No se pudo iniciar el servidor: ${error.message}`);
    process.exit(1);
  }
  console.log(`Servidor en http://localhost:${PORT}`);
});
