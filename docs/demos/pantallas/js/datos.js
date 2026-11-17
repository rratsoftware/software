/* Contenido inicial de la demo (negocio ficticio). */
window.PANT_DATA = {
  NEGOCIO: { nombre: 'Paso Lento', sub: 'Café y sánguches', dir: 'Jr. Bolognesi 312, Barranco' },

  IMAGENES: [
    { id: 'sanguche', nombre: 'Sánguche', src: 'images/sanguche.svg' },
    { id: 'cafe', nombre: 'Café', src: 'images/cafe.svg' },
    { id: 'limonada', nombre: 'Limonada', src: 'images/limonada.svg' },
    { id: 'torta', nombre: 'Torta', src: 'images/torta.svg' }
  ],

  TEMAS: [
    { id: 'tierra', nombre: 'Tierra', bg: '#2b1d14', fg: '#f6ead8', acc: '#f0a830' },
    { id: 'oliva', nombre: 'Oliva', bg: '#26301f', fg: '#eef0de', acc: '#c9d86b' },
    { id: 'tomate', nombre: 'Tomate', bg: '#b83a26', fg: '#fff4e6', acc: '#ffd25e' },
    { id: 'crema', nombre: 'Crema', bg: '#f3e6cf', fg: '#2b1d14', acc: '#b83a26' }
  ],

  ESTADO_INICIAL: {
    v: 1,
    categorias: [
      { id: 'des', nombre: 'Desayunos', items: [
        { id: 'd1', nombre: 'Pan con chicharrón', desc: 'Con camote frito y sarza criolla', precio: 14, agotado: false },
        { id: 'd2', nombre: 'Tamal con sarza', desc: 'Tamal de cerdo de la casa', precio: 10, agotado: false },
        { id: 'd3', nombre: 'Pan con palta', desc: 'Pan de la mañana y palta fuerte', precio: 9, agotado: false },
        { id: 'd4', nombre: 'Tostadas con huevo', desc: 'Dos huevos al gusto', precio: 11, agotado: false },
        { id: 'd5', nombre: 'Jugo surtido', desc: 'Papaya, plátano y piña', precio: 9, agotado: false }
      ] },
      { id: 'san', nombre: 'Sánguches', items: [
        { id: 's1', nombre: 'Butifarra', desc: 'Jamón del país y sarza', precio: 15, agotado: false },
        { id: 's2', nombre: 'Pollo deshilachado', desc: 'Con palta y lechuga', precio: 13, agotado: false },
        { id: 's3', nombre: 'Lomo saltado', desc: 'En pan ciabatta', precio: 19, agotado: false },
        { id: 's4', nombre: 'Triple clásico', desc: 'Palta, tomate y huevo', precio: 9, agotado: false },
        { id: 's5', nombre: 'Hamburguesa de la casa', desc: 'Con papas nativas', precio: 18, agotado: false }
      ] },
      { id: 'beb', nombre: 'Bebidas', items: [
        { id: 'b1', nombre: 'Café pasado', desc: 'Grano de Villa Rica', precio: 6, agotado: false },
        { id: 'b2', nombre: 'Cappuccino', desc: '', precio: 9, agotado: false },
        { id: 'b3', nombre: 'Limonada frozen', desc: '', precio: 10, agotado: false },
        { id: 'b4', nombre: 'Chicha morada', desc: 'Vaso / jarra S/ 18', precio: 6, agotado: false },
        { id: 'b5', nombre: 'Emoliente', desc: 'Con linaza y alfalfa', precio: 4, agotado: false }
      ] },
      { id: 'pos', nombre: 'Postres', items: [
        { id: 'p1', nombre: 'Torta de chocolate', desc: 'Con fudge casero', precio: 10, agotado: false },
        { id: 'p2', nombre: 'Pie de limón', desc: '', precio: 9, agotado: false },
        { id: 'p3', nombre: 'Arroz con leche', desc: '', precio: 7, agotado: false },
        { id: 'p4', nombre: 'Alfajor de maicena', desc: '', precio: 4, agotado: false }
      ] }
    ],

    bloques: [
      { id: 'man', nombre: 'Desayunos', desde: '06:00', hasta: '11:30', cats: ['des', 'beb'] },
      { id: 'alm', nombre: 'Almuerzo', desde: '11:30', hasta: '16:00', cats: ['san', 'beb'] },
      { id: 'tar', nombre: 'Lonche', desde: '16:00', hasta: '22:30', cats: ['san', 'pos', 'beb'] }
    ],

    promos: [
      { id: 'pr1', titulo: 'Combo desayuno', texto: 'Pan con chicharrón + café pasado', precio: 17, antes: 20, img: 'sanguche', tema: 'tierra', dias: [1, 2, 3, 4, 5, 6, 0], desde: '06:00', hasta: '11:30', seg: 8, activa: true },
      { id: 'pr2', titulo: '2×1 en limonada frozen', texto: 'Todos los viernes, todo el día', precio: 10, antes: 0, img: 'limonada', tema: 'oliva', dias: [5], desde: '00:00', hasta: '23:59', seg: 8, activa: true },
      { id: 'pr3', titulo: 'Torta + café', texto: 'De 4 a 7 p. m. · ideal para el lonche', precio: 15, antes: 19, img: 'torta', tema: 'tomate', dias: [1, 2, 3, 4, 5, 6, 0], desde: '16:00', hasta: '19:00', seg: 8, activa: true },
      { id: 'pr4', titulo: 'Sánguche del día', texto: 'Lomo saltado en ciabatta', precio: 16, antes: 19, img: 'sanguche', tema: 'crema', dias: [1, 2, 3, 4, 5], desde: '11:30', hasta: '16:00', seg: 8, activa: true },
      { id: 'pr5', titulo: 'Café de Villa Rica', texto: 'Pasado al momento, como en casa', precio: 6, antes: 0, img: 'cafe', tema: 'tierra', dias: [1, 2, 3, 4, 5, 6, 0], desde: '00:00', hasta: '23:59', seg: 8, activa: true }
    ],

    pantallas: [
      { id: 'caja', nombre: 'TV Caja', lugar: 'Sobre la barra', modo: 'menu' },
      { id: 'salon', nombre: 'TV Salón', lugar: 'Pared del salón', modo: 'promos' }
    ],

    mensaje: 'Aceptamos Yape, Plin y tarjetas  ·  WiFi: PasoLento-Clientes  ·  Pide por delivery en Barranco y Miraflores',
    simHora: ''
  }
};
