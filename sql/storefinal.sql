-- =====================================================
-- BASE DE DATOS: STOREFINAL (PostgreSQL)
-- =====================================================

-- Limpieza opcional si necesitas volver a ejecutar el script
DROP TABLE IF EXISTS consultados;
DROP TABLE IF EXISTS especificaciones;
DROP TABLE IF EXISTS productos;

-- 1. Tabla: productos
CREATE TABLE productos (
    id SERIAL PRIMARY KEY,
    categoria VARCHAR(100) NOT NULL,
    marca VARCHAR(100) NOT NULL,
    modelo VARCHAR(150) NOT NULL,
    descripcion TEXT NOT NULL,
    garantia INT NOT NULL DEFAULT 12, -- meses
    stock INT NOT NULL DEFAULT 0 CHECK (stock >= 0),
    fotografia VARCHAR(255),
    metodopago VARCHAR(20) NOT NULL CHECK (LOWER(metodopago) IN ('efectivo', 'visa')),
    precio NUMERIC(10, 2) NOT NULL CHECK (precio >= 0),
    disponible BOOLEAN NOT NULL DEFAULT TRUE
);

-- 2. Tabla: especificaciones
CREATE TABLE especificaciones (
    id SERIAL PRIMARY KEY,
    idproducto INT NOT NULL REFERENCES productos(id) ON DELETE CASCADE,
    especificacion VARCHAR(100) NOT NULL,
    valor VARCHAR(255) NOT NULL
);

-- 3. Tabla: consultados
CREATE TABLE consultados (
    id SERIAL PRIMARY KEY,
    idproducto INT NOT NULL REFERENCES productos(id) ON DELETE CASCADE,
    fechahora TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- Índices para acelerar las consultas del chatbot
CREATE INDEX idx_productos_categoria ON productos (categoria);
CREATE INDEX idx_especificaciones_idproducto ON especificaciones (idproducto);
CREATE INDEX idx_consultados_idproducto ON consultados (idproducto);

-- =====================================================
-- DATOS DE PRUEBA (PRODUCTOS)
-- =====================================================

INSERT INTO productos (categoria, marca, modelo, descripcion, garantia, stock, fotografia, metodopago, precio, disponible) VALUES
('Informática', 'DELL', 'All in One', 'Computadora personal todo en uno de alto rendimiento', 24, 5, '/img/dell-aio.jpg', 'visa', 4500.00, TRUE),
('Informática', 'LOGITECH', 'M90', 'Mouse básico USB óptico ergonómico', 12, 10, '/img/logitech-m90.jpg', 'visa', 65.00, TRUE),
('Laptops', 'LENOVO', 'ThinkPad E14 Gen 5', 'Laptop empresarial ligera para trabajo y estudio', 24, 7, '/img/lenovo-e14.jpg', 'visa', 3290.00, TRUE),
('Monitores', 'LG', 'UltraGear 24GN60R', 'Monitor gamer Full HD con panel IPS de 144Hz', 18, 4, '/img/lg-ultragear.jpg', 'efectivo', 780.00, TRUE),
('Periféricos', 'HYPERX', 'Alloy Origins Core', 'Teclado mecánico compacto TKL con switches rojos', 12, 8, '/img/hyperx-alloy.jpg', 'efectivo', 340.00, TRUE),
('Audio', 'SONY', 'WH-1000XM5', 'Audífonos inalámbricos con cancelación activa de ruido', 12, 3, '/img/sony-xm5.jpg', 'visa', 1350.00, TRUE),
('Laptops', 'ASUS', 'ROG Strix G16', 'Laptop gamer de alto rendimiento (sin stock)', 24, 0, '/img/asus-rog.jpg', 'visa', 6200.00, FALSE);

-- =====================================================
-- DATOS DE PRUEBA (ESPECIFICACIONES)
-- =====================================================

-- 1. DELL All in One (High Ticket)
INSERT INTO especificaciones (idproducto, especificacion, valor) VALUES
(1, 'RAM', '32 Gb'),
(1, 'CPU', 'Intel Core i7 14G'),
(1, 'SSD', '1000 Gb'),
(1, 'Gráfica', '3060 TI'),
(1, 'Pantalla', '24"');

-- 2. LOGITECH M90
INSERT INTO especificaciones (idproducto, especificacion, valor) VALUES
(2, 'Conexión', 'USB con cable (1.8 m)'),
(2, 'Sensor', 'Óptico 1000 DPI'),
(2, 'Botones', '3 botones con rueda');

-- 3. LENOVO ThinkPad E14 Gen 5
INSERT INTO especificaciones (idproducto, especificacion, valor) VALUES
(3, 'RAM', '16 Gb DDR4'),
(3, 'CPU', 'AMD Ryzen 5 7530U'),
(3, 'SSD', '512 Gb NVMe'),
(3, 'Pantalla', '14" Full HD Antirreflejo'),
(3, 'Peso', '1.41 kg');

-- 4. LG UltraGear 24GN60R
INSERT INTO especificaciones (idproducto, especificacion, valor) VALUES
(4, 'Tamaño', '24"'),
(4, 'Resolución', '1920 x 1080 (Full HD)'),
(4, 'Tasa de refresco', '144 Hz'),
(4, 'Tiempo de respuesta', '1 ms'),
(4, 'Puertos', 'HDMI, DisplayPort');

-- 5. HYPERX Alloy Origins Core
INSERT INTO especificaciones (idproducto, especificacion, valor) VALUES
(5, 'Formato', 'TKL (sin teclado numérico)'),
(5, 'Switches', 'HyperX Red'),
(5, 'Iluminación', 'RGB'),
(5, 'Conexión', 'USB-C desmontable');

-- 6. SONY WH-1000XM5
INSERT INTO especificaciones (idproducto, especificacion, valor) VALUES
(6, 'Conectividad', 'Bluetooth 5.2'),
(6, 'Batería', 'Hasta 30 horas con ANC'),
(6, 'Carga rápida', '3 min = 3 horas de uso'),
(6, 'Micrófonos', '8 micrófonos con reducción de ruido');

-- =====================================================
-- CONSULTAS RÁPIDAS DE VERIFICACIÓN
-- =====================================================
-- SELECT * FROM productos;
-- SELECT p.marca, p.modelo, e.especificacion, e.valor FROM especificaciones e JOIN productos p ON p.id = e.idproducto;
-- SELECT c.id, p.marca, p.modelo, c.fechahora FROM consultados c JOIN productos p ON p.id = c.idproducto ORDER BY c.fechahora DESC;
