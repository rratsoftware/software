/* Vistas de cada módulo del ERP demo. */
(function () {
  'use strict';

  const E = window.ERP;
  const D = E.D;
  const { money, num, fdate, ftime, esc, pill, DAY } = E;
  const $ = (s, el) => (el || document).querySelector(s);
  const $$ = (s, el) => Array.from((el || document).querySelectorAll(s));
  const view = () => document.getElementById('view');
  const go = (h) => { location.hash = h; };
  const S = () => E.S;

  /* Estado de la interfaz (filtros, búsqueda, página) por módulo */
  const UI = {
    ventas: { f: 'todos', q: '', page: 0 },
    compras: { f: 'todos', q: '', page: 0 },
    inventario: { f: 'todos', q: '', page: 0, cat: '' },
    contactos: { f: 'clientes', q: '', page: 0 },
    caja: { f: 'todas', q: '', page: 0 },
    cobranzas: { f: 'todos', q: '', page: 0 },
    kardex: { alm: '', page: 0 },
    reportes: { per: 'mes', tab: 'producto' }
  };
  const PAGE = 25;

  function crumbs(list) {
    document.getElementById('crumbs').innerHTML = list.map((c, i) =>
      '<li>' + (c[1] && i < list.length - 1 ? '<a href="' + c[1] + '">' + esc(c[0]) + '</a>' : '<span>' + esc(c[0]) + '</span>') + '</li>'
    ).join('');
  }

  /* ---------- Lista genérica con filtros, búsqueda y paginador ---------- */
  function lista(cfg) {
    const ui = UI[cfg.mod];
    const filtros = cfg.filtros ? cfg.filtros() : [];
    view().innerHTML =
      '<div class="cp">' +
        '<div class="cp__row">' +
          '<div class="cp__title"><h1>' + esc(cfg.titulo) + '</h1>' + (cfg.sub ? '<p>' + cfg.sub + '</p>' : '') + '</div>' +
          '<div class="cp__actions">' + (cfg.acciones || '') + '</div>' +
        '</div>' +
        (cfg.arriba || '') +
        '<div class="cp__row cp__row--tools">' +
          (filtros.length ? '<div class="seg" role="tablist">' + filtros.map((f) =>
            '<button type="button" class="seg__btn' + (ui.f === f.id ? ' is-on' : '') + '" data-f="' + f.id + '">' + esc(f.label) +
            (f.n != null ? ' <b>' + f.n + '</b>' : '') + '</button>').join('') + '</div>' : '') +
          (cfg.herramientas || '') +
          '<label class="search"><i class="ti ti-search" aria-hidden="true"></i><input type="search" placeholder="' + esc(cfg.buscar || 'Buscar…') + '" value="' + esc(ui.q) + '" aria-label="Buscar"></label>' +
        '</div>' +
      '</div>' +
      '<div class="sheet sheet--list" id="lst"></div>';

    const lst = $('#lst');
    function refresh() {
      const q = ui.q.trim().toLowerCase();
      let rows = cfg.data().filter((r) => (!cfg.filtrar || cfg.filtrar(r, ui.f)) && (!q || cfg.texto(r).toLowerCase().includes(q)));
      const total = rows.length;
      const pages = Math.max(1, Math.ceil(total / PAGE));
      if (ui.page >= pages) ui.page = pages - 1;
      const from = ui.page * PAGE;
      const vis = rows.slice(from, from + PAGE);
      lst.innerHTML =
        '<div class="table-wrap"><table class="table' + (cfg.href ? ' table--link' : '') + '">' +
          '<thead><tr>' + cfg.cols.map((c) => '<th class="' + (c.cls || '') + '">' + c.h + '</th>').join('') + '</tr></thead>' +
          '<tbody>' + (vis.length ? vis.map((r) =>
            '<tr' + (cfg.href ? ' data-href="' + cfg.href(r) + '" tabindex="0"' : '') + '>' +
            cfg.cols.map((c) => '<td class="' + (c.cls || '') + '">' + c.v(r) + '</td>').join('') + '</tr>').join('')
            : '<tr class="table__empty"><td colspan="' + cfg.cols.length + '">No hay registros con ese filtro.</td></tr>') +
          '</tbody>' +
          (cfg.pie && rows.length ? '<tfoot>' + cfg.pie(rows) + '</tfoot>' : '') +
        '</table></div>' +
        '<div class="pager"><span>' + (total ? (from + 1) + '–' + Math.min(from + PAGE, total) + ' de ' + total : '0 registros') + '</span>' +
          '<button type="button" class="icon-btn" data-pg="-1" aria-label="Anterior"' + (ui.page <= 0 ? ' disabled' : '') + '><i class="ti ti-chevron-left"></i></button>' +
          '<button type="button" class="icon-btn" data-pg="1" aria-label="Siguiente"' + (ui.page >= pages - 1 ? ' disabled' : '') + '><i class="ti ti-chevron-right"></i></button>' +
        '</div>';
    }
    refresh();

    view().querySelectorAll('.seg__btn[data-f]').forEach((b) => b.addEventListener('click', () => {
      ui.f = b.dataset.f; ui.page = 0;
      $$('.seg__btn[data-f]').forEach((x) => x.classList.toggle('is-on', x === b));
      refresh();
    }));
    $('.search input', view()).addEventListener('input', (e) => { ui.q = e.target.value; ui.page = 0; refresh(); });
    lst.addEventListener('click', (e) => {
      const pg = e.target.closest('[data-pg]');
      if (pg) { ui.page += Number(pg.dataset.pg); refresh(); return; }
      const tr = e.target.closest('tr[data-href]');
      if (tr && !e.target.closest('a,button')) go(tr.dataset.href);
    });
    lst.addEventListener('keydown', (e) => {
      const tr = e.target.closest('tr[data-href]');
      if (tr && e.key === 'Enter') go(tr.dataset.href);
    });
    if (cfg.despues) cfg.despues(refresh);
    return refresh;
  }

  /* ---------- Barra de estados (como en los ERP de escritorio) ---------- */
  function statusbar(pasos, actual) {
    const idx = pasos.findIndex((p) => p[0] === actual);
    return '<ol class="steps">' + pasos.map((p, i) =>
      '<li class="' + (i === idx ? 'is-on' : i < idx ? 'is-done' : '') + '">' + p[1] + '</li>').join('') + '</ol>';
  }

  function historial(log) {
    return '<section class="log"><h3>Historial</h3><ol>' + log.slice().reverse().map((l) =>
      '<li><span class="log__av">' + esc(l.u.split(' ').map((x) => x[0]).join('').slice(0, 2)) + '</span><div><p><b>' + esc(l.u) + '</b> <time>' +
      fdate(l.f) + ' ' + ftime(l.f) + '</time></p><p>' + esc(l.t) + '</p></div></li>').join('') + '</ol></section>';
  }

  const addLog = (doc, t) => doc.log.push({ f: Date.now(), u: D.USUARIO.nombre, t });

  function opciones(list, sel, vacio) {
    return (vacio ? '<option value="">' + esc(vacio) + '</option>' : '') +
      list.map((o) => '<option value="' + esc(o.id) + '"' + (o.id === sel ? ' selected' : '') + '>' + esc(o.nombre) + '</option>').join('');
  }

  const diasEntre = (a, b) => Math.round((E.dayStart(a) - E.dayStart(b)) / DAY);

  /* ---------- Editor de líneas (ventas y compras) ---------- */
  function lineas(doc, campo, editable, conDesc, onChange) {
    const wrap = document.createElement('div');
    wrap.className = 'lines';
    const sm = E.stockMap();
    function fila(l, i) {
      const p = E.producto(l.p);
      const imp = l.q * l[campo] * (1 - (l.d || 0) / 100);
      const disp = sm[l.p] ? sm[l.p][doc.alm] : 0;
      const falta = campo === 'pu' && editable && l.q > disp;
      if (!editable) {
        return '<tr><td class="code">' + esc(l.p) + '</td><td>' + esc(p.nombre) + '<small>' + esc(p.pres) + '</small></td>' +
          '<td class="num">' + num(l.q) + '</td><td>' + esc(p.und) + '</td><td class="num">' + num(l[campo], 2) + '</td>' +
          (conDesc ? '<td class="num">' + (l.d ? num(l.d, 1) + '%' : '') + '</td>' : '') +
          '<td class="num"><b>' + num(imp, 2) + '</b></td><td></td></tr>';
      }
      return '<tr data-i="' + i + '"><td class="code">' + esc(l.p) + '</td>' +
        '<td><select data-k="p" aria-label="Producto">' + opciones(S().productos.map((x) => ({ id: x.id, nombre: x.nombre + ' · ' + x.pres })), l.p) + '</select>' +
        (falta ? '<small class="warn">Stock en este almacén: ' + num(disp) + '</small>' : '') + '</td>' +
        '<td class="num"><input data-k="q" type="number" min="1" step="1" value="' + l.q + '" aria-label="Cantidad"></td>' +
        '<td>' + esc(p.und) + '</td>' +
        '<td class="num"><input data-k="' + campo + '" type="number" min="0" step="0.01" value="' + l[campo] + '" aria-label="Precio"></td>' +
        (conDesc ? '<td class="num"><input data-k="d" type="number" min="0" max="100" step="0.5" value="' + (l.d || 0) + '" aria-label="Descuento"></td>' : '') +
        '<td class="num"><b data-imp>' + num(imp, 2) + '</b></td>' +
        '<td><button type="button" class="icon-btn icon-btn--sm" data-del aria-label="Quitar línea"><i class="ti ti-trash"></i></button></td></tr>';
    }
    function render() {
      wrap.innerHTML = '<div class="table-wrap"><table class="table table--lines"><thead><tr><th>Código</th><th>Producto</th><th class="num">Cant.</th><th>Und.</th><th class="num">' +
        (campo === 'pu' ? 'P. unit.' : 'Costo unit.') + '</th>' + (conDesc ? '<th class="num">Desc.</th>' : '') + '<th class="num">Importe</th><th></th></tr></thead><tbody>' +
        (doc.lineas.length ? doc.lineas.map(fila).join('') : '<tr class="table__empty"><td colspan="' + (conDesc ? 8 : 7) + '">Todavía no hay productos.</td></tr>') +
        '</tbody></table></div>' +
        (editable ? '<button type="button" class="link-btn" data-add><i class="ti ti-plus" aria-hidden="true"></i> Agregar producto</button>' : '');
    }
    render();
    if (editable) {
      wrap.addEventListener('input', (e) => {
        const tr = e.target.closest('tr[data-i]');
        if (!tr || e.target.tagName !== 'INPUT') return;
        const l = doc.lineas[Number(tr.dataset.i)];
        l[e.target.dataset.k] = Math.max(0, Number(e.target.value) || 0);
        $('[data-imp]', tr).textContent = num(l.q * l[campo] * (1 - (l.d || 0) / 100), 2);
        E.save(); onChange(false);
      });
      wrap.addEventListener('change', (e) => {
        const tr = e.target.closest('tr[data-i]');
        if (!tr) return;
        if (e.target.dataset.k === 'p') {
          const l = doc.lineas[Number(tr.dataset.i)];
          const p = E.producto(e.target.value);
          l.p = p.id; l[campo] = campo === 'pu' ? p.precio : p.costo;
        }
        E.save(); render(); onChange(true);
      });
      wrap.addEventListener('click', (e) => {
        if (e.target.closest('[data-del]')) {
          doc.lineas.splice(Number(e.target.closest('tr').dataset.i), 1);
          E.save(); render(); onChange(true);
        } else if (e.target.closest('[data-add]')) {
          const usados = new Set(doc.lineas.map((l) => l.p));
          const p = S().productos.find((x) => !usados.has(x.id)) || S().productos[0];
          doc.lineas.push(campo === 'pu' ? { p: p.id, q: 1, pu: p.precio, d: 0 } : { p: p.id, q: 1, cu: p.costo });
          E.save(); render(); onChange(true);
          const sel = wrap.querySelector('tr[data-i]:last-child select');
          if (sel) sel.focus();
        }
      });
    }
    return wrap;
  }

  function totalesHtml(t, extra) {
    return '<dl class="totals"><div><dt>Op. gravada</dt><dd>' + money(t.gravada) + '</dd></div>' +
      '<div><dt>IGV 18%</dt><dd>' + money(t.igv) + '</dd></div>' +
      '<div class="totals__grand"><dt>Importe total</dt><dd>' + money(t.total) + '</dd></div>' + (extra || '') + '</dl>';
  }

  /* Comprobante para imprimir */
  function imprimir(doc, tipo) {
    const esVenta = tipo === 'venta';
    const t = esVenta ? E.totalVenta(doc) : E.totalCompra(doc);
    const ter = esVenta ? E.cliente(doc.cliente) : E.proveedor(doc.prov);
    let titulo, numero;
    if (esVenta && doc.cpe) {
      titulo = doc.cpe.serie[0] === 'F' ? 'FACTURA ELECTRÓNICA' : 'BOLETA DE VENTA ELECTRÓNICA';
      numero = E.cpeLabel(doc);
    } else if (esVenta) {
      titulo = doc.estado === 'cot' ? 'COTIZACIÓN' : 'NOTA DE PEDIDO'; numero = doc.ref;
    } else { titulo = 'ORDEN DE COMPRA'; numero = doc.ref; }
    const campo = esVenta ? 'pu' : 'cu';
    $('#print-area').innerHTML =
      '<div class="pdoc">' +
        '<header class="pdoc__head"><div><h2>' + esc(D.EMPRESA.razon) + '</h2><p>' + esc(D.EMPRESA.giro) + '</p><p>' + esc(D.EMPRESA.dir) + '</p><p>Tel. ' + esc(D.EMPRESA.tel) + '</p></div>' +
        '<div class="pdoc__box"><p>RUC ' + D.EMPRESA.ruc + '</p><h3>' + titulo + '</h3><p>' + numero + '</p></div></header>' +
        '<table class="pdoc__info"><tr><th>' + (esVenta ? 'Cliente' : 'Proveedor') + '</th><td>' + esc(ter ? ter.nombre : '—') + '</td><th>Fecha</th><td>' + fdate(doc.cpe ? doc.cpe.f : doc.fecha) + '</td></tr>' +
        '<tr><th>' + (ter && E.esRuc(ter.doc) ? 'RUC' : 'DNI') + '</th><td>' + esc(ter ? ter.doc : '') + '</td><th>Condición</th><td>' + esc(E.cond(doc.cond).nombre) + '</td></tr>' +
        '<tr><th>Dirección</th><td colspan="3">' + esc(ter ? ter.dir + ', ' + ter.dist : '') + '</td></tr></table>' +
        '<table class="pdoc__lines"><thead><tr><th>Cant.</th><th>Und.</th><th>Código</th><th>Descripción</th><th>P. unit.</th><th>Importe</th></tr></thead><tbody>' +
        doc.lineas.map((l) => { const p = E.producto(l.p); return '<tr><td>' + l.q + '</td><td>' + p.und + '</td><td>' + p.id + '</td><td>' + esc(p.nombre + ' ' + p.pres) + (l.d ? ' (desc. ' + l.d + '%)' : '') + '</td><td>' + num(l[campo], 2) + '</td><td>' + num(l.q * l[campo] * (1 - (l.d || 0) / 100), 2) + '</td></tr>'; }).join('') +
        '</tbody></table>' +
        '<div class="pdoc__foot"><p class="pdoc__words">' + E.letras(t.total) + '</p><table class="pdoc__tot"><tr><th>Op. gravada</th><td>S/ ' + num(t.gravada, 2) + '</td></tr><tr><th>IGV 18%</th><td>S/ ' + num(t.igv, 2) + '</td></tr><tr><th>Total</th><td>S/ ' + num(t.total, 2) + '</td></tr></table></div>' +
        (esVenta && doc.cpe ? '<p class="pdoc__hash">Hash: ' + doc.cpe.hash + '</p>' : '') +
        '<p class="pdoc__demo">Documento de demostración generado por RratSoft ERP. Empresa ficticia, sin valor tributario.</p>' +
      '</div>';
    window.print();
  }

  function whatsapp(v) {
    const c = E.cliente(v.cliente);
    const t = E.totalVenta(v);
    const msg = 'Hola ' + (c ? c.nombre : '') + ', le saluda ' + D.EMPRESA.nombre + '. ' +
      (v.cpe ? 'Le enviamos su comprobante ' + E.cpeLabel(v) : 'Le enviamos la cotización ' + v.ref) +
      ' por ' + money(t.total) + '. Cualquier consulta, estamos atentos.';
    window.open('https://wa.me/?text=' + encodeURIComponent(msg), '_blank', 'noopener');
  }

  /* ================= INICIO ================= */
  function inicio() {
    crumbs([['Inicio']]);
    const T = E.today();
    const now = new Date(T);
    const mesIni = new Date(now.getFullYear(), now.getMonth(), 1).getTime();
    const antIni = new Date(now.getFullYear(), now.getMonth() - 1, 1).getTime();
    const antMismoDia = new Date(now.getFullYear(), now.getMonth() - 1, now.getDate() + 1).getTime();
    const emitidas = S().ventas.filter((v) => v.cpe && v.estado !== 'anu');

    const sum = (arr) => arr.reduce((a, v) => a + E.totalVenta(v).total, 0);
    const ventasMes = sum(emitidas.filter((v) => v.cpe.f >= mesIni));
    const ventasAnt = sum(emitidas.filter((v) => v.cpe.f >= antIni && v.cpe.f < Math.min(antMismoDia, mesIni)));
    const varPct = ventasAnt ? (ventasMes - ventasAnt) / ventasAnt * 100 : 0;
    const nDocsMes = emitidas.filter((v) => v.cpe.f >= mesIni).length;

    let porCobrar = 0, vencido = 0, nVen = 0;
    const vencidos = [];
    emitidas.forEach((v) => {
      const s = E.saldo(v, E.totalVenta(v).total);
      if (s <= 0) return;
      porCobrar += s;
      if (v.vence < T) { vencido += s; nVen++; vencidos.push({ v, s }); }
    });
    let porPagar = 0, proxPago = 0;
    S().compras.forEach((c) => {
      if (c.estado !== 'rec') return;
      const s = E.saldo(c, E.totalCompra(c).total);
      if (s <= 0) return;
      porPagar += s;
      if (!proxPago || c.vence < proxPago) proxPago = c.vence;
    });
    const sm = E.stockMap();
    const bajos = S().productos.filter((p) => (sm[p.id] ? sm[p.id].total : 0) <= p.min);

    // Ventas de los últimos 6 meses
    const meses = [];
    for (let i = 5; i >= 0; i--) {
      const a = new Date(now.getFullYear(), now.getMonth() - i, 1).getTime();
      const b = new Date(now.getFullYear(), now.getMonth() - i + 1, 1).getTime();
      meses.push({ a, label: E.MES_C[new Date(a).getMonth()], total: sum(emitidas.filter((v) => v.cpe.f >= a && v.cpe.f < b)), actual: i === 0 });
    }

    // Top productos del mes
    const top = {};
    emitidas.filter((v) => v.cpe.f >= mesIni).forEach((v) => v.lineas.forEach((l) => {
      const k = top[l.p] || (top[l.p] = { q: 0, t: 0 });
      k.q += l.q; k.t += l.q * l.pu * (1 - (l.d || 0) / 100);
    }));
    const topArr = Object.keys(top).map((id) => ({ id, ...top[id] })).sort((a, b) => b.t - a.t).slice(0, 5);
    const maxTop = topArr.length ? topArr[0].t : 1;

    const pedidos = S().ventas.filter((v) => v.estado === 'ped');
    const ocCamino = S().compras.filter((c) => c.estado === 'env');
    vencidos.sort((a, b) => a.v.vence - b.v.vence);

    const h = new Date().getHours();
    const saludo = h < 12 ? 'Buenos días' : h < 19 ? 'Buenas tardes' : 'Buenas noches';

    view().innerHTML =
      '<div class="cp"><div class="cp__row"><div class="cp__title"><h1>' + saludo + ', ' + esc(D.USUARIO.nombre.split(' ')[0]) + '</h1>' +
      '<p>Resumen de ' + E.MESES[now.getMonth()] + ' ' + now.getFullYear() + ' al ' + fdate(T) + '</p></div>' +
      '<div class="cp__actions"><a class="btn btn--primary" href="#/ventas/nuevo"><i class="ti ti-plus" aria-hidden="true"></i> Nueva venta</a>' +
      '<a class="btn" href="#/compras/nuevo">Nueva compra</a></div></div></div>' +

      '<div class="kpis">' +
        '<a class="kpi" href="#/reportes"><span>Ventas del mes</span><b>' + money(ventasMes) + '</b>' +
          '<em class="' + (varPct >= 0 ? 'up' : 'down') + '"><i class="ti ti-trending-' + (varPct >= 0 ? 'up' : 'down') + '" aria-hidden="true"></i> ' + num(Math.abs(varPct), 1) + '% vs. mismo periodo del mes pasado</em></a>' +
        '<a class="kpi" href="#/cobranzas"><span>Por cobrar</span><b>' + money(porCobrar) + '</b><em class="' + (vencido ? 'down' : '') + '">' + money(vencido) + ' vencido · ' + nVen + ' doc.</em></a>' +
        '<a class="kpi" href="#/compras"><span>Por pagar a proveedores</span><b>' + money(porPagar) + '</b><em>' + (proxPago ? 'Próximo vencimiento ' + fdate(proxPago) : 'Sin deudas') + '</em></a>' +
        '<a class="kpi" href="#/inventario"><span>Comprobantes emitidos</span><b>' + nDocsMes + '</b><em>' + pedidos.length + ' pedidos por facturar</em></a>' +
      '</div>' +

      '<div class="dash">' +
        '<section class="sheet dash__chart"><div class="sheet__head"><h2>Ventas por mes</h2><span class="muted">Comprobantes emitidos, con IGV</span></div>' + barras(meses) + '</section>' +

        '<section class="sheet"><div class="sheet__head"><h2>Más vendidos del mes</h2><a href="#/reportes" class="link">Ver reporte</a></div>' +
          (topArr.length ? '<ul class="rank">' + topArr.map((r) => { const p = E.producto(r.id); return '<li><div><p>' + esc(p.nombre) + '</p><span>' + num(r.q) + ' ' + p.und.toLowerCase() + '</span></div><b>' + money(r.t) + '</b><i style="width:' + Math.round(r.t / maxTop * 100) + '%"></i></li>'; }).join('') + '</ul>' : '<p class="empty">Sin ventas este mes.</p>') +
        '</section>' +

        '<section class="sheet"><div class="sheet__head"><h2>Cobranza vencida</h2><a href="#/cobranzas" class="link">Ver todo</a></div>' +
          (vencidos.length ? '<table class="table table--link table--compact"><tbody>' + vencidos.slice(0, 6).map((x) =>
            '<tr data-href="#/ventas/' + x.v.id + '" tabindex="0"><td><p class="strong">' + esc(E.cliente(x.v.cliente).nombre) + '</p><small>' + E.cpeLabel(x.v) + '</small></td>' +
            '<td class="num"><span class="pill pill--red">' + diasEntre(T, x.v.vence) + ' d</span></td><td class="num"><b>' + money(x.s) + '</b></td></tr>').join('') + '</tbody></table>' : '<p class="empty">No hay documentos vencidos.</p>') +
        '</section>' +

        '<section class="sheet"><div class="sheet__head"><h2>Stock bajo el mínimo</h2><span class="pill pill--' + (bajos.length ? 'amber' : 'green') + '">' + bajos.length + '</span></div>' +
          (bajos.length ? '<table class="table table--link table--compact"><tbody>' + bajos.map((p) => {
            const s = sm[p.id] ? sm[p.id].total : 0;
            return '<tr data-href="#/inventario/' + p.id + '" tabindex="0"><td><p class="strong">' + esc(p.nombre) + '</p><small>' + esc(p.pres) + '</small></td><td class="num"><b class="' + (s <= 0 ? 'neg' : '') + '">' + num(s) + '</b><small>mín. ' + p.min + '</small></td></tr>';
          }).join('') + '</tbody></table><div class="sheet__foot"><button type="button" class="btn btn--sm" id="gen-oc"><i class="ti ti-file-plus" aria-hidden="true"></i> Generar órdenes de compra</button></div>' : '<p class="empty">Todo el stock está sobre el mínimo.</p>') +
        '</section>' +

        '<section class="sheet"><div class="sheet__head"><h2>Pendientes</h2></div><ul class="todo">' +
          '<li><a href="#/ventas" data-uif="ventas:ped"><i class="ti ti-file-text" aria-hidden="true"></i><span>Pedidos por facturar</span><b>' + pedidos.length + '</b></a></li>' +
          '<li><a href="#/ventas" data-uif="ventas:cot"><i class="ti ti-file-dollar" aria-hidden="true"></i><span>Cotizaciones abiertas</span><b>' + S().ventas.filter((v) => v.estado === 'cot').length + '</b></a></li>' +
          '<li><a href="#/compras" data-uif="compras:env"><i class="ti ti-truck" aria-hidden="true"></i><span>Compras por recibir</span><b>' + ocCamino.length + '</b></a></li>' +
          '<li><a href="#/compras" data-uif="compras:bor"><i class="ti ti-pencil" aria-hidden="true"></i><span>Órdenes en borrador</span><b>' + S().compras.filter((c) => c.estado === 'bor').length + '</b></a></li>' +
        '</ul></section>' +
      '</div>';

    bindRowLinks(view());
    $$('[data-uif]', view()).forEach((a) => a.addEventListener('click', () => {
      const [m, f] = a.dataset.uif.split(':'); UI[m].f = f; UI[m].page = 0; UI[m].q = '';
    }));
    const gen = $('#gen-oc');
    if (gen) gen.addEventListener('click', () => {
      const n = generarOC(bajos);
      if (n) { UI.compras.f = 'bor'; toast(n + (n === 1 ? ' orden de compra creada' : ' órdenes de compra creadas') + ' en borrador'); go('#/compras'); }
      else toast('Esos productos ya tienen una orden de compra abierta');
    });
  }

  function barras(meses) {
    const W = 600, H = 230, L = 52, B = 26, top = 14;
    const max = Math.max(1, ...meses.map((m) => m.total));
    const step = Math.pow(10, Math.floor(Math.log10(max)));
    const nice = Math.ceil(max / step / 2) * step * 2 / 4;
    const ticks = [0, 1, 2, 3, 4].map((i) => i * nice);
    const ymax = ticks[4];
    const bw = (W - L) / meses.length;
    const y = (v) => top + (H - top - B) * (1 - v / ymax);
    return '<svg class="chart" viewBox="0 0 ' + W + ' ' + H + '" role="img" aria-label="Ventas de los últimos seis meses">' +
      ticks.map((t) => '<g class="chart__grid"><line x1="' + L + '" x2="' + W + '" y1="' + y(t) + '" y2="' + y(t) + '"/><text x="' + (L - 8) + '" y="' + (y(t) + 4) + '">' + (t >= 1000 ? num(t / 1000) + 'k' : num(t)) + '</text></g>').join('') +
      meses.map((m, i) => {
        const x = L + i * bw + bw * 0.22, w = bw * 0.56, yy = y(m.total);
        return '<g class="chart__bar' + (m.actual ? ' is-now' : '') + '"><title>' + E.MESES[new Date(m.a).getMonth()] + ': ' + money(m.total) + '</title>' +
          '<rect x="' + x + '" y="' + yy + '" width="' + w + '" height="' + (H - B - yy) + '" rx="2"/>' +
          '<text class="chart__val" x="' + (x + w / 2) + '" y="' + (yy - 6) + '">' + num(m.total / 1000, 1) + 'k</text>' +
          '<text class="chart__lbl" x="' + (x + w / 2) + '" y="' + (H - 8) + '">' + m.label + (m.actual ? ' *' : '') + '</text></g>';
      }).join('') + '</svg><p class="chart__note">* Mes en curso</p>';
  }

  function bindRowLinks(root) {
    root.addEventListener('click', (e) => {
      const tr = e.target.closest('tr[data-href]');
      if (tr && !e.target.closest('a,button,input,select')) go(tr.dataset.href);
    });
    root.addEventListener('keydown', (e) => {
      const tr = e.target.closest('tr[data-href]');
      if (tr && e.key === 'Enter') go(tr.dataset.href);
    });
  }

  function generarOC(prods) {
    const abiertos = new Set();
    S().compras.filter((c) => c.estado === 'bor' || c.estado === 'env').forEach((c) => c.lineas.forEach((l) => abiertos.add(l.p)));
    const porProv = {};
    prods.forEach((p) => {
      if (abiertos.has(p.id)) return;
      (porProv[p.prov] = porProv[p.prov] || []).push({ p: p.id, q: Math.max(40, p.min * 3), cu: p.costo });
    });
    const ids = Object.keys(porProv);
    ids.forEach((pid) => nuevaCompra(pid, porProv[pid]));
    E.save();
    return ids.length;
  }

  function nuevaCompra(prov, lin) {
    const st = S();
    st.seq.oc++;
    const pr = prov ? E.proveedor(prov) : null;
    const c = {
      id: 'C' + E.pad(st.seq.oc, 5), ref: 'OC-' + E.pad(st.seq.oc, 5), fecha: Date.now(), prov: prov || '', alm: 'A1',
      cond: pr ? pr.cond : 'cred30', lineas: lin || [], pagos: [], estado: 'bor', factProv: '', vence: 0, log: []
    };
    addLog(c, 'Creó la orden de compra');
    st.compras.push(c);
    return c;
  }

  function nuevaVenta(cli) {
    const st = S();
    st.seq.ped++;
    const c = cli ? E.cliente(cli) : null;
    const v = {
      id: 'V' + E.pad(st.seq.ped, 5), ref: 'P-' + E.pad(st.seq.ped, 5), fecha: Date.now(), cliente: cli || '', vend: D.USUARIO.nombre,
      cond: c ? c.cond : 'contado', alm: 'A1', lineas: [], pagos: [], estado: 'cot', vence: E.today(), log: []
    };
    addLog(v, 'Creó la cotización');
    st.ventas.push(v);
    E.save();
    return v;
  }

  const toast = E.toast;

  /* ================= VENTAS ================= */
  function ventas(id) {
    if (id === 'nuevo') { const v = nuevaVenta(); location.replace('#/ventas/' + v.id); return; }
    if (id) return ventaForm(id);
    crumbs([['Ventas']]);
    const all = S().ventas;
    const cnt = (f) => all.filter((v) => filtroVenta(v, f)).length;
    lista({
      mod: 'ventas', titulo: 'Ventas', sub: 'Cotizaciones, pedidos y comprobantes electrónicos',
      acciones: '<a class="btn btn--primary" href="#/ventas/nuevo"><i class="ti ti-plus" aria-hidden="true"></i> Nueva</a>' +
        '<button type="button" class="btn" id="exp-ventas"><i class="ti ti-download" aria-hidden="true"></i> Exportar</button>',
      filtros: () => [
        { id: 'todos', label: 'Todos' }, { id: 'cot', label: 'Cotizaciones', n: cnt('cot') }, { id: 'ped', label: 'Pedidos', n: cnt('ped') },
        { id: 'emi', label: 'Por cobrar', n: cnt('emi') }, { id: 'ven', label: 'Vencidos', n: cnt('ven') }, { id: 'pag', label: 'Cobrados' }, { id: 'anu', label: 'Anulados' }
      ],
      buscar: 'Buscar cliente, número o comprobante',
      data: () => all.slice().sort((a, b) => b.fecha - a.fecha),
      filtrar: filtroVenta,
      texto: (v) => v.ref + ' ' + E.cpeLabel(v) + ' ' + (E.cliente(v.cliente) || {}).nombre + ' ' + v.vend,
      href: (v) => '#/ventas/' + v.id,
      cols: [
        { h: 'Número', cls: 'code', v: (v) => v.ref },
        { h: 'Comprobante', cls: 'code', v: (v) => E.cpeLabel(v) || '<span class="muted">—</span>' },
        { h: 'Fecha', v: (v) => fdate(v.fecha) },
        { h: 'Cliente', cls: 'wide', v: (v) => esc((E.cliente(v.cliente) || { nombre: 'Sin cliente' }).nombre) },
        { h: 'Vendedor', cls: 'hide-md', v: (v) => esc(v.vend) },
        { h: 'Total', cls: 'num', v: (v) => num(E.totalVenta(v).total, 2) },
        { h: 'Saldo', cls: 'num hide-sm', v: (v) => { if (!v.cpe || v.estado === 'anu') return ''; const s = E.saldo(v, E.totalVenta(v).total); return s > 0 ? num(s, 2) : '<span class="muted">0.00</span>'; } },
        { h: 'Estado', v: (v) => pill(E.ESTADOS_VENTA, E.ventaEstado(v)) }
      ],
      pie: (rows) => {
        const t = rows.reduce((a, v) => a + (v.estado === 'anu' ? 0 : E.totalVenta(v).total), 0);
        return '<tr><td colspan="4">' + rows.length + ' documentos</td><td class="hide-md"></td><td class="num"><b>' + num(t, 2) + '</b></td><td class="hide-sm"></td><td></td></tr>';
      },
      despues: () => {
        $('#exp-ventas').addEventListener('click', () => {
          E.csv('ventas', [['Numero', 'Comprobante', 'Fecha', 'Cliente', 'RUC/DNI', 'Vendedor', 'Op. gravada', 'IGV', 'Total', 'Saldo', 'Estado']].concat(
            all.map((v) => { const t = E.totalVenta(v); const c = E.cliente(v.cliente) || {}; return [v.ref, E.cpeLabel(v), fdate(v.fecha), c.nombre, c.doc, v.vend, t.gravada.toFixed(2), t.igv.toFixed(2), t.total.toFixed(2), v.cpe ? E.saldo(v, t.total).toFixed(2) : '', E.ESTADOS_VENTA[E.ventaEstado(v)][0]]; })));
        });
      }
    });
  }
  function filtroVenta(v, f) {
    const e = E.ventaEstado(v);
    if (f === 'todos') return true;
    if (f === 'emi') return e === 'emi' || e === 'ven';
    return e === f;
  }

  function ventaForm(id) {
    const v = S().ventas.find((x) => x.id === id);
    if (!v) { view().innerHTML = '<div class="sheet empty-page"><p>No encontramos ese documento.</p><a class="btn" href="#/ventas">Volver a ventas</a></div>'; return; }
    const est = E.ventaEstado(v);
    const editable = v.estado === 'cot' || v.estado === 'ped';
    const c = E.cliente(v.cliente);
    const t = E.totalVenta(v);
    const sal = v.cpe ? E.saldo(v, t.total) : 0;
    crumbs([['Ventas', '#/ventas'], [v.cpe ? E.cpeLabel(v) : v.ref]]);

    const tipoCpe = c ? (E.esRuc(c.doc) ? 'Factura' : 'Boleta') : 'Factura o boleta';
    let acc = '';
    if (v.estado === 'cot') acc = '<button class="btn btn--primary" data-a="confirmar">Confirmar pedido</button><button class="btn" data-a="imprimir">Imprimir cotización</button><button class="btn" data-a="wa"><i class="ti ti-brand-whatsapp" aria-hidden="true"></i> Enviar</button><button class="btn btn--ghost" data-a="anular">Anular</button>';
    if (v.estado === 'ped') acc = '<button class="btn btn--primary" data-a="emitir">Emitir ' + tipoCpe.toLowerCase() + '</button><button class="btn" data-a="imprimir">Imprimir pedido</button><button class="btn btn--ghost" data-a="anular">Anular</button>';
    if (v.estado === 'emi') acc = (sal > 0 ? '<button class="btn btn--primary" data-a="cobrar">Registrar cobro</button>' : '') + '<button class="btn" data-a="imprimir">Imprimir comprobante</button><button class="btn" data-a="wa"><i class="ti ti-brand-whatsapp" aria-hidden="true"></i> Enviar</button><button class="btn btn--ghost" data-a="duplicar">Duplicar</button>';
    if (v.estado === 'anu') acc = '<button class="btn" data-a="duplicar">Duplicar</button>';

    const pasos = [['cot', 'Cotización'], ['ped', 'Pedido'], ['emi', 'Emitido'], ['pag', 'Cobrado']];
    const pasoActual = est === 'ven' ? 'emi' : est;

    view().innerHTML =
      '<div class="form-top"><div class="form-top__actions">' + acc + '</div>' +
        (v.estado === 'anu' ? '<span class="pill pill--muted pill--lg">Anulado</span>' : statusbar(pasos, pasoActual)) + '</div>' +
      '<div class="form-layout"><div class="sheet sheet--form">' +
        '<div class="form-head"><div><p class="form-head__kind">' + (v.cpe ? (v.cpe.serie[0] === 'F' ? 'Factura electrónica' : 'Boleta electrónica') : est === 'cot' ? 'Cotización' : 'Pedido de venta') + '</p>' +
        '<h1>' + (v.cpe ? E.cpeLabel(v) : v.ref) + '</h1>' + (v.cpe ? '<p class="muted">Pedido ' + v.ref + '</p>' : '') + '</div>' +
        (est === 'ven' ? '<span class="pill pill--red pill--lg">Vencido hace ' + diasEntre(E.today(), v.vence) + ' días</span>' : '') + '</div>' +

        '<div class="fields">' +
          '<div class="fields__col">' +
            fld('Cliente', editable ? '<select id="f-cli">' + opciones(S().clientes, v.cliente, 'Elegir cliente…') + '</select>' : (c ? '<a href="#/contactos/' + c.id + '">' + esc(c.nombre) + '</a>' : '—')) +
            fld(c && E.esRuc(c.doc) ? 'RUC' : 'DNI', c ? esc(c.doc) : '<span class="muted">—</span>') +
            fld('Dirección', c ? esc(c.dir + ', ' + c.dist) : '<span class="muted">—</span>') +
            fld('Condición de pago', editable ? '<select id="f-cond">' + opciones(D.CONDICIONES, v.cond) + '</select>' : esc(E.cond(v.cond).nombre)) +
          '</div><div class="fields__col">' +
            fld('Fecha', fdate(v.cpe ? v.cpe.f : v.fecha)) +
            (v.cpe ? fld('Vencimiento', fdate(v.vence)) : fld('Comprobante', '<span class="muted">Se emitirá ' + tipoCpe.toLowerCase() + (c ? (E.esRuc(c.doc) ? ' (cliente con RUC)' : ' (cliente con DNI)') : '') + '</span>')) +
            fld('Almacén', editable ? '<select id="f-alm">' + opciones(D.ALMACENES, v.alm) + '</select>' : esc(E.almacen(v.alm).nombre)) +
            fld('Vendedor', editable ? '<select id="f-vend">' + opciones(D.VENDEDORES.map((x) => ({ id: x, nombre: x })), v.vend) + '</select>' : esc(v.vend)) +
          '</div>' +
        '</div>' +
        '<div id="f-lines"></div>' +
        '<div class="form-bottom">' +
          (v.cpe ? '<div class="sunat"><i class="ti ti-circle-check" aria-hidden="true"></i><div><p><b>Aceptado por SUNAT</b> · simulación</p><p>' + E.cpeLabel(v) + ' · Hash ' + v.cpe.hash + '</p></div></div>' : '<div></div>') +
          '<div id="f-tot"></div>' +
        '</div>' +
        (v.pagos.length ? '<h3 class="sub">Cobros</h3><div class="table-wrap"><table class="table table--compact"><thead><tr><th>Fecha</th><th>Método</th><th>Cuenta</th><th class="num">Monto</th></tr></thead><tbody>' +
          v.pagos.map((p) => '<tr><td>' + fdate(p.f) + ' ' + ftime(p.f) + '</td><td>' + esc(E.metodo(p.met).nombre) + '</td><td>' + esc(E.cuenta(E.metodo(p.met).cuenta).nombre) + '</td><td class="num">' + money(p.monto) + '</td></tr>').join('') + '</tbody></table></div>' : '') +
      '</div>' + historial(v.log) + '</div>';

    function pintarTotales() {
      const tt = E.totalVenta(v);
      const extra = v.cpe ? '<div><dt>Cobrado</dt><dd>' + money(E.pagado(v)) + '</dd></div><div class="totals__due"><dt>Saldo</dt><dd>' + money(E.saldo(v, tt.total)) + '</dd></div>' : '';
      $('#f-tot').innerHTML = totalesHtml(tt, extra);
    }
    $('#f-lines').appendChild(lineas(v, 'pu', editable, true, pintarTotales));
    pintarTotales();

    if (editable) {
      $('#f-cli').addEventListener('change', (e) => {
        v.cliente = e.target.value;
        const cc = E.cliente(v.cliente);
        if (cc) v.cond = cc.cond;
        E.save(); ventaForm(id);
      });
      $('#f-cond').addEventListener('change', (e) => { v.cond = e.target.value; E.save(); });
      $('#f-alm').addEventListener('change', (e) => { v.alm = e.target.value; E.save(); ventaForm(id); });
      $('#f-vend').addEventListener('change', (e) => { v.vend = e.target.value; E.save(); });
    }

    $('.form-top__actions').addEventListener('click', async (e) => {
      const b = e.target.closest('[data-a]');
      if (!b) return;
      const a = b.dataset.a;
      if (a === 'imprimir') return imprimir(v, 'venta');
      if (a === 'wa') return whatsapp(v);
      if (a === 'duplicar') {
        const n = nuevaVenta(v.cliente);
        n.lineas = v.lineas.map((l) => Object.assign({}, l, { pu: E.producto(l.p).precio }));
        n.alm = v.alm; E.save();
        toast('Se creó la cotización ' + n.ref); go('#/ventas/' + n.id); return;
      }
      if (a === 'anular') {
        if (!(await E.confirmar('Anular ' + v.ref, 'El documento quedará anulado y no se podrá emitir. ¿Continuar?', 'Anular', true))) return;
        v.estado = 'anu'; addLog(v, 'Anuló el documento'); E.save(); toast(v.ref + ' anulado'); return ventaForm(id);
      }
      const err = validarVenta(v);
      if (a === 'confirmar') {
        if (err) return toast(err, 'error');
        v.estado = 'ped'; addLog(v, 'Confirmó el pedido'); E.save(); toast('Pedido ' + v.ref + ' confirmado'); return ventaForm(id);
      }
      if (a === 'emitir') {
        if (err) return toast(err, 'error');
        const sm = E.stockMap();
        const falta = v.lineas.find((l) => l.q > (sm[l.p] ? sm[l.p][v.alm] : 0));
        if (falta) return toast('No hay stock suficiente de ' + E.producto(falta.p).nombre + ' en ' + E.almacen(v.alm).nombre, 'error');
        const cc = E.cliente(v.cliente);
        const tipo = E.esRuc(cc.doc) ? 'factura' : 'boleta';
        if (!(await E.confirmar('Emitir ' + tipo + ' electrónica', 'Se emitirá la ' + tipo + ' a ' + cc.nombre + ' por ' + money(E.totalVenta(v).total) + ' y se descontará el stock del ' + E.almacen(v.alm).nombre + '.', 'Emitir'))) return;
        emitirVenta(v);
        toast(tipo[0].toUpperCase() + tipo.slice(1) + ' ' + E.cpeLabel(v) + ' emitida y aceptada');
        return ventaForm(id);
      }
      if (a === 'cobrar') {
        const s = E.saldo(v, E.totalVenta(v).total);
        const r = await E.modal({
          titulo: 'Registrar cobro · ' + E.cpeLabel(v),
          html: '<div class="form-grid"><label class="field">Monto<input name="monto" type="number" step="0.01" min="0.01" max="' + s + '" value="' + s.toFixed(2) + '" required></label>' +
            '<label class="field">Método de pago<select name="met">' + opciones(D.METODOS, 'transf_bcp') + '</select></label></div>' +
            '<p class="muted">Saldo pendiente: ' + money(s) + '. Puedes registrar un pago parcial.</p>',
          ok: 'Registrar cobro',
          validar: (d) => { const m = Number(d.monto); if (!(m > 0)) return 'Ingresa un monto mayor a cero.'; if (m > s + 0.001) return 'El monto no puede ser mayor al saldo (' + money(s) + ').'; return ''; }
        });
        if (!r) return;
        const m = E.round2(Number(r.monto));
        const met = E.metodo(r.met);
        v.pagos.push({ f: Date.now(), monto: m, met: met.id });
        S().caja.push({ id: ++S().seq.mov, f: Date.now(), cta: met.cuenta, monto: m, concepto: 'Cobro ' + E.cpeLabel(v), ref: v.id });
        addLog(v, 'Registró cobro de ' + money(m) + ' (' + met.nombre + ')');
        E.save(); toast('Cobro registrado en ' + E.cuenta(met.cuenta).nombre);
        return ventaForm(id);
      }
    });
  }

  function validarVenta(v) {
    if (!v.cliente) return 'Elige un cliente.';
    if (!v.lineas.length) return 'Agrega al menos un producto.';
    if (v.lineas.some((l) => !(l.q > 0))) return 'Revisa las cantidades: deben ser mayores a cero.';
    if (v.lineas.some((l) => !(l.pu > 0))) return 'Revisa los precios: deben ser mayores a cero.';
    return '';
  }

  function emitirVenta(v) {
    const st = S();
    const c = E.cliente(v.cliente);
    const serie = E.esRuc(c.doc) ? 'F001' : 'B001';
    st.seq[serie]++;
    const f = Date.now();
    v.cpe = { serie, num: st.seq[serie], f, hash: E.hashCode(serie + st.seq[serie] + f) };
    v.estado = 'emi';
    v.vence = E.today() + E.cond(v.cond).dias * DAY;
    v.lineas.forEach((l) => st.movs.push({ f, p: l.p, alm: v.alm, q: -l.q, tipo: 'Venta', ref: E.cpeLabel(v), cu: E.producto(l.p).costo }));
    addLog(v, 'Emitió la ' + (serie === 'F001' ? 'factura ' : 'boleta ') + E.cpeLabel(v) + '. SUNAT: aceptado (simulación)');
    E.save();
  }

  function fld(label, html) {
    return '<div class="fld"><span class="fld__label">' + label + '</span><div class="fld__val">' + html + '</div></div>';
  }

  /* ================= COMPRAS ================= */
  function compras(id) {
    if (id === 'nuevo') { const c = nuevaCompra(); E.save(); location.replace('#/compras/' + c.id); return; }
    if (id) return compraForm(id);
    crumbs([['Compras']]);
    const all = S().compras;
    const cnt = (f) => all.filter((c) => E.compraEstado(c) === f).length;
    lista({
      mod: 'compras', titulo: 'Compras', sub: 'Órdenes de compra a proveedores',
      acciones: '<a class="btn btn--primary" href="#/compras/nuevo"><i class="ti ti-plus" aria-hidden="true"></i> Nueva orden</a>',
      filtros: () => [
        { id: 'todos', label: 'Todas' }, { id: 'bor', label: 'Borrador', n: cnt('bor') }, { id: 'env', label: 'Por recibir', n: cnt('env') },
        { id: 'rec', label: 'Por pagar', n: cnt('rec') }, { id: 'pag', label: 'Pagadas' }, { id: 'anu', label: 'Anuladas' }
      ],
      buscar: 'Buscar proveedor o número',
      data: () => all.slice().sort((a, b) => b.fecha - a.fecha),
      filtrar: (c, f) => f === 'todos' || E.compraEstado(c) === f,
      texto: (c) => c.ref + ' ' + c.factProv + ' ' + (E.proveedor(c.prov) || {}).nombre,
      href: (c) => '#/compras/' + c.id,
      cols: [
        { h: 'Número', cls: 'code', v: (c) => c.ref },
        { h: 'Fecha', v: (c) => fdate(c.fecha) },
        { h: 'Proveedor', cls: 'wide', v: (c) => esc((E.proveedor(c.prov) || { nombre: 'Sin proveedor' }).nombre) },
        { h: 'Fact. proveedor', cls: 'code hide-md', v: (c) => c.factProv || '<span class="muted">—</span>' },
        { h: 'Vence', cls: 'hide-sm', v: (c) => c.vence && E.compraEstado(c) === 'rec' ? '<span class="' + (c.vence < E.today() ? 'neg' : '') + '">' + fdate(c.vence) + '</span>' : '' },
        { h: 'Total', cls: 'num', v: (c) => num(E.totalCompra(c).total, 2) },
        { h: 'Estado', v: (c) => pill(E.ESTADOS_COMPRA, E.compraEstado(c)) }
      ]
    });
  }

  function compraForm(id) {
    const c = S().compras.find((x) => x.id === id);
    if (!c) { view().innerHTML = '<div class="sheet empty-page"><p>No encontramos esa orden.</p><a class="btn" href="#/compras">Volver a compras</a></div>'; return; }
    const est = E.compraEstado(c);
    const editable = c.estado === 'bor';
    const pr = E.proveedor(c.prov);
    crumbs([['Compras', '#/compras'], [c.ref]]);
    let acc = '';
    if (c.estado === 'bor') acc = '<button class="btn btn--primary" data-a="enviar">Enviar al proveedor</button><button class="btn" data-a="imprimir">Imprimir</button><button class="btn btn--ghost" data-a="anular">Anular</button>';
    if (c.estado === 'env') acc = '<button class="btn btn--primary" data-a="recibir">Recibir mercadería</button><button class="btn" data-a="imprimir">Imprimir</button><button class="btn btn--ghost" data-a="anular">Anular</button>';
    if (est === 'rec') acc = '<button class="btn btn--primary" data-a="pagar">Registrar pago</button><button class="btn" data-a="imprimir">Imprimir</button>';
    if (est === 'pag') acc = '<button class="btn" data-a="imprimir">Imprimir</button>';

    view().innerHTML =
      '<div class="form-top"><div class="form-top__actions">' + acc + '</div>' +
        (c.estado === 'anu' ? '<span class="pill pill--muted pill--lg">Anulada</span>' : statusbar([['bor', 'Borrador'], ['env', 'Enviada'], ['rec', 'Recibida'], ['pag', 'Pagada']], est)) + '</div>' +
      '<div class="form-layout"><div class="sheet sheet--form">' +
        '<div class="form-head"><div><p class="form-head__kind">Orden de compra</p><h1>' + c.ref + '</h1></div>' +
          (est === 'rec' && c.vence < E.today() ? '<span class="pill pill--red pill--lg">Pago vencido</span>' : '') + '</div>' +
        '<div class="fields"><div class="fields__col">' +
          fld('Proveedor', editable ? '<select id="f-prov">' + opciones(S().proveedores, c.prov, 'Elegir proveedor…') + '</select>' : (pr ? '<a href="#/contactos/' + pr.id + '">' + esc(pr.nombre) + '</a>' : '—')) +
          fld('RUC', pr ? pr.doc : '<span class="muted">—</span>') +
          fld('Condición de pago', editable ? '<select id="f-cond">' + opciones(D.CONDICIONES, c.cond) + '</select>' : esc(E.cond(c.cond).nombre)) +
        '</div><div class="fields__col">' +
          fld('Fecha', fdate(c.fecha)) +
          fld('Recibir en', editable ? '<select id="f-alm">' + opciones(D.ALMACENES, c.alm) + '</select>' : esc(E.almacen(c.alm).nombre)) +
          fld('Factura del proveedor', c.factProv ? '<span class="code">' + c.factProv + '</span>' : '<span class="muted">Se registra al recibir</span>') +
          (c.vence ? fld('Vencimiento del pago', fdate(c.vence)) : '') +
        '</div></div>' +
        '<div id="f-lines"></div><div class="form-bottom"><div></div><div id="f-tot"></div></div>' +
      '</div>' + historial(c.log) + '</div>';

    function pintar() {
      const t = E.totalCompra(c);
      const extra = c.estado === 'rec' ? '<div><dt>Pagado</dt><dd>' + money(E.pagado(c)) + '</dd></div><div class="totals__due"><dt>Saldo</dt><dd>' + money(E.saldo(c, t.total)) + '</dd></div>' : '';
      $('#f-tot').innerHTML = totalesHtml(t, extra);
    }
    $('#f-lines').appendChild(lineas(c, 'cu', editable, false, pintar));
    pintar();
    if (editable) {
      $('#f-prov').addEventListener('change', (e) => { c.prov = e.target.value; const p = E.proveedor(c.prov); if (p) c.cond = p.cond; E.save(); compraForm(id); });
      $('#f-cond').addEventListener('change', (e) => { c.cond = e.target.value; E.save(); });
      $('#f-alm').addEventListener('change', (e) => { c.alm = e.target.value; E.save(); });
    }
    $('.form-top__actions').addEventListener('click', async (e) => {
      const b = e.target.closest('[data-a]');
      if (!b) return;
      const a = b.dataset.a;
      if (a === 'imprimir') return imprimir(c, 'compra');
      if (a === 'anular') {
        if (!(await E.confirmar('Anular ' + c.ref, '¿Seguro que quieres anular esta orden de compra?', 'Anular', true))) return;
        c.estado = 'anu'; addLog(c, 'Anuló la orden'); E.save(); return compraForm(id);
      }
      if (a === 'enviar') {
        if (!c.prov) return toast('Elige un proveedor.', 'error');
        if (!c.lineas.length || c.lineas.some((l) => !(l.q > 0) || !(l.cu > 0))) return toast('Revisa los productos, cantidades y costos.', 'error');
        c.estado = 'env'; c.fecha = Date.now(); addLog(c, 'Envió la orden de compra al proveedor'); E.save(); toast(c.ref + ' enviada a ' + E.proveedor(c.prov).nombre); return compraForm(id);
      }
      if (a === 'recibir') {
        const r = await E.modal({
          titulo: 'Recibir mercadería · ' + c.ref,
          html: '<p class="modal__text">Se sumará el stock de ' + c.lineas.length + ' producto(s) en ' + esc(E.almacen(c.alm).nombre) + '.</p>' +
            '<label class="field">Factura del proveedor<input name="fac" placeholder="F001-00012345" required></label>',
          ok: 'Recibir',
          validar: (d) => /^[A-Z0-9]{4}-\d{1,8}$/i.test(d.fac.trim()) ? '' : 'Escribe la serie y número, por ejemplo F001-00012345.'
        });
        if (!r) return;
        const f = Date.now();
        const [se, nu] = r.fac.trim().toUpperCase().split('-');
        c.factProv = se + '-' + E.pad(nu, 8);
        c.estado = 'rec'; c.recibido = f;
        c.vence = E.today() + E.cond(c.cond).dias * DAY;
        c.lineas.forEach((l) => S().movs.push({ f, p: l.p, alm: c.alm, q: l.q, tipo: 'Compra', ref: c.ref, cu: l.cu }));
        addLog(c, 'Recibió la mercadería. Factura del proveedor ' + c.factProv);
        E.save(); toast('Mercadería recibida: stock actualizado'); return compraForm(id);
      }
      if (a === 'pagar') {
        const s = E.saldo(c, E.totalCompra(c).total);
        const r = await E.modal({
          titulo: 'Registrar pago · ' + c.ref,
          html: '<div class="form-grid"><label class="field">Monto<input name="monto" type="number" step="0.01" min="0.01" value="' + s.toFixed(2) + '" required></label>' +
            '<label class="field">Pagar desde<select name="cta">' + opciones(D.CUENTAS.map((x) => ({ id: x.id, nombre: x.nombre + ' · ' + money(E.saldoCuenta(x.id)) })), 'bcp') + '</select></label></div>',
          ok: 'Registrar pago',
          validar: (d) => { const m = Number(d.monto); if (!(m > 0)) return 'Ingresa un monto mayor a cero.'; if (m > s + 0.001) return 'No puede ser mayor al saldo (' + money(s) + ').'; if (m > E.saldoCuenta(d.cta) + 0.001) return 'Esa cuenta no tiene saldo suficiente.'; return ''; }
        });
        if (!r) return;
        const m = E.round2(Number(r.monto));
        c.pagos.push({ f: Date.now(), monto: m, met: r.cta });
        S().caja.push({ id: ++S().seq.mov, f: Date.now(), cta: r.cta, monto: -m, concepto: 'Pago ' + c.ref + ' · ' + E.proveedor(c.prov).nombre, ref: c.id });
        addLog(c, 'Registró pago de ' + money(m) + ' desde ' + E.cuenta(r.cta).nombre);
        E.save(); toast('Pago registrado'); return compraForm(id);
      }
    });
  }

  /* ================= INVENTARIO ================= */
  function inventario(id) {
    if (id) return productoPage(id);
    crumbs([['Inventario']]);
    const sm = E.stockMap();
    const st = (p) => sm[p.id] || { A1: 0, A2: 0, total: 0 };
    const estado = (p) => { const s = st(p).total; return s <= 0 ? 'ago' : s <= p.min ? 'bajo' : 'ok'; };
    const valor = S().productos.reduce((a, p) => a + st(p).total * p.costo, 0);
    const cats = Array.from(new Set(S().productos.map((p) => p.cat))).sort();
    const ui = UI.inventario;
    lista({
      mod: 'inventario', titulo: 'Inventario', sub: 'Valorizado a costo: <b>' + money(valor) + '</b> · ' + S().productos.length + ' productos en 2 almacenes',
      acciones: '<button type="button" class="btn btn--primary" id="new-prod"><i class="ti ti-plus" aria-hidden="true"></i> Nuevo producto</button>' +
        '<button type="button" class="btn" id="exp-inv"><i class="ti ti-download" aria-hidden="true"></i> Exportar</button>',
      filtros: () => [{ id: 'todos', label: 'Todos' }, { id: 'bajo', label: 'Stock bajo', n: S().productos.filter((p) => estado(p) === 'bajo').length }, { id: 'ago', label: 'Agotados', n: S().productos.filter((p) => estado(p) === 'ago').length }],
      herramientas: '<label class="select-sm"><span class="sr">Categoría</span><select id="inv-cat"><option value="">Todas las categorías</option>' + cats.map((c) => '<option' + (ui.cat === c ? ' selected' : '') + '>' + esc(c) + '</option>').join('') + '</select></label>',
      buscar: 'Buscar código o producto',
      data: () => S().productos.filter((p) => !ui.cat || p.cat === ui.cat),
      filtrar: (p, f) => f === 'todos' || estado(p) === f,
      texto: (p) => p.id + ' ' + p.nombre + ' ' + p.pres,
      href: (p) => '#/inventario/' + p.id,
      cols: [
        { h: 'Código', cls: 'code', v: (p) => p.id },
        { h: 'Producto', cls: 'wide', v: (p) => esc(p.nombre) + '<small>' + esc(p.pres) + '</small>' },
        { h: 'Categoría', cls: 'hide-md', v: (p) => esc(p.cat) },
        { h: 'Principal', cls: 'num hide-sm', v: (p) => num(st(p).A1) },
        { h: 'Tienda', cls: 'num hide-sm', v: (p) => num(st(p).A2) },
        { h: 'Total', cls: 'num', v: (p) => '<b>' + num(st(p).total) + '</b>' },
        { h: 'Mín.', cls: 'num hide-md', v: (p) => p.min },
        { h: 'Costo', cls: 'num hide-md', v: (p) => num(p.costo, 2) },
        { h: 'Valorizado', cls: 'num hide-sm', v: (p) => num(st(p).total * p.costo, 2) },
        { h: 'Estado', v: (p) => ({ ok: '<span class="pill pill--green">Normal</span>', bajo: '<span class="pill pill--amber">Bajo</span>', ago: '<span class="pill pill--red">Agotado</span>' })[estado(p)] }
      ],
      despues: (refresh) => {
        $('#inv-cat').addEventListener('change', (e) => { ui.cat = e.target.value; ui.page = 0; refresh(); });
        $('#exp-inv').addEventListener('click', () => E.csv('inventario', [['Codigo', 'Producto', 'Presentacion', 'Categoria', 'Und', 'Stock principal', 'Stock tienda', 'Total', 'Minimo', 'Costo', 'Precio', 'Valorizado']].concat(
          S().productos.map((p) => [p.id, p.nombre, p.pres, p.cat, p.und, st(p).A1, st(p).A2, st(p).total, p.min, p.costo.toFixed(2), p.precio.toFixed(2), (st(p).total * p.costo).toFixed(2)]))));
        $('#new-prod').addEventListener('click', nuevoProducto);
      }
    });
  }

  async function nuevoProducto() {
    const cats = Array.from(new Set(S().productos.map((p) => p.cat))).sort();
    const r = await E.modal({
      titulo: 'Nuevo producto',
      html: '<div class="form-grid">' +
        '<label class="field field--full">Nombre<input name="nombre" required placeholder="Ej. Sal yodada"></label>' +
        '<label class="field">Presentación<input name="pres" required placeholder="Caja 50 × 1 kg"></label>' +
        '<label class="field">Categoría<select name="cat">' + cats.map((c) => '<option>' + esc(c) + '</option>').join('') + '</select></label>' +
        '<label class="field">Unidad<select name="und"><option>CJA</option><option>SAC</option><option>PAQ</option><option>FAR</option><option>UND</option></select></label>' +
        '<label class="field">Stock mínimo<input name="min" type="number" min="0" value="10"></label>' +
        '<label class="field">Costo (con IGV)<input name="costo" type="number" step="0.01" min="0" required></label>' +
        '<label class="field">Precio de venta (con IGV)<input name="precio" type="number" step="0.01" min="0" required></label>' +
        '<label class="field field--full">Proveedor habitual<select name="prov">' + opciones(S().proveedores, '') + '</select></label></div>',
      ok: 'Crear producto',
      validar: (d) => {
        if (!d.nombre.trim() || !d.pres.trim()) return 'Completa el nombre y la presentación.';
        if (!(Number(d.costo) > 0) || !(Number(d.precio) > 0)) return 'Ingresa el costo y el precio.';
        if (Number(d.precio) < Number(d.costo)) return 'El precio de venta es menor que el costo.';
        return '';
      }
    });
    if (!r) return;
    const n = S().productos.length + 1;
    const p = { id: 'P' + E.pad(n, 3), nombre: r.nombre.trim(), pres: r.pres.trim(), cat: r.cat, und: r.und, precio: Number(r.precio), costo: Number(r.costo), min: Number(r.min) || 0, prov: r.prov };
    S().productos.push(p);
    E.save(); toast('Producto ' + p.id + ' creado. Su stock empieza en cero.');
    go('#/inventario/' + p.id);
  }

  function productoPage(id) {
    const p = E.producto(id);
    if (!p) { view().innerHTML = '<div class="sheet empty-page"><p>No encontramos ese producto.</p><a class="btn" href="#/inventario">Volver al inventario</a></div>'; return; }
    crumbs([['Inventario', '#/inventario'], [p.nombre]]);
    const s1 = E.stock(p.id, 'A1'), s2 = E.stock(p.id, 'A2');
    const camino = S().compras.filter((c) => c.estado === 'env').reduce((a, c) => a + c.lineas.filter((l) => l.p === p.id).reduce((x, l) => x + l.q, 0), 0);
    const margen = (p.precio - p.costo) / p.precio * 100;
    const ui = UI.kardex;
    if (ui.pid !== p.id) { ui.pid = p.id; ui.page = 0; ui.alm = ''; }

    view().innerHTML =
      '<div class="cp"><div class="cp__row"><div class="cp__title"><p class="form-head__kind">' + p.id + ' · ' + esc(p.cat) + '</p><h1>' + esc(p.nombre) + '</h1><p>' + esc(p.pres) + ' · Proveedor: ' + esc((E.proveedor(p.prov) || { nombre: '—' }).nombre) + '</p></div>' +
      '<div class="cp__actions"><button type="button" class="btn btn--primary" data-a="pedir"><i class="ti ti-file-plus" aria-hidden="true"></i> Pedir al proveedor</button>' +
      '<button type="button" class="btn" data-a="transferir">Transferir</button><button type="button" class="btn" data-a="ajustar">Ajustar stock</button></div></div></div>' +
      '<div class="stats">' +
        '<div><span>Stock principal</span><b>' + num(s1) + ' <small>' + p.und + '</small></b></div>' +
        '<div><span>Stock tienda</span><b>' + num(s2) + ' <small>' + p.und + '</small></b></div>' +
        '<div><span>En camino</span><b>' + num(camino) + ' <small>' + p.und + '</small></b></div>' +
        '<div><span>Stock mínimo</span><b class="' + (s1 + s2 <= p.min ? 'neg' : '') + '">' + p.min + '</b></div>' +
        '<div><span>Costo / Precio</span><b>' + num(p.costo, 2) + ' / ' + num(p.precio, 2) + '</b></div>' +
        '<div><span>Margen</span><b>' + num(margen, 1) + '%</b></div>' +
      '</div>' +
      '<div class="sheet sheet--list"><div class="sheet__head sheet__head--pad"><h2>Kárdex</h2>' +
        '<div class="seg">' + [['', 'Todos'], ['A1', 'Principal'], ['A2', 'Tienda']].map((x) => '<button type="button" class="seg__btn' + (ui.alm === x[0] ? ' is-on' : '') + '" data-alm="' + x[0] + '">' + x[1] + '</button>').join('') + '</div></div>' +
        '<div id="kx"></div></div>';

    function renderK() {
      const movs = S().movs.filter((m) => m.p === p.id && (!ui.alm || m.alm === ui.alm)).sort((a, b) => a.f - b.f);
      let bal = 0;
      const rows = movs.map((m) => { bal += m.q; return Object.assign({ bal }, m); }).reverse();
      const pages = Math.max(1, Math.ceil(rows.length / PAGE));
      if (ui.page >= pages) ui.page = pages - 1;
      const from = ui.page * PAGE;
      $('#kx').innerHTML = '<div class="table-wrap"><table class="table"><thead><tr><th>Fecha</th><th>Movimiento</th><th>Documento</th><th class="hide-sm">Almacén</th><th class="num">Entrada</th><th class="num">Salida</th><th class="num">Saldo</th><th class="num hide-sm">Costo unit.</th></tr></thead><tbody>' +
        rows.slice(from, from + PAGE).map((m) => '<tr><td>' + fdate(m.f) + ' <span class="muted">' + ftime(m.f) + '</span></td><td>' + esc(m.tipo) + '</td><td class="code">' + kxLink(m.ref) + '</td><td class="hide-sm">' + (m.alm === 'A1' ? 'Principal' : 'Tienda') + '</td>' +
          '<td class="num pos">' + (m.q > 0 ? num(m.q) : '') + '</td><td class="num neg">' + (m.q < 0 ? num(-m.q) : '') + '</td><td class="num"><b>' + num(m.bal) + '</b></td><td class="num hide-sm">' + num(m.cu, 2) + '</td></tr>').join('') +
        (rows.length ? '' : '<tr class="table__empty"><td colspan="8">Sin movimientos todavía.</td></tr>') +
        '</tbody></table></div><div class="pager"><span>' + (rows.length ? (from + 1) + '–' + Math.min(from + PAGE, rows.length) + ' de ' + rows.length : '0') + '</span>' +
        '<button type="button" class="icon-btn" data-pg="-1" aria-label="Anterior"' + (ui.page <= 0 ? ' disabled' : '') + '><i class="ti ti-chevron-left"></i></button>' +
        '<button type="button" class="icon-btn" data-pg="1" aria-label="Siguiente"' + (ui.page >= pages - 1 ? ' disabled' : '') + '><i class="ti ti-chevron-right"></i></button></div>';
    }
    renderK();
    $('#kx').addEventListener('click', (e) => { const pg = e.target.closest('[data-pg]'); if (pg) { ui.page += Number(pg.dataset.pg); renderK(); } });
    $$('[data-alm]', view()).forEach((b) => b.addEventListener('click', () => { ui.alm = b.dataset.alm; ui.page = 0; $$('[data-alm]').forEach((x) => x.classList.toggle('is-on', x === b)); renderK(); }));

    $('.cp__actions', view()).addEventListener('click', async (e) => {
      const b = e.target.closest('[data-a]');
      if (!b) return;
      if (b.dataset.a === 'pedir') {
        const abierta = S().compras.find((c) => (c.estado === 'bor' || c.estado === 'env') && c.lineas.some((l) => l.p === p.id));
        if (abierta) { toast('Ya hay una orden abierta con este producto: ' + abierta.ref); return go('#/compras/' + abierta.id); }
        const c = nuevaCompra(p.prov, [{ p: p.id, q: Math.max(40, p.min * 3), cu: p.costo }]);
        E.save(); toast('Orden ' + c.ref + ' creada en borrador'); return go('#/compras/' + c.id);
      }
      if (b.dataset.a === 'transferir') {
        const r = await E.modal({
          titulo: 'Transferir entre almacenes',
          html: '<div class="form-grid"><label class="field">Desde<select name="de"><option value="A1">Principal (' + num(E.stock(p.id, 'A1')) + ')</option><option value="A2">Tienda (' + num(E.stock(p.id, 'A2')) + ')</option></select></label>' +
            '<label class="field">Cantidad<input name="q" type="number" min="1" step="1" value="10" required></label></div>',
          ok: 'Transferir',
          validar: (d) => { const q = Number(d.q); if (!(q > 0) || q % 1) return 'Ingresa una cantidad entera.'; if (q > E.stock(p.id, d.de)) return 'No hay suficiente stock en el almacén de origen.'; return ''; }
        });
        if (!r) return;
        const q = Number(r.q), a = r.de === 'A1' ? 'A2' : 'A1', f = Date.now();
        const ref = 'TR-' + E.pad(++S().seq.mov, 5);
        S().movs.push({ f, p: p.id, alm: r.de, q: -q, tipo: 'Transferencia', ref, cu: p.costo }, { f, p: p.id, alm: a, q, tipo: 'Transferencia', ref, cu: p.costo });
        E.save(); toast('Transferencia ' + ref + ' registrada'); return productoPage(id);
      }
      if (b.dataset.a === 'ajustar') {
        const r = await E.modal({
          titulo: 'Ajuste de inventario',
          html: '<div class="form-grid"><label class="field">Almacén<select name="alm"><option value="A1">Principal (' + num(E.stock(p.id, 'A1')) + ')</option><option value="A2">Tienda (' + num(E.stock(p.id, 'A2')) + ')</option></select></label>' +
            '<label class="field">Tipo<select name="tipo"><option value="1">Entrada (+)</option><option value="-1">Salida (−)</option></select></label>' +
            '<label class="field">Cantidad<input name="q" type="number" min="1" step="1" required></label>' +
            '<label class="field">Motivo<select name="mot"><option>Conteo físico</option><option>Merma o producto dañado</option><option>Producto vencido</option><option>Muestra o regalo</option></select></label></div>',
          ok: 'Registrar ajuste',
          validar: (d) => { const q = Number(d.q); if (!(q > 0) || q % 1) return 'Ingresa una cantidad entera.'; if (d.tipo === '-1' && q > E.stock(p.id, d.alm)) return 'La salida es mayor que el stock del almacén.'; return ''; }
        });
        if (!r) return;
        const ref = 'AJ-' + E.pad(++S().seq.mov, 5);
        S().movs.push({ f: Date.now(), p: p.id, alm: r.alm, q: Number(r.q) * Number(r.tipo), tipo: 'Ajuste · ' + r.mot, ref, cu: p.costo });
        E.save(); toast('Ajuste ' + ref + ' registrado'); return productoPage(id);
      }
    });
  }

  function kxLink(ref) {
    if (/^OC-/.test(ref)) { const c = S().compras.find((x) => x.ref === ref); if (c) return '<a href="#/compras/' + c.id + '">' + ref + '</a>'; }
    if (/^[FB]001-/.test(ref)) { const v = S().ventas.find((x) => E.cpeLabel(x) === ref); if (v) return '<a href="#/ventas/' + v.id + '">' + ref + '</a>'; }
    return esc(ref);
  }

  /* ================= CUENTAS POR COBRAR ================= */
  function cobranzas() {
    crumbs([['Cuentas por cobrar']]);
    const T = E.today();
    const docs = S().ventas.filter((v) => v.cpe && v.estado === 'emi').map((v) => ({ v, s: E.saldo(v, E.totalVenta(v).total), d: diasEntre(T, v.vence) })).filter((x) => x.s > 0);
    const tramo = (x) => x.d <= 0 ? 'vig' : x.d <= 15 ? 't1' : x.d <= 30 ? 't2' : 't3';
    const suma = (f) => docs.filter((x) => tramo(x) === f).reduce((a, x) => a + x.s, 0);
    const tot = docs.reduce((a, x) => a + x.s, 0);
    const tr = [['vig', 'Por vencer'], ['t1', 'Vencido 1–15 días'], ['t2', 'Vencido 16–30 días'], ['t3', 'Vencido más de 30 días']];
    lista({
      mod: 'cobranzas', titulo: 'Cuentas por cobrar', sub: 'Saldo total: <b>' + money(tot) + '</b> en ' + docs.length + ' documentos',
      acciones: '<button type="button" class="btn" id="exp-cxc"><i class="ti ti-download" aria-hidden="true"></i> Exportar</button>',
      arriba: '<div class="aging">' + tr.map((t) => { const s = suma(t[0]); return '<div class="aging__item aging__item--' + t[0] + '"><span>' + t[1] + '</span><b>' + money(s) + '</b><i style="width:' + (tot ? Math.round(s / tot * 100) : 0) + '%"></i></div>'; }).join('') + '</div>',
      filtros: () => [{ id: 'todos', label: 'Todos' }].concat(tr.map((t) => ({ id: t[0], label: t[1].replace('Vencido ', ''), n: docs.filter((x) => tramo(x) === t[0]).length }))),
      buscar: 'Buscar cliente o comprobante',
      data: () => docs.slice().sort((a, b) => a.v.vence - b.v.vence),
      filtrar: (x, f) => f === 'todos' || tramo(x) === f,
      texto: (x) => E.cpeLabel(x.v) + ' ' + E.cliente(x.v.cliente).nombre,
      href: (x) => '#/ventas/' + x.v.id,
      cols: [
        { h: 'Comprobante', cls: 'code', v: (x) => E.cpeLabel(x.v) },
        { h: 'Cliente', cls: 'wide', v: (x) => esc(E.cliente(x.v.cliente).nombre) },
        { h: 'Emisión', cls: 'hide-sm', v: (x) => fdate(x.v.cpe.f) },
        { h: 'Vence', v: (x) => fdate(x.v.vence) },
        { h: 'Días', cls: 'num', v: (x) => x.d > 0 ? '<span class="neg">' + x.d + '</span>' : '<span class="muted">' + (x.d === 0 ? 'hoy' : 'en ' + (-x.d)) + '</span>' },
        { h: 'Total', cls: 'num hide-sm', v: (x) => num(E.totalVenta(x.v).total, 2) },
        { h: 'Saldo', cls: 'num', v: (x) => '<b>' + num(x.s, 2) + '</b>' }
      ],
      pie: (rows) => '<tr><td colspan="4">' + rows.length + ' documentos</td><td></td><td class="hide-sm"></td><td class="num"><b>' + num(rows.reduce((a, x) => a + x.s, 0), 2) + '</b></td></tr>',
      despues: () => $('#exp-cxc').addEventListener('click', () => E.csv('cuentas-por-cobrar', [['Comprobante', 'Cliente', 'RUC/DNI', 'Emision', 'Vence', 'Dias vencido', 'Total', 'Saldo']].concat(
        docs.map((x) => { const c = E.cliente(x.v.cliente); return [E.cpeLabel(x.v), c.nombre, c.doc, fdate(x.v.cpe.f), fdate(x.v.vence), Math.max(0, x.d), E.totalVenta(x.v).total.toFixed(2), x.s.toFixed(2)]; }))))
    });
  }

  /* ================= CAJA Y BANCOS ================= */
  function caja() {
    crumbs([['Caja y bancos']]);
    const ui = UI.caja;
    const now = new Date(E.today());
    const mesIni = new Date(now.getFullYear(), now.getMonth(), 1).getTime();
    const cards = D.CUENTAS.map((c) => {
      const mes = S().caja.filter((m) => m.cta === c.id && m.f >= mesIni);
      const ing = mes.filter((m) => m.monto > 0).reduce((a, m) => a + m.monto, 0);
      const egr = mes.filter((m) => m.monto < 0).reduce((a, m) => a - m.monto, 0);
      return '<button type="button" class="acct' + (ui.f === c.id ? ' is-on' : '') + '" data-f="' + c.id + '"><span class="acct__name"><i class="ti ' + c.icon + '" aria-hidden="true"></i>' + esc(c.nombre) + '</span>' +
        '<span class="acct__num">' + esc(c.tipo) + '</span><b>' + money(E.saldoCuenta(c.id)) + '</b>' +
        '<span class="acct__mes"><span class="pos">+' + num(ing, 2) + '</span><span class="neg">−' + num(egr, 2) + '</span> este mes</span></button>';
    }).join('');
    const totalDisp = D.CUENTAS.reduce((a, c) => a + E.saldoCuenta(c.id), 0);
    const refresh = lista({
      mod: 'caja', titulo: 'Caja y bancos', sub: 'Disponible total: <b>' + money(totalDisp) + '</b>',
      acciones: '<button type="button" class="btn btn--primary" id="new-mov"><i class="ti ti-plus" aria-hidden="true"></i> Nuevo movimiento</button>',
      arriba: '<div class="accts">' + cards + '</div>',
      filtros: () => [{ id: 'todas', label: 'Todas las cuentas' }].concat(D.CUENTAS.map((c) => ({ id: c.id, label: c.nombre.split(' ')[0] === 'Caja' ? 'Caja' : c.nombre.split(' ')[0] }))),
      buscar: 'Buscar concepto',
      data: () => {
        const bal = {};
        return S().caja.slice().sort((a, b) => a.f - b.f || a.id - b.id).map((m) => { bal[m.cta] = E.round2((bal[m.cta] || 0) + m.monto); return Object.assign({ bal: bal[m.cta] }, m); }).reverse();
      },
      filtrar: (m, f) => f === 'todas' || m.cta === f,
      texto: (m) => m.concepto + ' ' + E.cuenta(m.cta).nombre,
      cols: [
        { h: 'Fecha', v: (m) => fdate(m.f) + ' <span class="muted">' + ftime(m.f) + '</span>' },
        { h: 'Cuenta', cls: 'hide-sm', v: (m) => esc(E.cuenta(m.cta).nombre) },
        { h: 'Concepto', cls: 'wide', v: (m) => movLink(m) },
        { h: 'Ingreso', cls: 'num pos', v: (m) => m.monto > 0 ? num(m.monto, 2) : '' },
        { h: 'Egreso', cls: 'num neg', v: (m) => m.monto < 0 ? num(-m.monto, 2) : '' },
        { h: 'Saldo de la cuenta', cls: 'num hide-sm', v: (m) => num(m.bal, 2) }
      ],
      despues: (rf) => {
        $$('.acct', view()).forEach((b) => b.addEventListener('click', () => {
          ui.f = ui.f === b.dataset.f ? 'todas' : b.dataset.f; ui.page = 0;
          $$('.acct').forEach((x) => x.classList.toggle('is-on', x.dataset.f === ui.f));
          $$('.seg__btn[data-f]').forEach((x) => x.classList.toggle('is-on', x.dataset.f === ui.f));
          rf();
        }));
        $$('.seg__btn[data-f]', view()).forEach((b) => b.addEventListener('click', () => $$('.acct').forEach((x) => x.classList.toggle('is-on', x.dataset.f === ui.f))));
        $('#new-mov').addEventListener('click', nuevoMovimiento);
      }
    });
    return refresh;
  }

  function movLink(m) {
    const t = esc(m.concepto);
    if (!m.ref) return t;
    if (m.ref[0] === 'V') return '<a href="#/ventas/' + m.ref + '">' + t + '</a>';
    if (m.ref[0] === 'C') return '<a href="#/compras/' + m.ref + '">' + t + '</a>';
    return t;
  }

  async function nuevoMovimiento() {
    const r = await E.modal({
      titulo: 'Nuevo movimiento',
      html: '<div class="form-grid"><label class="field">Tipo<select name="tipo"><option value="egr">Egreso (gasto)</option><option value="ing">Ingreso</option><option value="tr">Transferencia entre cuentas</option></select></label>' +
        '<label class="field">Cuenta<select name="cta">' + opciones(D.CUENTAS, 'caja') + '</select></label>' +
        '<label class="field" data-dest hidden>Hacia la cuenta<select name="dest">' + opciones(D.CUENTAS, 'bcp') + '</select></label>' +
        '<label class="field">Monto<input name="monto" type="number" step="0.01" min="0.01" required></label>' +
        '<label class="field field--full">Concepto<input name="concepto" placeholder="Ej. Compra de útiles de oficina"></label></div>',
      ok: 'Registrar',
      init: (form) => {
        const t = form.querySelector('[name=tipo]');
        t.addEventListener('change', () => { form.querySelector('[data-dest]').hidden = t.value !== 'tr'; });
      },
      validar: (d) => {
        const m = Number(d.monto);
        if (!(m > 0)) return 'Ingresa un monto mayor a cero.';
        if (d.tipo !== 'tr' && !d.concepto.trim()) return 'Escribe el concepto.';
        if (d.tipo === 'tr' && d.cta === d.dest) return 'Elige dos cuentas diferentes.';
        if (d.tipo !== 'ing' && m > E.saldoCuenta(d.cta) + 0.001) return 'La cuenta no tiene saldo suficiente (' + money(E.saldoCuenta(d.cta)) + ').';
        return '';
      }
    });
    if (!r) return;
    const m = E.round2(Number(r.monto)), f = Date.now(), st = S();
    if (r.tipo === 'tr') {
      st.caja.push({ id: ++st.seq.mov, f, cta: r.cta, monto: -m, concepto: 'Transferencia a ' + E.cuenta(r.dest).nombre, ref: '' });
      st.caja.push({ id: ++st.seq.mov, f, cta: r.dest, monto: m, concepto: 'Transferencia desde ' + E.cuenta(r.cta).nombre, ref: '' });
    } else {
      st.caja.push({ id: ++st.seq.mov, f, cta: r.cta, monto: r.tipo === 'ing' ? m : -m, concepto: r.concepto.trim(), ref: '' });
    }
    E.save(); toast('Movimiento registrado'); caja();
  }

  /* ================= CONTACTOS ================= */
  function contactos(id) {
    if (id) return contactoPage(id);
    crumbs([['Clientes y proveedores']]);
    const ui = UI.contactos;
    const saldoC = (c) => S().ventas.filter((v) => v.cliente === c.id && v.estado === 'emi').reduce((a, v) => a + Math.max(0, E.saldo(v, E.totalVenta(v).total)), 0);
    const saldoP = (c) => S().compras.filter((x) => x.prov === c.id && x.estado === 'rec').reduce((a, x) => a + Math.max(0, E.saldo(x, E.totalCompra(x).total)), 0);
    lista({
      mod: 'contactos', titulo: 'Clientes y proveedores',
      acciones: '<button type="button" class="btn btn--primary" id="new-ct"><i class="ti ti-plus" aria-hidden="true"></i> Nuevo</button>',
      filtros: () => [{ id: 'clientes', label: 'Clientes', n: S().clientes.length }, { id: 'proveedores', label: 'Proveedores', n: S().proveedores.length }],
      buscar: 'Buscar nombre, RUC o DNI',
      data: () => (ui.f === 'clientes' ? S().clientes : S().proveedores),
      texto: (c) => c.nombre + ' ' + c.doc + ' ' + c.dist,
      href: (c) => '#/contactos/' + c.id,
      cols: [
        { h: 'Nombre o razón social', cls: 'wide', v: (c) => '<span class="strong">' + esc(c.nombre) + '</span>' },
        { h: 'RUC / DNI', cls: 'code', v: (c) => c.doc },
        { h: 'Distrito', cls: 'hide-sm', v: (c) => esc(c.dist) },
        { h: 'Teléfono', cls: 'hide-md', v: (c) => esc(c.tel) },
        { h: 'Condición', cls: 'hide-md', v: (c) => esc(E.cond(c.cond).nombre) },
        { h: 'Saldo', cls: 'num', v: (c) => { const s = c.id[0] === 'C' ? saldoC(c) : saldoP(c); return s > 0 ? '<b>' + num(s, 2) + '</b>' : '<span class="muted">0.00</span>'; } }
      ],
      despues: (refresh) => {
        $$('.seg__btn[data-f]', view()).forEach((b) => b.addEventListener('click', refresh));
        $('#new-ct').addEventListener('click', nuevoContacto);
      }
    });
  }

  async function nuevoContacto() {
    const r = await E.modal({
      titulo: 'Nuevo contacto',
      html: '<div class="form-grid"><label class="field">Tipo<select name="tipo"><option value="C"' + (UI.contactos.f === 'clientes' ? ' selected' : '') + '>Cliente</option><option value="R"' + (UI.contactos.f === 'proveedores' ? ' selected' : '') + '>Proveedor</option></select></label>' +
        '<label class="field">RUC o DNI<input name="doc" inputmode="numeric" maxlength="11" required placeholder="20XXXXXXXXX"></label>' +
        '<label class="field field--full">Nombre o razón social<input name="nombre" required></label>' +
        '<label class="field field--full">Dirección<input name="dir"></label>' +
        '<label class="field">Distrito<input name="dist"></label>' +
        '<label class="field">Teléfono<input name="tel" inputmode="tel"></label>' +
        '<label class="field field--full">Condición de pago<select name="cond">' + opciones(D.CONDICIONES, 'contado') + '</select></label></div>',
      ok: 'Crear contacto',
      validar: (d) => {
        const doc = d.doc.trim();
        if (!/^\d{8}$/.test(doc) && !E.esRuc(doc)) return 'El DNI tiene 8 dígitos y el RUC 11 (empieza con 10 o 20).';
        if (d.tipo === 'R' && !E.esRuc(doc)) return 'Un proveedor necesita RUC.';
        const lista = d.tipo === 'C' ? S().clientes : S().proveedores;
        if (lista.some((x) => x.doc === doc)) return 'Ya existe un contacto con ese documento.';
        if (!d.nombre.trim()) return 'Escribe el nombre o la razón social.';
        return '';
      }
    });
    if (!r) return;
    const lista = r.tipo === 'C' ? S().clientes : S().proveedores;
    const c = { id: r.tipo + E.pad(lista.length + 1, 2), nombre: r.nombre.trim(), doc: r.doc.trim(), dir: r.dir.trim() || '—', dist: r.dist.trim() || '—', tel: r.tel.trim(), cond: r.cond };
    lista.push(c);
    E.save(); toast('Contacto creado'); go('#/contactos/' + c.id);
  }

  function contactoPage(id) {
    const esCli = id[0] === 'C';
    const c = esCli ? E.cliente(id) : E.proveedor(id);
    if (!c) { view().innerHTML = '<div class="sheet empty-page"><p>No encontramos ese contacto.</p><a class="btn" href="#/contactos">Volver</a></div>'; return; }
    crumbs([['Clientes y proveedores', '#/contactos'], [c.nombre]]);
    const docs = esCli ? S().ventas.filter((v) => v.cliente === id) : S().compras.filter((x) => x.prov === id);
    docs.sort((a, b) => b.fecha - a.fecha);
    const anio = new Date(new Date().getFullYear(), 0, 1).getTime();
    const tf = esCli ? E.totalVenta : E.totalCompra;
    const valid = docs.filter((d) => esCli ? (d.cpe && d.estado !== 'anu') : (d.estado === 'rec'));
    const totAnio = valid.filter((d) => (esCli ? d.cpe.f : d.fecha) >= anio).reduce((a, d) => a + tf(d).total, 0);
    const sal = valid.filter((d) => d.estado === (esCli ? 'emi' : 'rec')).reduce((a, d) => a + Math.max(0, E.saldo(d, tf(d).total)), 0);
    const ult = docs.find((d) => d.estado !== 'anu');

    view().innerHTML =
      '<div class="cp"><div class="cp__row"><div class="cp__title"><p class="form-head__kind">' + (esCli ? 'Cliente' : 'Proveedor') + ' · ' + (E.esRuc(c.doc) ? 'RUC ' : 'DNI ') + c.doc + '</p><h1>' + esc(c.nombre) + '</h1><p>' + esc(c.dir + ', ' + c.dist) + (c.tel ? ' · ' + esc(c.tel) : '') + '</p></div>' +
      '<div class="cp__actions">' + (esCli ? '<button type="button" class="btn btn--primary" id="ct-new"><i class="ti ti-plus" aria-hidden="true"></i> Nueva venta</button>' : '<button type="button" class="btn btn--primary" id="ct-new"><i class="ti ti-plus" aria-hidden="true"></i> Nueva orden de compra</button>') + '</div></div></div>' +
      '<div class="stats">' +
        '<div><span>' + (esCli ? 'Compras este año' : 'Comprado este año') + '</span><b>' + money(totAnio) + '</b></div>' +
        '<div><span>' + (esCli ? 'Saldo por cobrar' : 'Saldo por pagar') + '</span><b class="' + (sal > 0 ? 'neg' : '') + '">' + money(sal) + '</b></div>' +
        '<div><span>Condición</span><b>' + esc(E.cond(c.cond).nombre) + '</b></div>' +
        '<div><span>Último documento</span><b>' + (ult ? fdate(ult.fecha) : '—') + '</b></div>' +
      '</div>' +
      '<div class="sheet sheet--list"><div class="sheet__head sheet__head--pad"><h2>Documentos</h2><span class="muted">' + docs.length + '</span></div><div class="table-wrap"><table class="table table--link"><thead><tr><th>Número</th>' + (esCli ? '<th>Comprobante</th>' : '<th class="hide-sm">Fact. proveedor</th>') + '<th>Fecha</th><th class="num">Total</th><th class="num hide-sm">Saldo</th><th>Estado</th></tr></thead><tbody>' +
        (docs.length ? docs.slice(0, 50).map((d) => {
          const t = tf(d).total;
          const s = (esCli ? d.cpe && d.estado === 'emi' : d.estado === 'rec') ? E.saldo(d, t) : 0;
          return '<tr data-href="#/' + (esCli ? 'ventas/' : 'compras/') + d.id + '" tabindex="0"><td class="code">' + d.ref + '</td><td class="code' + (esCli ? '' : ' hide-sm') + '">' + (esCli ? E.cpeLabel(d) : d.factProv) + '</td><td>' + fdate(d.fecha) + '</td><td class="num">' + num(t, 2) + '</td><td class="num hide-sm">' + (s > 0 ? '<b>' + num(s, 2) + '</b>' : '') + '</td><td>' + (esCli ? pill(E.ESTADOS_VENTA, E.ventaEstado(d)) : pill(E.ESTADOS_COMPRA, E.compraEstado(d))) + '</td></tr>';
        }).join('') : '<tr class="table__empty"><td colspan="6">Todavía no hay documentos.</td></tr>') +
      '</tbody></table></div></div>';
    bindRowLinks(view());
    $('#ct-new').addEventListener('click', () => {
      if (esCli) { const v = nuevaVenta(c.id); go('#/ventas/' + v.id); }
      else { const o = nuevaCompra(c.id); E.save(); go('#/compras/' + o.id); }
    });
  }

  /* ================= REPORTES ================= */
  function reportes() {
    crumbs([['Reportes']]);
    const ui = UI.reportes;
    const now = new Date(E.today());
    const per = {
      mes: ['Este mes', new Date(now.getFullYear(), now.getMonth(), 1).getTime(), Infinity],
      ant: ['Mes anterior', new Date(now.getFullYear(), now.getMonth() - 1, 1).getTime(), new Date(now.getFullYear(), now.getMonth(), 1).getTime()],
      t3: ['Últimos 3 meses', new Date(now.getFullYear(), now.getMonth() - 2, 1).getTime(), Infinity],
      t6: ['Últimos 6 meses', new Date(now.getFullYear(), now.getMonth() - 5, 1).getTime(), Infinity]
    };
    const [, a, b] = per[ui.per];
    const docs = S().ventas.filter((v) => v.cpe && v.estado !== 'anu' && v.cpe.f >= a && v.cpe.f < b);
    const tabs = [['producto', 'Por producto'], ['cliente', 'Por cliente'], ['vendedor', 'Por vendedor'], ['mes', 'Por mes'], ['registro', 'Registro de ventas']];

    // Agregados
    let tv = 0, tc = 0;
    const agg = {};
    function add(key, label, q, venta, costo, extra) {
      const k = agg[key] || (agg[key] = { label, q: 0, venta: 0, costo: 0, n: 0, extra });
      k.q += q; k.venta += venta; k.costo += costo;
    }
    docs.forEach((v) => {
      const seen = {};
      v.lineas.forEach((l) => {
        const p = E.producto(l.p);
        const venta = l.q * l.pu * (1 - (l.d || 0) / 100) / (1 + E.IGV);
        const costo = l.q * p.costo / (1 + E.IGV);
        tv += venta; tc += costo;
        let key, label, extra = '';
        if (ui.tab === 'producto') { key = p.id; label = p.nombre; extra = p.pres; }
        else if (ui.tab === 'cliente') { const c = E.cliente(v.cliente); key = c.id; label = c.nombre; extra = c.doc; }
        else if (ui.tab === 'vendedor') { key = v.vend; label = v.vend; }
        else { const d = new Date(v.cpe.f); key = d.getFullYear() * 100 + d.getMonth(); label = E.MESES[d.getMonth()] + ' ' + d.getFullYear(); }
        if (ui.tab !== 'registro') {
          add(key, label, ui.tab === 'producto' ? l.q : 0, venta, costo, extra);
          if (!seen[key]) { agg[key].n++; seen[key] = 1; }
        }
      });
    });
    const util = tv - tc;

    let tabla = '', filasCsv = [];
    if (ui.tab === 'registro') {
      const rows = docs.slice().sort((x, y) => x.cpe.f - y.cpe.f);
      const rt = rows.reduce((acc, v) => { const t = E.totalVenta(v); acc.g += t.gravada; acc.i += t.igv; acc.t += t.total; return acc; }, { g: 0, i: 0, t: 0 });
      tabla = '<table class="table table--link"><thead><tr><th>Fecha</th><th>Tipo</th><th>Serie-número</th><th class="hide-sm">Doc. cliente</th><th>Cliente</th><th class="num hide-sm">Op. gravada</th><th class="num hide-sm">IGV</th><th class="num">Total</th></tr></thead><tbody>' +
        rows.map((v) => { const t = E.totalVenta(v); const c = E.cliente(v.cliente); return '<tr data-href="#/ventas/' + v.id + '" tabindex="0"><td>' + fdate(v.cpe.f) + '</td><td>' + (v.cpe.serie[0] === 'F' ? '01' : '03') + '</td><td class="code">' + E.cpeLabel(v) + '</td><td class="code hide-sm">' + c.doc + '</td><td>' + esc(c.nombre) + '</td><td class="num hide-sm">' + num(t.gravada, 2) + '</td><td class="num hide-sm">' + num(t.igv, 2) + '</td><td class="num">' + num(t.total, 2) + '</td></tr>'; }).join('') +
        '</tbody><tfoot><tr><td colspan="5">' + rows.length + ' comprobantes</td><td class="num hide-sm"><b>' + num(rt.g, 2) + '</b></td><td class="num hide-sm"><b>' + num(rt.i, 2) + '</b></td><td class="num"><b>' + num(rt.t, 2) + '</b></td></tr></tfoot></table>';
      filasCsv = [['Fecha', 'Tipo', 'Serie-numero', 'Doc. cliente', 'Cliente', 'Op. gravada', 'IGV', 'Total']].concat(rows.map((v) => { const t = E.totalVenta(v); const c = E.cliente(v.cliente); return [fdate(v.cpe.f), v.cpe.serie[0] === 'F' ? '01' : '03', E.cpeLabel(v), c.doc, c.nombre, t.gravada.toFixed(2), t.igv.toFixed(2), t.total.toFixed(2)]; }));
    } else {
      const keys = Object.keys(agg);
      if (ui.tab === 'mes') keys.sort((x, y) => Number(x) - Number(y));
      const rows = keys.map((k) => agg[k]);
      if (ui.tab !== 'mes') rows.sort((x, y) => y.venta - x.venta);
      const max = rows.reduce((m, r) => Math.max(m, r.venta), 1);
      const conQ = ui.tab === 'producto';
      tabla = '<table class="table"><thead><tr><th>' + tabs.find((t) => t[0] === ui.tab)[1].replace('Por ', '').replace(/^./, (x) => x.toUpperCase()) + '</th>' + (conQ ? '<th class="num">Cantidad</th>' : '<th class="num">Comprobantes</th>') + '<th class="num">Venta neta</th><th class="num hide-sm">Costo</th><th class="num">Utilidad</th><th class="num hide-sm">Margen</th><th class="hide-md">Participación</th></tr></thead><tbody>' +
        rows.map((r) => '<tr><td><span class="strong">' + esc(r.label) + '</span>' + (r.extra ? '<small>' + esc(r.extra) + '</small>' : '') + '</td><td class="num">' + num(conQ ? r.q : r.n) + '</td><td class="num">' + num(r.venta, 2) + '</td><td class="num hide-sm">' + num(r.costo, 2) + '</td><td class="num"><b>' + num(r.venta - r.costo, 2) + '</b></td><td class="num hide-sm">' + num(r.venta ? (r.venta - r.costo) / r.venta * 100 : 0, 1) + '%</td><td class="hide-md"><span class="share"><i style="width:' + Math.round(r.venta / max * 100) + '%"></i></span> ' + num(tv ? r.venta / tv * 100 : 0, 1) + '%</td></tr>').join('') +
        (rows.length ? '' : '<tr class="table__empty"><td colspan="7">Sin ventas en este periodo.</td></tr>') +
        '</tbody><tfoot><tr><td>Total</td><td></td><td class="num"><b>' + num(tv, 2) + '</b></td><td class="num hide-sm"><b>' + num(tc, 2) + '</b></td><td class="num"><b>' + num(util, 2) + '</b></td><td class="num hide-sm"><b>' + num(tv ? util / tv * 100 : 0, 1) + '%</b></td><td class="hide-md"></td></tr></tfoot></table>';
      filasCsv = [['Concepto', conQ ? 'Cantidad' : 'Comprobantes', 'Venta neta', 'Costo', 'Utilidad', 'Margen %']].concat(rows.map((r) => [r.label + (r.extra ? ' ' + r.extra : ''), conQ ? r.q : r.n, r.venta.toFixed(2), r.costo.toFixed(2), (r.venta - r.costo).toFixed(2), (r.venta ? (r.venta - r.costo) / r.venta * 100 : 0).toFixed(1)]));
    }

    view().innerHTML =
      '<div class="cp"><div class="cp__row"><div class="cp__title"><h1>Reportes de ventas</h1><p>Montos sin IGV. Costo según el costo actual del producto.</p></div>' +
      '<div class="cp__actions"><label class="select-sm"><span class="sr">Periodo</span><select id="rp-per">' + Object.keys(per).map((k) => '<option value="' + k + '"' + (ui.per === k ? ' selected' : '') + '>' + per[k][0] + '</option>').join('') + '</select></label>' +
      '<button type="button" class="btn" id="rp-csv"><i class="ti ti-download" aria-hidden="true"></i> Exportar a Excel</button></div></div></div>' +
      '<div class="stats"><div><span>Venta neta</span><b>' + money(tv) + '</b></div><div><span>Costo de ventas</span><b>' + money(tc) + '</b></div><div><span>Utilidad bruta</span><b>' + money(util) + '</b></div><div><span>Margen</span><b>' + num(tv ? util / tv * 100 : 0, 1) + '%</b></div><div><span>Comprobantes</span><b>' + docs.length + '</b></div><div><span>Ticket promedio</span><b>' + money(docs.length ? tv * (1 + E.IGV) / docs.length : 0) + '</b></div></div>' +
      '<div class="sheet sheet--list"><div class="tabs-line">' + tabs.map((t) => '<button type="button" class="' + (ui.tab === t[0] ? 'is-on' : '') + '" data-tab="' + t[0] + '">' + t[1] + '</button>').join('') + '</div><div class="table-wrap">' + tabla + '</div></div>';

    bindRowLinks(view());
    $('#rp-per').addEventListener('change', (e) => { ui.per = e.target.value; reportes(); });
    $$('[data-tab]', view()).forEach((bt) => bt.addEventListener('click', () => { ui.tab = bt.dataset.tab; reportes(); }));
    $('#rp-csv').addEventListener('click', () => E.csv('reporte-' + ui.tab + '-' + ui.per, filasCsv));
  }

  window.ERP_VISTAS = { inicio, ventas, compras, inventario, cobranzas, caja, contactos, reportes, UI };
})();
