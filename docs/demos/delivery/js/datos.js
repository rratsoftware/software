/* =========================================================
   RratSoft Delivery (demo) — datos iniciales
   Pollería ficticia en Lima. Precios en soles.
   Para otro negocio, cambia NEGOCIO, ZONAS, MENU y MOTORIZADOS.
   ========================================================= */
window.DELIVERY_DATA = {
  NEGOCIO: {
    nombre: 'Brasa Norte',
    tipo: 'Pollería · Delivery',
    direccion: 'Av. Angamos Este 1520, Surquillo',
    // Minutos objetivo en cocina antes de marcar el pedido como atrasado
    metaCocina: 15
  },

  // costo: precio del delivery · min: minutos de recorrido
  // x, y: posición en el mapa (viewBox 400 x 300)
  ZONAS: [
    { id: 'surquillo',  nombre: 'Surquillo',  costo: 4, min: 12, x: 232, y: 182, calles: ['Av. Tomás Marsano', 'Jr. Dante', 'Calle Gonzales Prada', 'Av. Principal'] },
    { id: 'miraflores', nombre: 'Miraflores', costo: 6, min: 18, x: 112, y: 166, calles: ['Av. José Pardo', 'Calle Berlín', 'Av. Benavides', 'Calle Schell'] },
    { id: 'sanisidro',  nombre: 'San Isidro', costo: 7, min: 20, x: 118, y: 66,  calles: ['Av. Camino Real', 'Calle Las Begonias', 'Av. Conquistadores', 'Calle Los Laureles'] },
    { id: 'sanborja',   nombre: 'San Borja',  costo: 6, min: 16, x: 298, y: 72,  calles: ['Av. San Luis', 'Av. Aviación', 'Calle Las Artes', 'Av. San Borja Norte'] },
    { id: 'surco',      nombre: 'Surco',      costo: 8, min: 22, x: 312, y: 226, calles: ['Av. Primavera', 'Av. Caminos del Inca', 'Calle Monte Rosa', 'Av. El Polo'] },
    { id: 'barranco',   nombre: 'Barranco',   costo: 7, min: 20, x: 132, y: 256, calles: ['Av. Grau', 'Jr. Unión', 'Calle Domeyer', 'Av. Pedro de Osma'] }
  ],

  MENU: [
    { id: 'm01', nombre: '1/4 de pollo a la brasa', detalle: 'Papas fritas y ensalada', precio: 22, cat: 'Pollos' },
    { id: 'm02', nombre: '1/2 pollo a la brasa',    detalle: 'Papas fritas y ensalada', precio: 38, cat: 'Pollos' },
    { id: 'm03', nombre: 'Pollo entero familiar',   detalle: 'Papas, ensalada y gaseosa 1.5 L', precio: 72, cat: 'Pollos' },
    { id: 'm04', nombre: 'Mostrito',                detalle: '1/4 de pollo con chaufa', precio: 26, cat: 'Pollos' },
    { id: 'm05', nombre: 'Chaufa de pollo',         detalle: 'Porción personal', precio: 22, cat: 'Platos' },
    { id: 'm06', nombre: 'Anticuchos de corazón',   detalle: '3 palitos con papa y choclo', precio: 26, cat: 'Platos' },
    { id: 'm07', nombre: 'Papas fritas extra',      detalle: 'Porción grande', precio: 9, cat: 'Extras' },
    { id: 'm08', nombre: 'Ensalada fresca',         detalle: 'Lechuga, tomate y pepino', precio: 8, cat: 'Extras' },
    { id: 'm09', nombre: 'Inca Kola 1.5 L',         detalle: 'Bebida', precio: 10, cat: 'Bebidas' },
    { id: 'm10', nombre: 'Chicha morada 1 L',       detalle: 'Hecha en casa', precio: 12, cat: 'Bebidas' }
  ],

  MOTORIZADOS: [
    { id: 'r1', nombre: 'Kevin Huamán',  placa: '4521-LM' },
    { id: 'r2', nombre: 'Luis Ccori',    placa: '7810-KA' },
    { id: 'r3', nombre: 'Jhon Quispe',   placa: '3367-PB' },
    { id: 'r4', nombre: 'Diego Salas',   placa: '9054-LR' }
  ],

  // Clientes de ejemplo (datos ficticios)
  CLIENTES: [
    'Lucía Fernández', 'Carlos Ramírez', 'María Torres', 'José Gutiérrez', 'Andrea Paredes',
    'Miguel Chávez', 'Rosa Mendoza', 'Jorge Castillo', 'Valeria Rojas', 'Renato Vargas',
    'Camila Flores', 'Diego Herrera', 'Fiorella Salazar', 'Óscar Medina', 'Gabriela Ríos',
    'Luis Alberto Soto', 'Daniela Cárdenas', 'Pedro Aguilar', 'Milagros Ponce', 'Sebastián León'
  ],

  REFERENCIAS: [
    'Frente al parque', 'Casa de rejas verdes', 'Edificio, dpto. 302', 'Al costado de la farmacia',
    'Portón negro, tocar timbre', 'Condominio, torre B', 'Esquina con la bodega', 'Dejar en recepción'
  ],

  CANALES: ['WhatsApp', 'Web', 'Teléfono']
};
