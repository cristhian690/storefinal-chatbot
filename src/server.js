import "dotenv/config";
import express from "express";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const PORT = Number(process.env.PORT) || 3000;

const app = express();
app.use(express.json({ limit: "100kb" }));
app.use(express.static(path.join(__dirname, "..", "public")));

app.get("/api/salud", (req, res) => {
  res.json({ ok: true });
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
