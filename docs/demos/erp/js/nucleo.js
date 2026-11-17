/* Núcleo del ERP demo: estado, datos de prueba, cálculos y utilidades de interfaz. */
(function () {
  'use strict';

  const D = window.ERP_DATA;
  const STORE_KEY = 'rratsoft-erp-demo-v1';
  const IGV = 0.18;
  const DAY = 86400000;

  /* ---------- Formatos ---------- */
  const money = (n) => 'S/ ' + (Number(n) || 0).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  const num = (n, d = 0) => (Number(n) || 0).toLocaleString('en-US', { minimumFractionDigits: d, maximumFractionDigits: d });
  const pad = (n, l) => String(n).padStart(l, '0');
  const dayStart = (t) => { const d = new Date(t); d.setHours(0, 0, 0, 0); return d.getTime(); };
  const today = () => dayStart(Date.now());
  const fdate = (t) => { const d = new Date(t); return pad(d.getDate(), 2) + '/' + pad(d.getMonth() + 1, 2) + '/' + d.getFullYear(); };
  const ftime = (t) => { const d = new Date(t); return pad(d.getHours(), 2) + ':' + pad(d.getMinutes(), 2); };
  const MESES = ['enero', 'febrero', 'marzo', 'abril', 'mayo', 'junio', 'julio', 'agosto', 'septiembre', 'octubre', 'noviembre', 'diciembre'];
  const MES_C = ['Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun', 'Jul', 'Ago', 'Set', 'Oct', 'Nov', 'Dic'];
  const esc = (s) => String(s == null ? '' : s).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  const round2 = (n) => Math.round(n * 100) / 100;

  /* ---------- Búsquedas en datos fijos ---------- */
  const byId = (list, id) => list.find((x) => x.id === id);
  const metodo = (id) => byId(D.METODOS, id) || D.METODOS[0];
  const cond = (id) => byId(D.CONDICIONES, id) || D.CONDICIONES[0];
  const cuenta = (id) => byId(D.CUENTAS, id);
  const almacen = (id) => byId(D.ALMACENES, id);

  let S = null; // estado

  const producto = (id) => byId(S.productos, id);
  const cliente = (id) => byId(S.clientes, id);
  const proveedor = (id) => byId(S.proveedores, id);
  const esRuc = (doc) => /^(10|20)\d{9}$/.test(doc || '');

  /* ---------- Cálculos ---------- */
  function totales(lineas, campo) {
    let total = 0;
    (lineas || []).forEach((l) => { total += (Number(l.q) || 0) * (Number(l[campo]) || 0) * (1 - (Number(l.d) || 0) / 100); });
    total = round2(total);
    const gravada = round2(total / (1 + IGV));
    return { total, gravada, igv: round2(total - gravada) };
  }
  const totalVenta = (v) => totales(v.lineas, 'pu');
  const totalCompra = (c) => totales(c.lineas, 'cu');
  const pagado = (doc) => round2((doc.pagos || []).reduce((a, p) => a + p.monto, 0));
  const saldo = (doc, tot) => round2(tot - pagado(doc));

  function stock(pid, alm) {
    let s = 0;
    for (const m of S.movs) if (m.p === pid && (!alm || m.alm === alm)) s += m.q;
    return s;
  }
  function stockMap() {
    const map = {};
    for (const m of S.movs) {
      const k = map[m.p] || (map[m.p] = { A1: 0, A2: 0, total: 0 });
      k[m.alm] += m.q; k.total += m.q;
    }
    return map;
  }
  function saldoCuenta(id) {
    let s = 0;
    for (const m of S.caja) if (m.cta === id) s += m.monto;
    return round2(s);
  }

  function cpeLabel(v) { return v.cpe ? v.cpe.serie + '-' + pad(v.cpe.num, 8) : ''; }
  function ventaEstado(v) {
    if (v.estado === 'emi') {
      const tot = totalVenta(v).total;
      if (saldo(v, tot) <= 0) return 'pag';
      if (v.vence < today()) return 'ven';
    }
    return v.estado;
  }
  const ESTADOS_VENTA = {
    cot: ['Cotización', 'gray'], ped: ['Pedido', 'blue'], emi: ['Por cobrar', 'amber'],
    ven: ['Vencido', 'red'], pag: ['Cobrado', 'green'], anu: ['Anulado', 'muted']
  };
  const ESTADOS_COMPRA = {
    bor: ['Borrador', 'gray'], env: ['Enviada', 'blue'], rec: ['Por pagar', 'amber'],
    pag: ['Pagada', 'green'], anu: ['Anulada', 'muted']
  };
  function compraEstado(c) {
    if (c.estado === 'rec' && saldo(c, totalCompra(c).total) <= 0) return 'pag';
    return c.estado;
  }
  const pill = (map, k) => '<span class="pill pill--' + map[k][1] + '">' + map[k][0] + '</span>';

  /* ---------- Generador de datos de prueba (6 meses) ---------- */
  function rng(seed) {
    return function () {
      seed |= 0; seed = (seed + 0x6D2B79F5) | 0;
      let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
      t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
      return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    };
  }

  function seed() {
    const R = rng(20261116);
    const ri = (a, b) => a + Math.floor(R() * (b - a + 1));
    const pick = (arr) => arr[Math.floor(R() * arr.length)];
    const T0 = today();
    const START = T0 - 182 * DAY;

    const st = {
      v: 1, creado: T0,
      productos: D.PRODUCTOS.map((p) => Object.assign({}, p)),
      clientes: D.CLIENTES.map((c) => Object.assign({}, c)),
      proveedores: D.PROVEEDORES.map((c) => Object.assign({}, c)),
      ventas: [], compras: [], movs: [], caja: [],
      seq: { ped: 0, F001: 0, B001: 0, oc: 0, mov: 0 }
    };
    S = st;

    const at = (day, h, m) => day + (h * 60 + m) * 60000;
    const addMov = (f, p, alm, q, tipo, ref, cu) => st.movs.push({ f, p, alm, q, tipo, ref, cu });
    const addCaja = (f, cta, monto, concepto, ref) => st.caja.push({ id: ++st.seq.mov, f, cta, monto: round2(monto), concepto, ref: ref || '' });

    // Saldos iniciales
    D.CUENTAS.forEach((c) => addCaja(START - DAY, c.id, c.inicial, 'Saldo inicial', ''));

    // Stock inicial
    const stk = { A1: {}, A2: {} };
    st.productos.forEach((p) => {
      const a1 = ri(55, 95), a2 = ri(8, 18);
      stk.A1[p.id] = a1; stk.A2[p.id] = a2;
      addMov(START - DAY, p.id, 'A1', a1, 'Inventario inicial', 'INV-0001', p.costo);
      addMov(START - DAY, p.id, 'A2', a2, 'Inventario inicial', 'INV-0001', p.costo);
    });

    // Productos que terminarán con stock bajo (no se reponen el último mes)
    const bajos = ['P006', 'P013', 'P016', 'P019'];
    const pendientes = {}; // productos con OC en camino
    const llegadas = [];   // {dia, oc}

    function nuevaVenta(dia, opts) {
      const c = opts.cliente || pick(st.clientes);
      const alm = R() < 0.85 ? 'A1' : 'A2';
      const nl = ri(1, 4);
      const lineas = [];
      const usados = new Set();
      for (let i = 0; i < nl; i++) {
        const p = pick(st.productos);
        if (usados.has(p.id)) continue;
        usados.add(p.id);
        let q = alm === 'A1' ? ri(2, 14) : ri(1, 4);
        if (opts.checkStock) {
          q = Math.min(q, stk[alm][p.id]);
          if (q <= 0) continue;
        }
        const d = c.cond !== 'contado' && q >= 10 && R() < 0.4 ? 3 : 0;
        lineas.push({ p: p.id, q, pu: p.precio, d });
      }
      if (!lineas.length) return null;
      const slot = opts.slot || [8, 18];
      const mins = ri(slot[0] * 60, slot[1] * 60 - 1);
      const h = Math.floor(mins / 60), m = mins % 60;
      const v = {
        id: 'V' + pad(++st.seq.ped, 5),
        ref: 'P-' + pad(st.seq.ped, 5),
        fecha: at(dia, h, m), cliente: c.id, vend: pick(D.VENDEDORES),
        cond: c.cond, alm, lineas, pagos: [], estado: 'ped', vence: dia,
        log: [{ f: at(dia, h, m), u: pick(D.VENDEDORES), t: 'Creó la cotización' }]
      };
      st.ventas.push(v);
      return v;
    }

    function emitir(v, f) {
      const c = cliente(v.cliente);
      const serie = esRuc(c.doc) ? 'F001' : 'B001';
      v.cpe = { serie, num: ++st.seq[serie], f, hash: hashCode(serie + st.seq[serie]) };
      v.estado = 'emi';
      v.vence = dayStart(f) + cond(v.cond).dias * DAY;
      v.lineas.forEach((l) => {
        stk[v.alm][l.p] -= l.q;
        addMov(f, l.p, v.alm, -l.q, 'Venta', cpeLabel(v), producto(l.p).costo);
      });
      v.log.push({ f, u: v.vend, t: (serie === 'F001' ? 'Emitió la factura ' : 'Emitió la boleta ') + cpeLabel(v) + '. SUNAT: aceptado' });
    }

    function cobrar(v, f, monto, metId) {
      const met = metodo(metId);
      v.pagos.push({ f, monto: round2(monto), met: met.id });
      addCaja(f, met.cuenta, monto, 'Cobro ' + cpeLabel(v), v.id);
      v.log.push({ f, u: 'Rosa Medina', t: 'Registró cobro de ' + money(monto) + ' (' + met.nombre + ')' });
    }

    function nuevaCompra(dia, provId, lineas) {
      const pr = proveedor(provId);
      const c = {
        id: 'C' + pad(++st.seq.oc, 5),
        ref: 'OC-' + pad(st.seq.oc, 5),
        fecha: at(dia, ri(9, 12), ri(0, 59)), prov: provId, alm: 'A1',
        cond: pr.cond, lineas, pagos: [], estado: 'env', factProv: '', vence: 0,
        log: []
      };
      c.log.push({ f: c.fecha, u: 'Rosa Medina', t: 'Envió la orden de compra al proveedor' });
      st.compras.push(c);
      return c;
    }

    function recibir(c, f) {
      c.estado = 'rec';
      c.factProv = 'F0' + ri(10, 99) + '-' + pad(ri(1000, 99999), 8);
      c.recibido = f;
      c.vence = dayStart(f) + cond(c.cond).dias * DAY;
      c.lineas.forEach((l) => {
        stk[c.alm][l.p] += l.q;
        addMov(f, l.p, c.alm, l.q, 'Compra', c.ref, l.cu);
        delete pendientes[l.p];
      });
      c.log.push({ f, u: 'Jorge Huanca', t: 'Recibió la mercadería en almacén. Factura del proveedor ' + c.factProv });
    }

    function pagarCompra(c, f) {
      const tot = totalCompra(c).total;
      c.pagos.push({ f, monto: tot, met: 'transf_bcp' });
      addCaja(f, 'bcp', -tot, 'Pago ' + c.ref + ' · ' + proveedor(c.prov).nombre, c.id);
      c.log.push({ f, u: 'Rosa Medina', t: 'Registró pago de ' + money(tot) + ' (Transferencia BCP)' });
    }

    const pagosProgramados = []; // {dia, doc, tipo}

    for (let dia = START; dia <= T0; dia += DAY) {
      const dow = new Date(dia).getDay();
      const diasAtras = Math.round((T0 - dia) / DAY);

      // Llegadas de mercadería
      for (let i = llegadas.length - 1; i >= 0; i--) {
        if (llegadas[i].dia <= dia) { recibir(llegadas[i].oc, at(dia, 7, ri(30, 55))); llegadas.splice(i, 1); }
      }

      // Pagos programados (cobros de crédito y pagos a proveedores)
      for (let i = pagosProgramados.length - 1; i >= 0; i--) {
        const pg = pagosProgramados[i];
        if (pg.dia <= dia) {
          if (pg.tipo === 'venta') cobrar(pg.doc, at(dia, 7, ri(0, 25)), saldo(pg.doc, totalVenta(pg.doc).total), pick(['transf_bcp', 'transf_bcp', 'transf_ibk', 'yape']));
          else pagarCompra(pg.doc, at(dia, 7, ri(26, 29)));
          pagosProgramados.splice(i, 1);
        }
      }

      // Gastos fijos del mes
      const dm = new Date(dia).getDate();
      D.GASTOS.forEach((g) => { if (g.dia === dm) addCaja(at(dia, 9, 30), g.cuenta, -g.monto, g.concepto, ''); });
      if (dow === 6) {
        addCaja(at(dia, 20, 10), 'caja', -ri(280, 360), 'Combustible de reparto', '');
        // Depósito semanal del efectivo al banco (se queda un fondo de caja)
        const enCaja = st.caja.filter((x) => x.cta === 'caja').reduce((a, x) => a + x.monto, 0);
        if (enCaja > 5000) {
          const dep = Math.floor((enCaja - 3500) / 100) * 100;
          addCaja(at(dia, 20, 30), 'caja', -dep, 'Depósito en BCP', '');
          addCaja(at(dia, 20, 30), 'bcp', dep, 'Depósito de efectivo de caja', '');
        }
      }
      if (dm === 15) {
        const enIbk = st.caja.filter((x) => x.cta === 'ibk').reduce((a, x) => a + x.monto, 0);
        if (enIbk > 30000) {
          const tr = Math.floor((enIbk - 18000) / 1000) * 1000;
          addCaja(at(dia, 7, 40), 'ibk', -tr, 'Transferencia a BCP Cta. Cte.', '');
          addCaja(at(dia, 7, 40), 'bcp', tr, 'Transferencia desde Interbank', '');
        }
      }

      if (dow === 0) continue; // domingo cerrado

      // Ventas del día (sube un poco con el tiempo)
      const nVentas = ri(2, 4) + (diasAtras < 60 ? 1 : 0);
      for (let i = 0; i < nVentas; i++) {
        const span = 10 / nVentas;
        const v = nuevaVenta(dia, { checkStock: true, slot: [8 + i * span, 8 + (i + 1) * span - 0.9] });
        if (!v) continue;
        v.log.push({ f: v.fecha + 60000 * ri(5, 40), u: v.vend, t: 'Confirmó el pedido' });

        if (diasAtras === 0 && i >= nVentas - 2) {
          // Hoy: pedidos aún sin facturar
          continue;
        }
        if (diasAtras <= 2 && i === 0) { v.estado = 'cot'; v.log.pop(); continue; }
        if (R() < 0.015) {
          v.estado = 'anu';
          v.log.push({ f: v.fecha + 3600000, u: 'Rosa Medina', t: 'Anuló el pedido: el cliente canceló' });
          continue;
        }
        emitir(v, v.fecha + 60000 * ri(45, 120));
        const tot = totalVenta(v).total;
        if (v.cond === 'contado') {
          cobrar(v, v.cpe.f + 60000 * ri(1, 20), tot, pick(['efectivo', 'efectivo', 'yape', 'plin', 'transf_bcp']));
        } else {
          const dias = cond(v.cond).dias;
          let cuando = dia + ri(Math.max(3, dias - 10), dias + 3) * DAY;
          // Algunos clientes se atrasan
          if (diasAtras < 70 && R() < 0.18) cuando = T0 + 30 * DAY;
          if (cuando <= T0) pagosProgramados.push({ dia: cuando, doc: v, tipo: 'venta' });
          // Un adelanto parcial de vez en cuando
          else if (R() < 0.3) cobrar(v, v.cpe.f + DAY, round2(tot * 0.5), 'transf_bcp');
        }
      }

      // Reposición: cuando el stock baja del mínimo se pide al proveedor
      const porProv = {};
      st.productos.forEach((p) => {
        if (pendientes[p.id]) return;
        if (bajos.includes(p.id) && diasAtras < 34) return;
        if (stk.A1[p.id] < p.min * 1.4) {
          (porProv[p.prov] = porProv[p.prov] || []).push({ p: p.id, q: Math.max(40, p.min * 3), cu: p.costo });
          pendientes[p.id] = true;
        }
      });
      Object.keys(porProv).forEach((pid) => {
        const oc = nuevaCompra(dia, pid, porProv[pid]);
        const llega = dia + ri(1, 3) * DAY;
        llegadas.push({ dia: llega, oc });
        const pagoDia = llega + (cond(oc.cond).dias || 1) * DAY - ri(0, 3) * DAY;
        if (pagoDia <= T0) pagosProgramados.push({ dia: pagoDia, doc: oc, tipo: 'compra' });
      });
      // Reponer la tienda desde el almacén principal cada lunes
      if (dow === 1) {
        st.productos.forEach((p) => {
          if (stk.A2[p.id] < 6 && stk.A1[p.id] > 20) {
            const q = 12;
            stk.A1[p.id] -= q; stk.A2[p.id] += q;
            const ref = 'TR-' + pad(++st.seq.mov, 5);
            addMov(at(dia, 8, 15), p.id, 'A1', -q, 'Transferencia', ref, p.costo);
            addMov(at(dia, 8, 15), p.id, 'A2', q, 'Transferencia', ref, p.costo);
          }
        });
      }
    }
    // Una orden enviada ayer que llega mañana
    const ayer = T0 - DAY;
    const env = nuevaCompra(ayer, 'R02', [{ p: 'P003', q: 60, cu: 94 }, { p: 'P010', q: 30, cu: 135 }, { p: 'P007', q: 45, cu: 55.5 }]);
    env.fecha = at(ayer, 11, 20); env.log[0].f = env.fecha;
    // Una orden en borrador para hoy
    const borr = nuevaCompra(T0, 'R03', [{ p: 'P016', q: 30, cu: 91.5 }, { p: 'P019', q: 24, cu: 68.7 }]);
    borr.estado = 'bor';
    borr.log = [{ f: borr.fecha, u: 'Rosa Medina', t: 'Creó la orden de compra' }];

    ajustarHoy(st, T0);
    st.movs.sort((a, b) => a.f - b.f);
    st.caja.sort((a, b) => a.f - b.f || a.id - b.id);
    return st;
  }

  /* Las horas generadas para hoy no pueden pasar la hora actual:
     se comprimen entre las 00:00 y ahora, manteniendo el orden. */
  function ajustarHoy(st, T0) {
    const limite = Date.now() - 5 * 60000;
    const refs = [];
    const take = (o, k) => { if (o && o[k] >= T0) refs.push([o, k]); };
    st.ventas.forEach((v) => { take(v, 'fecha'); take(v.cpe, 'f'); v.pagos.forEach((x) => take(x, 'f')); v.log.forEach((x) => take(x, 'f')); });
    st.compras.forEach((c) => { take(c, 'fecha'); take(c, 'recibido'); c.pagos.forEach((x) => take(x, 'f')); c.log.forEach((x) => take(x, 'f')); });
    st.movs.forEach((m) => take(m, 'f'));
    st.caja.forEach((m) => take(m, 'f'));
    const max = refs.reduce((m, r) => Math.max(m, r[0][r[1]]), 0);
    if (max <= limite) return;
    const k = Math.max(0, limite - T0) / (max - T0);
    refs.forEach(([o, key]) => { o[key] = Math.round(T0 + (o[key] - T0) * k); });
  }

  function hashCode(s) {
    let h = 2166136261;
    for (let i = 0; i < s.length; i++) { h ^= s.charCodeAt(i); h = Math.imul(h, 16777619); }
    const b = (h >>> 0).toString(36).toUpperCase();
    return (b + 'K7Q2ZP9W').slice(0, 8) + '=';
  }

  /* ---------- Guardado ---------- */
  function load() {
    try {
      const raw = localStorage.getItem(STORE_KEY);
      if (raw) { const st = JSON.parse(raw); if (st && st.v === 1) { S = st; return; } }
    } catch (e) { /* sin almacenamiento: se usan datos nuevos */ }
    seed(); save();
  }
  function save() { try { localStorage.setItem(STORE_KEY, JSON.stringify(S)); } catch (e) { /* ignorar */ } }
  function reset() { try { localStorage.removeItem(STORE_KEY); } catch (e) { /* ignorar */ } seed(); save(); }

  /* ---------- Número a letras (para el comprobante) ---------- */
  function letras(n) {
    const U = ['', 'UNO', 'DOS', 'TRES', 'CUATRO', 'CINCO', 'SEIS', 'SIETE', 'OCHO', 'NUEVE', 'DIEZ', 'ONCE', 'DOCE', 'TRECE', 'CATORCE', 'QUINCE', 'DIECISÉIS', 'DIECISIETE', 'DIECIOCHO', 'DIECINUEVE', 'VEINTE', 'VEINTIUNO', 'VEINTIDÓS', 'VEINTITRÉS', 'VEINTICUATRO', 'VEINTICINCO', 'VEINTISÉIS', 'VEINTISIETE', 'VEINTIOCHO', 'VEINTINUEVE'];
    const DEC = ['', '', '', 'TREINTA', 'CUARENTA', 'CINCUENTA', 'SESENTA', 'SETENTA', 'OCHENTA', 'NOVENTA'];
    const CEN = ['', 'CIENTO', 'DOSCIENTOS', 'TRESCIENTOS', 'CUATROCIENTOS', 'QUINIENTOS', 'SEISCIENTOS', 'SETECIENTOS', 'OCHOCIENTOS', 'NOVECIENTOS'];
    function c99(x) { if (x < 30) return U[x]; const d = Math.floor(x / 10), u = x % 10; return DEC[d] + (u ? ' Y ' + U[u] : ''); }
    function c999(x) { if (x === 100) return 'CIEN'; const c = Math.floor(x / 100), r = x % 100; return (CEN[c] + (r ? ' ' + c99(r) : '')).trim(); }
    function entero(x) {
      if (x === 0) return 'CERO';
      const mill = Math.floor(x / 1e6), miles = Math.floor((x % 1e6) / 1000), resto = x % 1000;
      let s = '';
      const apoc = (t) => t.replace(/VEINTIUNO$/, 'VEINTIÚN').replace(/UNO$/, 'UN');
      if (mill) s += (mill === 1 ? 'UN MILLÓN' : apoc(c999(mill)) + ' MILLONES') + ' ';
      if (miles) s += (miles === 1 ? 'MIL' : apoc(c999(miles)) + ' MIL') + ' ';
      if (resto) s += c999(resto);
      return s.trim();
    }
    const ent = Math.floor(n), cent = Math.round((n - ent) * 100);
    return 'SON: ' + entero(ent) + ' CON ' + pad(cent, 2) + '/100 SOLES';
  }

  /* ---------- Interfaz: toast, modales ---------- */
  let toastTimer = 0;
  function toast(msg, tipo) {
    const el = document.getElementById('toast');
    el.textContent = msg;
    el.className = 'toast is-on' + (tipo ? ' toast--' + tipo : '');
    clearTimeout(toastTimer);
    toastTimer = setTimeout(() => { el.className = 'toast'; }, 3200);
  }

  /* Modal genérico: devuelve una promesa con los datos del formulario o null */
  function modal(opts) {
    const dlg = document.getElementById('modal');
    dlg.querySelector('.modal__title').textContent = opts.titulo;
    dlg.querySelector('.modal__body').innerHTML = opts.html;
    const ok = dlg.querySelector('[data-ok]');
    ok.textContent = opts.ok || 'Guardar';
    ok.className = 'btn ' + (opts.peligro ? 'btn--danger' : 'btn--primary');
    const note = dlg.querySelector('.modal__note');
    note.textContent = '';
    const form = dlg.querySelector('form');
    if (opts.init) opts.init(form);
    dlg.showModal();
    const first = form.querySelector('input:not([type=hidden]), select, textarea');
    if (first) first.focus();
    return new Promise((resolve) => {
      const cancels = dlg.querySelectorAll('[data-cancel]');
      function close(val) {
        form.onsubmit = null; dlg.onclose = null;
        cancels.forEach((b) => { b.onclick = null; });
        if (dlg.open) dlg.close();
        resolve(val);
      }
      form.onsubmit = (e) => {
        e.preventDefault();
        const data = Object.fromEntries(new FormData(form).entries());
        const err = opts.validar ? opts.validar(data, form) : '';
        if (err) { note.textContent = err; return; }
        close(data);
      };
      cancels.forEach((b) => { b.onclick = () => close(null); });
      dlg.onclose = () => resolve(null);
    });
  }

  function confirmar(titulo, texto, ok, peligro) {
    return modal({ titulo, html: '<p class="modal__text">' + esc(texto) + '</p>', ok, peligro }).then((r) => r !== null);
  }

  /* ---------- CSV ---------- */
  function csv(nombre, filas) {
    const txt = filas.map((f) => f.map((c) => {
      const s = String(c == null ? '' : c);
      return /[",;\n]/.test(s) ? '"' + s.replace(/"/g, '""') + '"' : s;
    }).join(',')).join('\r\n');
    const blob = new Blob(['﻿' + txt], { type: 'text/csv;charset=utf-8' });
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = nombre + '.csv';
    document.body.appendChild(a); a.click(); a.remove();
    setTimeout(() => URL.revokeObjectURL(a.href), 2000);
  }

  window.ERP = {
    D, IGV, DAY, MESES, MES_C,
    get S() { return S; },
    load, save, reset,
    money, num, pad, fdate, ftime, today, dayStart, esc, round2,
    metodo, cond, cuenta, almacen, producto, cliente, proveedor, esRuc,
    totales, totalVenta, totalCompra, pagado, saldo, stock, stockMap, saldoCuenta,
    cpeLabel, ventaEstado, compraEstado, ESTADOS_VENTA, ESTADOS_COMPRA, pill, hashCode,
    letras, toast, modal, confirmar, csv
  };
})();
