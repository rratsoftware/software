/* =========================================================
   Horno Luna (demo) — catálogo de productos
   Panadería ficticia en Lima. Precios en soles.
   Para otra tienda, solo cambia esta lista.
   tono: color de fondo de la imagen del producto
   ========================================================= */
window.TIENDA = {
  nombre: 'Horno Luna',
  moneda: 'S/ ',
  // Número del negocio con código de país, solo dígitos (ej. '51987654321').
  // Vacío en la demo: WhatsApp deja elegir el chat.
  whatsapp: '',
  delivery: 6,
  deliveryGratisDesde: 60,

  categorias: ['Panadería', 'Pastelería', 'Bebidas', 'Salados'],

  productos: [
    { id: 'frances', nombre: 'Pan francés (x10)', desc: 'Crocante por fuera, suavecito por dentro. Recién salido del horno.', precio: 3.0, cat: 'Panadería', icono: 'bread', tono: '#f3dcc0', tag: 'Más vendido' },
    { id: 'chabata', nombre: 'Pan chabata (x6)', desc: 'Masa de fermentación lenta, ideal para sánguches.', precio: 4.8, cat: 'Panadería', icono: 'baguette', tono: '#efe2c4' },
    { id: 'masa-madre', nombre: 'Pan de masa madre', desc: 'Hogaza de 800 g, fermentada 24 horas.', precio: 16, cat: 'Panadería', icono: 'bread', tono: '#ead2b4' },
    { id: 'alfajores', nombre: 'Alfajores de manjar (x6)', desc: 'Masa que se deshace, rellenos de manjarblanco y azúcar en polvo.', precio: 12, cat: 'Pastelería', icono: 'cookie', tono: '#f1e0c8', tag: 'Favorito' },
    { id: 'torta-chocolate', nombre: 'Torta de chocolate', desc: 'Húmeda, con fudge casero. 12 porciones.', precio: 65, cat: 'Pastelería', icono: 'cake', tono: '#ecd3d0', tag: 'Para compartir' },
    { id: 'pye-limon', nombre: 'Pye de limón', desc: 'Base crocante, crema de limón y merengue tostado. Entero.', precio: 48, cat: 'Pastelería', icono: 'cake', tono: '#f2ebc0' },
    { id: 'keke', nombre: 'Keke marmoleado', desc: 'Vainilla y chocolate, para el lonche. 600 g.', precio: 18, cat: 'Pastelería', icono: 'cake', tono: '#efdcc6' },
    { id: 'cafe', nombre: 'Café pasado de Chanchamayo', desc: 'Grano de altura, tostado medio. 12 oz.', precio: 7, cat: 'Bebidas', icono: 'coffee', tono: '#e6d6c6' },
    { id: 'chicha', nombre: 'Chicha morada 1 L', desc: 'Hecha en casa con maíz morado, piña y canela.', precio: 9, cat: 'Bebidas', icono: 'bottle', tono: '#e2d0e6' },
    { id: 'chocolate', nombre: 'Chocolate caliente', desc: 'Cacao peruano al 70 % con leche entera.', precio: 8, cat: 'Bebidas', icono: 'cup', tono: '#e3d1c4' },
    { id: 'chicharron', nombre: 'Pan con chicharrón', desc: 'Con camote frito y salsa criolla. El clásico del domingo.', precio: 14, cat: 'Salados', icono: 'cheese', tono: '#f5e6b0', tag: 'Domingo' },
    { id: 'empanada', nombre: 'Empanada de carne', desc: 'Horneada, con aceituna y huevo. Para calentar.', precio: 6.5, cat: 'Salados', icono: 'pizza', tono: '#f1d2c2' },
    { id: 'tamal', nombre: 'Tamal criollo', desc: 'De cerdo, con su sarsa de cebolla.', precio: 8, cat: 'Salados', icono: 'salad', tono: '#d9e6c9' },
    { id: 'triple', nombre: 'Sánguche triple', desc: 'Palta, tomate y huevo en pan de molde. Dos unidades.', precio: 9.5, cat: 'Salados', icono: 'egg-fried', tono: '#f6e7c1' }
  ]
};
