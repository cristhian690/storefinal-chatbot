import "dotenv/config";
import OpenAI from "openai";
import { buscarProductos, verEspecificaciones } from "./db.js";

// Credenciales desde .env
const CONFIG = {
  endpoint: process.env.AZURE_ENDPOINT,
  apiKey: process.env.AZURE_API_KEY,
  deploymentName: process.env.AZURE_DEPLOYMENT,
};

if (!CONFIG.endpoint || !CONFIG.apiKey || !CONFIG.deploymentName) {
  console.error("Error: Faltan variables AZURE_* en el archivo .env");
  process.exit(1);
}

const openai = new OpenAI({
  baseURL: CONFIG.endpoint,
  apiKey: CONFIG.apiKey,
});

//Lista negra (corta el flujo antes de la IA)
const LISTA_NEGRA = ["muerte", "armas", "alcohol"];

const normalizar = (texto) =>
  texto.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase();

function contieneTerminoProhibido(texto) {
  const limpio = normalizar(texto);
  return LISTA_NEGRA.some((termino) =>
    new RegExp(`\\b${termino}\\b`, "i").test(limpio)
  );
}


//Arreglo de parámetros para proceso de compra

const PROCESO_COMPRA = [
  {
    tema: "metodos_pago",
    titulo: "Métodos de pago",
    detalle:
      "Aceptamos pago en efectivo (en tienda o contra entrega) y tarjeta Visa (crédito o débito). Cada producto indica su método de pago habilitado.",
  },
  {
    tema: "envios",
    titulo: "Envíos y entregas",
    detalle:
      "Realizamos envíos a domicilio en 24 a 48 horas hábiles dentro de la ciudad, y también contamos con recojo gratuito en tienda.",
  },
  {
    tema: "pasos_compra",
    titulo: "Cómo comprar",
    detalle:
      "1) Elige tu producto y verifica el stock disponible. 2) Confirma tu método de pago (efectivo o Visa). 3) Brinda tus datos para boleta o factura. 4) Coordina el recojo en tienda o el envío a domicilio.",
  },
  {
    tema: "garantia",
    titulo: "Garantía y devoluciones",
    detalle:
      "Todos nuestros productos cuentan con garantía oficial (de 12 a 24 meses según el modelo) presentando tu comprobante de pago. Cambios por falla de fábrica dentro de los primeros 7 días.",
  },
  {
    tema: "comprobantes",
    titulo: "Boleta y factura",
    detalle:
      "Emitimos boleta de venta con DNI y factura electrónica con RUC sin costo adicional.",
  },
];

function consultarProcesoCompra({ tema = "" }) {
  const q = normalizar(tema);
  if (!q) return { politicas: PROCESO_COMPRA };

  const coincidencias = PROCESO_COMPRA.filter((item) =>
    normalizar(`${item.tema} ${item.titulo} ${item.detalle}`).includes(q)
  );

  return {
    politicas: coincidencias.length > 0 ? coincidencias : PROCESO_COMPRA,
  };
}

// COLECCIÓN DE FUNCIONES Y DEFINICIÓN DE TOOLS
const funciones = {
  buscarProductos,
  verEspecificaciones,
  consultarProcesoCompra,
};

const tools = [
  {
    type: "function",
    name: "buscarProductos",
    description:
      "Busca productos electrónicos en la tabla productos por nombre, marca, categoría o precio máximo.",
    parameters: {
      type: "object",
      properties: {
        consulta: {
          type: "string",
          description: "Texto a buscar (marca, modelo o palabra clave). Ej: 'DELL', 'mouse', 'laptop'. Usa '' si no aplica.",
        },
        categoria: {
          type: "string",
          description: "Categoría del producto (Informática, Laptops, Monitores, Periféricos, Audio). Usa '' si no aplica.",
        },
        precioMax: {
          type: ["number", "null"],
          description: "Precio máximo en soles (S/) si el cliente indicó un presupuesto, o null si no indicó.",
        },
      },
      required: ["consulta", "categoria", "precioMax"],
      additionalProperties: false,
    },
    strict: true,
  },
  {
    type: "function",
    name: "verEspecificaciones",
    description:
      "Obtiene los datos técnicos detallados de un producto usando su ID y registra automáticamente la consulta en la tabla consultados.",
    parameters: {
      type: "object",
      properties: {
        idproducto: {
          type: "number",
          description: "ID numérico del producto a consultar.",
        },
      },
      required: ["idproducto"],
      additionalProperties: false,
    },
    strict: true,
  },
  {
    type: "function",
    name: "consultarProcesoCompra",
    description:
      "Consulta la información oficial sobre el proceso de compra: métodos de pago (efectivo/visa), envíos, pasos para comprar, garantías y comprobantes.",
    parameters: {
      type: "object",
      properties: {
        tema: {
          type: "string",
          description: "Tema consultado (ej. 'pago', 'envio', 'garantia', 'factura', 'comprar') o '' para traer todo.",
        },
      },
      required: ["tema"],
      additionalProperties: false,
    },
    strict: true,
  },
];

const INSTRUCCIONES = `
Eres el asesor virtual de STOREFINAL, una tienda especializada en artículos electrónicos y tecnología.
Mantén siempre un trato cálido, amable, natural y servicial en español.

REGLAS OBLIGATORIAS:
1. Para buscar productos usa SIEMPRE 'buscarProductos'. Muestra información resumida y clara (marca, modelo, precio en S/, stock/disponibilidad y método de pago). Nunca inventes productos ni precios.
2. Cada vez que encuentres uno o más productos, ofrece amablemente al cliente la opción de ver sus "datos técnicos".
3. Cuando el cliente pida los datos técnicos o especificaciones de un producto, usa SIEMPRE 'verEspecificaciones' con su idproducto y preséntalos de forma ordenada (puedes usar una tabla o lista).
4. Si el cliente pregunta sobre cómo comprar, pagos, envíos, garantías o comprobantes, usa SIEMPRE 'consultarProcesoCompra'.
5. Si el cliente consulta sobre cualquier tema que NO esté relacionado con la tienda, sus artículos electrónicos o sus servicios, indícale amablemente que tu atención es exclusiva sobre la tienda, sus productos y servicios.
`.trim();

// CICLO PRINCIPAL DE CONVERSACIÓN
export async function preguntar(mensaje, previousResponseId = null) {
  //1.Validar lista negra antes de llamar a Azure OpenAI (Req. 5)
  if (contieneTerminoProhibido(mensaje)) {
    return {
      respuesta:
        "Lo siento, ese es un término inadecuado y no puedo continuar con ese mensaje. Si necesitas ayuda con nuestros productos electrónicos o el proceso de compra, con gusto te atiendo.",
      productos: [],
      previousResponseId, //Conserva el hilo sin reiniciarlo
    };
  }

  let inputActual = [{ role: "user", content: mensaje }];
  let ultimaRespuestaId = previousResponseId ?? undefined;
  let productosEncontrados = [];

  for (let vuelta = 0; vuelta < 5; vuelta++) {
    const response = await openai.responses.create({
      model: CONFIG.deploymentName,
      instructions: INSTRUCCIONES,
      input: inputActual,
      tools,
      previous_response_id: ultimaRespuestaId,
      max_output_tokens: 1500,
      reasoning: { effort: "low" },
    });

    ultimaRespuestaId = response.id;

    const llamadas = response.output.filter(
      (item) => item.type === "function_call"
    );

    if (llamadas.length === 0) {
      return {
        respuesta: response.output_text,
        productos: productosEncontrados,
        previousResponseId: ultimaRespuestaId,
      };
    }

    inputActual = await Promise.all(
      llamadas.map(async (llamada) => {
        const args = JSON.parse(llamada.arguments);
        console.log(`[Tool] ${llamada.name}(${JSON.stringify(args)})`);

        let resultado;
        try {
          resultado = await funciones[llamada.name](args);

          // Capturamos los productos para devolverlos al frontend (tarjetas)
          if (llamada.name === "buscarProductos" && Array.isArray(resultado)) {
            productosEncontrados = resultado;
          }
        } catch (e) {
          resultado = { error: e.message };
        }

        return {
          type: "function_call_output",
          call_id: llamada.call_id,
          output: JSON.stringify(resultado),
        };
      })
    );
  }

  return {
    respuesta: "Disculpa, no pude completar tu consulta. ¿Podrías reformularla?",
    productos: [],
    previousResponseId: ultimaRespuestaId ?? previousResponseId,
  };
}
