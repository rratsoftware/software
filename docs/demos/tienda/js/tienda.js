/* =========================================================
   Horno Luna (demo) — catálogo, carrito y pedido por WhatsApp
   ========================================================= */
(function () {
  'use strict';

  var T = window.TIENDA;
  var STORE_KEY = 'horno-luna-carrito';

  var $ = function (id) { return document.getElementById(id); };
  var els = {
    categories: $('categories'), search: $('search'), products: $('products'), empty: $('empty'),
    count: $('cart-count'), cart: $('cart'), overlay: $('overlay'),
    open: $('cart-open'), close: $('cart-close'), browse: $('cart-browse'),
    items: $('cart-items'), cartEmpty: $('cart-empty'), checkout: $('checkout'), foot: $('cart-foot'),
    address: $('field-address'),
    sub: $('t-sub'), ship: $('t-ship'), hint: $('t-hint'), total: $('t-total'),
    preview: $('preview'), previewText: $('preview-text'), previewSend: $('preview-send'), previewBack: $('preview-back'),
    toast: $('toast')
  };

  var byId = {};
  T.productos.forEach(function (p) { byId[p.id] = p; });

  /* ---------- Estado ---------- */
  var state = { cat: 'Todo', q: '', cart: loadCart() };

  function loadCart() {
    try {
      var saved = JSON.parse(localStorage.getItem(STORE_KEY)) || {};
      // Solo productos que siguen existiendo
      Object.keys(saved).forEach(function (id) { if (!byId[id] || saved[id] < 1) delete saved[id]; });
      return saved;
    } catch (e) { return {}; }
  }
  function saveCart() {
    try { localStorage.setItem(STORE_KEY, JSON.stringify(state.cart)); } catch (e) { /* ignorar */ }
  }

  function money(n) { return T.moneda + n.toFixed(2); }
  function esc(s) {
    return String(s).replace(/[&<>"']/g, function (c) {
      return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c];
    });
  }
  function norm(s) { return s.toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, ''); }

  /* ---------- Categorías ---------- */
  function renderCategories() {
    els.categories.innerHTML = ['Todo'].concat(T.categorias).map(function (c) {
      var on = c === state.cat;
      return '<button type="button" role="tab" class="chip' + (on ? ' is-on' : '') + '" aria-selected="' + on + '" data-cat="' + esc(c) + '">' + esc(c) + '</button>';
    }).join('');
  }
  els.categories.addEventListener('click', function (e) {
    var b = e.target.closest('[data-cat]');
    if (!b) return;
    state.cat = b.dataset.cat;
    renderCategories();
    renderProducts();
  });
  els.search.addEventListener('input', function () {
    state.q = norm(els.search.value.trim());
    renderProducts();
  });

  /* ---------- Productos ---------- */
  function renderProducts() {
    var list = T.productos.filter(function (p) {
      var inCat = state.cat === 'Todo' || p.cat === state.cat;
      var inQ = !state.q || norm(p.nombre + ' ' + p.desc).indexOf(state.q) !== -1;
      return inCat && inQ;
    });
    els.empty.hidden = list.length > 0;
    els.products.innerHTML = list.map(function (p) {
      var qty = state.cart[p.id] || 0;
      return '' +
        '<article class="card">' +
          '<div class="card__img" style="--tono:' + p.tono + '">' +
            '<i class="ti ti-' + p.icono + '" aria-hidden="true"></i>' +
            (p.tag ? '<span class="card__tag">' + esc(p.tag) + '</span>' : '') +
          '</div>' +
          '<div class="card__body">' +
            '<p class="card__cat">' + esc(p.cat) + '</p>' +
            '<h3>' + esc(p.nombre) + '</h3>' +
            '<p class="card__desc">' + esc(p.desc) + '</p>' +
            '<div class="card__foot">' +
              '<span class="price">' + money(p.precio) + '</span>' +
              (qty
                ? '<div class="stepper" aria-label="Cantidad de ' + esc(p.nombre) + '">' +
                    '<button type="button" data-dec="' + p.id + '" aria-label="Quitar uno"><i class="ti ti-minus"></i></button>' +
                    '<span>' + qty + '</span>' +
                    '<button type="button" data-inc="' + p.id + '" aria-label="Agregar uno"><i class="ti ti-plus"></i></button>' +
                  '</div>'
                : '<button class="btn btn--add" type="button" data-add="' + p.id + '"><i class="ti ti-plus" aria-hidden="true"></i> Agregar</button>') +
            '</div>' +
          '</div>' +
        '</article>';
    }).join('');
  }

  /* ---------- Carrito ---------- */
  function setQty(id, qty) {
    if (qty <= 0) delete state.cart[id];
    else state.cart[id] = Math.min(qty, 99);
    saveCart();
    renderProducts();
    renderCart();
  }

  function cartLines() {
    return Object.keys(state.cart).map(function (id) {
      return { p: byId[id], qty: state.cart[id] };
    });
  }

  function isDelivery() {
    return els.checkout.elements.entrega.value === 'delivery';
  }

  function totals() {
    var sub = cartLines().reduce(function (s, l) { return s + l.p.precio * l.qty; }, 0);
    var ship = isDelivery() && sub < T.deliveryGratisDesde ? T.delivery : 0;
    return { sub: sub, ship: ship, total: sub + ship };
  }

  function renderCart() {
    var lines = cartLines();
    var count = lines.reduce(function (s, l) { return s + l.qty; }, 0);

    els.count.textContent = count;
    els.count.classList.toggle('is-on', count > 0);

    els.cartEmpty.hidden = lines.length > 0;
    els.checkout.hidden = lines.length === 0;
    els.foot.hidden = lines.length === 0;

    els.items.innerHTML = lines.map(function (l) {
      return '' +
        '<li class="line">' +
          '<span class="line__img" style="--tono:' + l.p.tono + '"><i class="ti ti-' + l.p.icono + '" aria-hidden="true"></i></span>' +
          '<div class="line__info">' +
            '<p class="line__name">' + esc(l.p.nombre) + '</p>' +
            '<p class="line__price">' + money(l.p.precio) + ' c/u</p>' +
            '<div class="stepper stepper--sm">' +
              '<button type="button" data-dec="' + l.p.id + '" aria-label="Quitar uno"><i class="ti ti-minus"></i></button>' +
              '<span>' + l.qty + '</span>' +
              '<button type="button" data-inc="' + l.p.id + '" aria-label="Agregar uno"><i class="ti ti-plus"></i></button>' +
            '</div>' +
          '</div>' +
          '<div class="line__side">' +
            '<p class="line__total">' + money(l.p.precio * l.qty) + '</p>' +
            '<button class="icon icon--sm" type="button" data-del="' + l.p.id + '" aria-label="Eliminar ' + esc(l.p.nombre) + '"><i class="ti ti-trash"></i></button>' +
          '</div>' +
        '</li>';
    }).join('');

    var t = totals();
    els.sub.textContent = money(t.sub);
    els.ship.textContent = !isDelivery() ? 'Recojo' : t.ship ? money(t.ship) : 'Gratis';
    els.total.textContent = money(t.total);

    var falta = T.deliveryGratisDesde - t.sub;
    els.hint.textContent = isDelivery() && falta > 0 ? 'Te faltan ' + money(falta) + ' para delivery gratis' : '';
    els.hint.hidden = !els.hint.textContent;

    els.address.hidden = !isDelivery();
    els.checkout.elements.direccion.required = isDelivery();
  }

  // Botones de cantidad (en catálogo y carrito)
  document.addEventListener('click', function (e) {
    var b = e.target.closest('[data-add],[data-inc],[data-dec],[data-del]');
    if (!b) return;
    var d = b.dataset;
    if (d.add) {
      setQty(d.add, 1);
      toast(byId[d.add].nombre + ' agregado al carrito');
      bump();
    } else if (d.inc) setQty(d.inc, (state.cart[d.inc] || 0) + 1);
    else if (d.dec) setQty(d.dec, (state.cart[d.dec] || 0) - 1);
    else if (d.del) setQty(d.del, 0);
  });

  els.checkout.addEventListener('change', function (e) {
    if (e.target.name === 'entrega') renderCart();
  });

  /* ---------- Abrir / cerrar carrito ---------- */
  var lastFocus = null;
  function setCart(open) {
    els.cart.classList.toggle('is-open', open);
    els.cart.setAttribute('aria-hidden', String(!open));
    els.cart.inert = !open;
    els.overlay.hidden = !open;
    document.body.classList.toggle('no-scroll', open);
    if (open) {
      lastFocus = document.activeElement;
      els.close.focus();
    } else if (lastFocus) {
      lastFocus.focus();
    }
  }
  els.cart.inert = true;
  els.open.addEventListener('click', function () { setCart(true); });
  els.close.addEventListener('click', function () { setCart(false); });
  els.overlay.addEventListener('click', function () { setCart(false); });
  els.browse.addEventListener('click', function () { setCart(false); });
  document.addEventListener('keydown', function (e) {
    if (e.key === 'Escape' && els.cart.classList.contains('is-open') && !els.preview.open) setCart(false);
  });

  /* ---------- Pedido por WhatsApp ---------- */
  function buildMessage(data) {
    var t = totals();
    var out = ['*Nuevo pedido · ' + T.nombre + '*', ''];
    cartLines().forEach(function (l) {
      out.push(l.qty + ' x ' + l.p.nombre + ' — ' + money(l.p.precio * l.qty));
    });
    out.push('', 'Subtotal: ' + money(t.sub));
    if (data.entrega === 'delivery') out.push('Delivery: ' + (t.ship ? money(t.ship) : 'Gratis'));
    out.push('*Total: ' + money(t.total) + '*', '');
    out.push('Cliente: ' + data.nombre);
    out.push(data.entrega === 'delivery' ? 'Entrega: Delivery a ' + data.direccion : 'Entrega: Recojo en tienda');
    out.push('Pago: ' + data.pago);
    if (data.nota) out.push('Nota: ' + data.nota);
    return out.join('\n');
  }

  els.checkout.addEventListener('submit', function (e) {
    e.preventDefault();
    var f = els.checkout;
    var fields = [f.elements.nombre].concat(isDelivery() ? [f.elements.direccion] : []);
    var bad = fields.filter(function (i) { return !i.value.trim(); });
    [f.elements.nombre, f.elements.direccion].forEach(function (i) {
      i.setAttribute('aria-invalid', String(bad.indexOf(i) !== -1));
    });
    if (bad.length) {
      bad[0].focus();
      toast('Completa tu ' + (bad[0].name === 'nombre' ? 'nombre' : 'dirección'));
      return;
    }

    var msg = buildMessage({
      entrega: f.elements.entrega.value,
      nombre: f.elements.nombre.value.trim(),
      direccion: f.elements.direccion.value.trim(),
      pago: f.elements.pago.value,
      nota: f.elements.nota.value.trim()
    });
    els.previewText.textContent = msg;
    els.previewSend.href = 'https://wa.me/' + (T.whatsapp || '') + '?text=' + encodeURIComponent(msg);
    els.preview.showModal();
  });

  els.previewBack.addEventListener('click', function () { els.preview.close(); });
  els.preview.addEventListener('click', function (e) {
    if (e.target === els.preview) els.preview.close();
  });

  /* ---------- Detalles ---------- */
  var toastTimer = null;
  function toast(text) {
    els.toast.textContent = text;
    els.toast.classList.add('is-on');
    clearTimeout(toastTimer);
    toastTimer = setTimeout(function () { els.toast.classList.remove('is-on'); }, 2000);
  }
  function bump() {
    els.open.classList.remove('is-bump');
    void els.open.offsetWidth;
    els.open.classList.add('is-bump');
  }

  /* ---------- Inicio ---------- */
  renderCategories();
  renderProducts();
  renderCart();
})();
