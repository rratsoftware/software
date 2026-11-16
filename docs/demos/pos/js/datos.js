/* =========================================================
   RratSoft POS (demo) — datos iniciales
   Minimarket ficticio en Lima. Precios en soles, IGV incluido.
   Para otro negocio, cambia NEGOCIO y PRODUCTOS.
   ========================================================= */
window.POS_DATA = {
  NEGOCIO: {
    nombre: 'Minimarket Santa Rosa',
    razonSocial: 'SANTA ROSA COMERCIAL S.A.C.',
    ruc: '20000000001',                 // ficticio
    direccion: 'Av. Arequipa 1234, Lince — Lima',
    cajero: 'Rosa Quispe',
    igv: 0.18,
    icbper: 0.50                        // impuesto a la bolsa plástica (por unidad)
  },

  CATEGORIAS: ['Bebidas', 'Abarrotes', 'Lácteos', 'Panadería', 'Snacks', 'Limpieza', 'Otros'],

  // min: stock mínimo antes de avisar "stock bajo"
  PRODUCTOS: [
    { id: 'p01', codigo: '7750182000017', nombre: 'Inca Kola 500 ml', cat: 'Bebidas', precio: 3.00, stock: 48, min: 12 },
    { id: 'p02', codigo: '7750182000024', nombre: 'Coca-Cola 500 ml', cat: 'Bebidas', precio: 3.00, stock: 40, min: 12 },
    { id: 'p03', codigo: '7750182000031', nombre: 'Inca Kola 1.5 L', cat: 'Bebidas', precio: 7.50, stock: 18, min: 6 },
    { id: 'p04', codigo: '7750182000048', nombre: 'Agua San Luis 625 ml', cat: 'Bebidas', precio: 1.80, stock: 60, min: 15 },
    { id: 'p05', codigo: '7750182000055', nombre: 'Cerveza Pilsen 630 ml', cat: 'Bebidas', precio: 7.50, stock: 24, min: 12 },
    { id: 'p06', codigo: '7750182000062', nombre: 'Cusqueña Dorada 620 ml', cat: 'Bebidas', precio: 8.00, stock: 5, min: 12 },
    { id: 'p07', codigo: '7750182000079', nombre: 'Frugos Durazno 1 L', cat: 'Bebidas', precio: 4.50, stock: 15, min: 6 },

    { id: 'p08', codigo: '7750243000011', nombre: 'Arroz Costeño 1 kg', cat: 'Abarrotes', precio: 4.90, stock: 35, min: 10 },
    { id: 'p09', codigo: '7750243000028', nombre: 'Azúcar rubia 1 kg', cat: 'Abarrotes', precio: 4.20, stock: 28, min: 10 },
    { id: 'p10', codigo: '7750243000035', nombre: 'Aceite Primor 900 ml', cat: 'Abarrotes', precio: 10.90, stock: 14, min: 6 },
    { id: 'p11', codigo: '7750243000042', nombre: 'Fideos Don Vittorio 500 g', cat: 'Abarrotes', precio: 3.60, stock: 30, min: 10 },
    { id: 'p12', codigo: '7750243000059', nombre: 'Atún Florida 140 g', cat: 'Abarrotes', precio: 6.50, stock: 4, min: 8 },
    { id: 'p13', codigo: '7750243000066', nombre: 'Sal de Maras 500 g', cat: 'Abarrotes', precio: 2.50, stock: 20, min: 5 },

    { id: 'p14', codigo: '7751271000013', nombre: 'Leche Gloria tarro 395 g', cat: 'Lácteos', precio: 4.40, stock: 52, min: 18 },
    { id: 'p15', codigo: '7751271000020', nombre: 'Yogurt Gloria fresa 1 L', cat: 'Lácteos', precio: 7.90, stock: 12, min: 6 },
    { id: 'p16', codigo: '7751271000037', nombre: 'Mantequilla Laive 200 g', cat: 'Lácteos', precio: 9.90, stock: 8, min: 4 },
    { id: 'p17', codigo: '7751271000044', nombre: 'Queso fresco 250 g', cat: 'Lácteos', precio: 8.50, stock: 3, min: 5 },
    { id: 'p18', codigo: '7751271000051', nombre: 'Huevos rosados (unidad)', cat: 'Lácteos', precio: 0.60, stock: 180, min: 60 },

    { id: 'p19', codigo: '2000000000015', nombre: 'Pan francés (unidad)', cat: 'Panadería', precio: 0.30, stock: 220, min: 50 },
    { id: 'p20', codigo: '2000000000022', nombre: 'Pan de yema (unidad)', cat: 'Panadería', precio: 0.40, stock: 120, min: 40 },
    { id: 'p21', codigo: '2000000000039', nombre: 'Keke marmoleado (tajada)', cat: 'Panadería', precio: 2.50, stock: 16, min: 6 },

    { id: 'p22', codigo: '7750885000016', nombre: 'Galletas Casino menta', cat: 'Snacks', precio: 1.00, stock: 64, min: 20 },
    { id: 'p23', codigo: '7750885000023', nombre: 'Chocolate Sublime', cat: 'Snacks', precio: 1.50, stock: 45, min: 20 },
    { id: 'p24', codigo: '7750885000030', nombre: 'Papas Lay\'s clásicas 42 g', cat: 'Snacks', precio: 2.20, stock: 26, min: 10 },
    { id: 'p25', codigo: '7750885000047', nombre: 'Cua Cua', cat: 'Snacks', precio: 1.00, stock: 38, min: 15 },

    { id: 'p26', codigo: '7751851000018', nombre: 'Detergente Bolívar 750 g', cat: 'Limpieza', precio: 9.50, stock: 11, min: 5 },
    { id: 'p27', codigo: '7751851000025', nombre: 'Papel higiénico Elite x4', cat: 'Limpieza', precio: 6.90, stock: 19, min: 6 },
    { id: 'p28', codigo: '7751851000032', nombre: 'Lejía Clorox 1 L', cat: 'Limpieza', precio: 4.50, stock: 9, min: 4 },

    { id: 'p29', codigo: '0000000000291', nombre: 'Bolsa plástica (ICBPER)', cat: 'Otros', precio: 0.50, stock: 500, min: 100, bolsa: true },
    { id: 'p30', codigo: '0000000000307', nombre: 'Recarga Movistar S/ 10', cat: 'Otros', precio: 10.00, stock: 999, min: 0 }
  ]
};

// Imagen de cada producto: images/productos/<id>.svg
// (ilustraciones de demo; con un cliente real se usan fotos de sus productos)
window.POS_DATA.PRODUCTOS.forEach(function (p) { p.img = 'images/productos/' + p.id + '.svg'; });
