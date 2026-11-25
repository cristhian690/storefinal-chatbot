# STOREFINAL Chatbot

Chatbot de atención al cliente para la tienda de productos tecnológicos **InnovVentas**. Ayuda a los clientes a buscar productos, ver sus datos técnicos y resolver dudas sobre el proceso de compra.

Trabajo final del curso **AI-900T00 Conceptos Básicos de IA en Microsoft Azure** (SENATI).

> Proyecto en desarrollo.

## Funcionalidades

- Búsqueda de productos por nombre, marca, categoría o precio.
- Opción de ver los datos técnicos de cada producto.
- Registro de cada consulta a los datos técnicos en la tabla `consultados`.
- Respuesta amable cuando la consulta no es sobre la tienda.
- Lista negra de términos inadecuados.
- Ayuda sobre métodos de pago, envíos, garantía y comprobantes.

## Tecnologías

- Node.js + Express
- PostgreSQL
- Azure OpenAI (modelo `gpt-5.4-mini`)
- HTML, CSS y JavaScript

## Base de datos

BD `storefinal` con tres tablas:

| Tabla | Descripción |
|---|---|
| `productos` | Catálogo de la tienda |
| `especificaciones` | Datos técnicos de cada producto |
| `consultados` | Registro de consultas a los datos técnicos |

## Instalación

1. Clonar el repositorio:
   ```bash
   git clone https://github.com/cristhian690/storefinal-chatbot.git
   cd storefinal-chatbot
   ```
2. Instalar dependencias:
   ```bash
   npm install
   ```
3. Crear la base de datos `storefinal` en PostgreSQL y ejecutar `sql/storefinal.sql`.
4. Copiar `.env.example` como `.env` y completar los datos de Azure y PostgreSQL.
5. Iniciar el servidor:
   ```bash
   npm run dev
   ```
6. Abrir `http://localhost:3000`.

## Integrantes

- Cristhian
- Isaac
