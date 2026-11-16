/* =========================================================
   RratSoft — Libro de Reclamaciones virtual
   - Genera el número de hoja y la fecha.
   - Valida los campos obligatorios.
   - Envía la hoja a RRATSOFT_EMPRESA.libroEndpoint (Formspree u otro).
     Sin endpoint, abre el correo del consumidor con la hoja escrita.
   - Muestra la constancia para imprimir o guardar en PDF.
   ========================================================= */
(function () {
  var E = window.RRATSOFT_EMPRESA;
  var form = document.getElementById('libro-form');
  var note = document.getElementById('libro-note');
  var submitBtn = document.getElementById('libro-submit');
  var now = new Date();

  function pad(n, len) { return String(n).padStart(len || 2, '0'); }

  // Número de hoja: año + fecha/hora + 3 cifras al azar (no se repite en la práctica)
  var hoja = now.getFullYear() + '-' + pad(now.getMonth() + 1) + pad(now.getDate()) +
    pad(now.getHours()) + pad(now.getMinutes()) + '-' + pad(Math.floor(Math.random() * 1000), 3);
  var fecha = now.toLocaleDateString('es-PE', { day: '2-digit', month: '2-digit', year: 'numeric' }) +
    ' ' + pad(now.getHours()) + ':' + pad(now.getMinutes());

  document.getElementById('hoja-num').textContent = hoja;
  document.getElementById('hoja-fecha').textContent = fecha;

  // Menor de edad: pide el nombre del padre, madre o apoderado
  var menor = document.getElementById('menor');
  var apoWrap = document.getElementById('apoderado-wrap');
  var apo = apoWrap.querySelector('input');
  menor.addEventListener('change', function () {
    apoWrap.hidden = !menor.checked;
    apo.required = menor.checked;
  });

  // Documento: valida largo según el tipo
  var tipoDoc = form.elements.tipoDoc;
  var numDoc = form.elements.numDoc;
  var DOC_RULES = { DNI: /^\d{8}$/, RUC: /^(10|20)\d{9}$/, CE: /^[A-Za-z0-9]{8,12}$/, Pasaporte: /^[A-Za-z0-9]{6,12}$/ };
  function checkDoc() {
    var ok = DOC_RULES[tipoDoc.value].test(numDoc.value.trim());
    numDoc.setCustomValidity(ok ? '' : 'Número de documento no válido');
  }
  tipoDoc.addEventListener('change', checkDoc);
  numDoc.addEventListener('input', checkDoc);

  function setNote(text, error) {
    note.textContent = text;
    note.className = 'sheet__note' + (error ? ' is-error' : '');
  }

  function collect() {
    var f = form.elements;
    return {
      'Hoja N.°': hoja,
      'Fecha': fecha,
      'Proveedor': (E.razonSocial || E.nombreComercial) + (E.ruc ? ' — RUC ' + E.ruc : ''),
      'Consumidor': f.nombre.value.trim(),
      'Documento': f.tipoDoc.value + ' ' + f.numDoc.value.trim(),
      'Domicilio': f.domicilio.value.trim(),
      'Teléfono': f.telefono.value.trim(),
      'Correo': f.email.value.trim(),
      'Padre, madre o apoderado': f.menor.checked ? f.apoderado.value.trim() : '',
      'Bien contratado': f.bien.value,
      'Monto reclamado': f.monto.value.trim(),
      'Comprobante o pedido': f.comprobante.value.trim(),
      'Descripción del bien': f.descripcion.value.trim(),
      'Tipo': f.tipo.value,
      'Detalle': f.detalle.value.trim(),
      'Pedido del consumidor': f.pedido.value.trim()
    };
  }

  function asText(data) {
    return Object.keys(data).filter(function (k) { return data[k]; })
      .map(function (k) { return k + ': ' + data[k]; }).join('\n');
  }

  function showDone(data, viaMail) {
    form.hidden = true;
    var done = document.getElementById('libro-done');
    done.hidden = false;
    document.getElementById('done-tipo').textContent = data.Tipo.toLowerCase();
    if (viaMail) {
      document.getElementById('done-text').textContent =
        'Se abrió tu correo con la hoja escrita: envíalo para completar el registro. ' +
        'Te responderemos en un plazo no mayor a 15 días hábiles. Guarda esta constancia.';
    }
    var dl = document.getElementById('done-list');
    dl.innerHTML = '';
    Object.keys(data).forEach(function (k) {
      if (!data[k]) return;
      var dt = document.createElement('dt'); dt.textContent = k;
      var dd = document.createElement('dd'); dd.textContent = data[k];
      dl.appendChild(dt); dl.appendChild(dd);
    });
    done.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }

  document.getElementById('libro-print').addEventListener('click', function () { window.print(); });

  form.addEventListener('submit', function (e) {
    e.preventDefault();
    checkDoc();
    var fields = Array.prototype.slice.call(form.querySelectorAll('input, select, textarea'));
    var invalid = fields.filter(function (f) { return !f.checkValidity(); });
    fields.forEach(function (f) {
      if (f.type !== 'radio' && f.type !== 'checkbox') f.setAttribute('aria-invalid', String(invalid.indexOf(f) !== -1));
    });
    if (invalid.length) {
      setNote(invalid[0] === numDoc ? 'Revisa el número de documento.' :
        invalid[0].id === 'acepto' ? 'Debes aceptar la declaración para enviar.' : 'Completa los campos marcados.', true);
      invalid[0].focus();
      return;
    }

    var data = collect();
    var subject = 'Libro de Reclamaciones — ' + data.Tipo + ' N.° ' + hoja;

    if (!E.libroEndpoint) {
      window.location.href = 'mailto:' + E.email + '?subject=' + encodeURIComponent(subject) +
        '&body=' + encodeURIComponent(asText(data));
      showDone(data, true);
      return;
    }

    submitBtn.disabled = true;
    setNote('Enviando…');
    var payload = Object.assign({ _subject: subject, _replyto: data.Correo }, data);
    fetch(E.libroEndpoint, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Accept': 'application/json' },
      body: JSON.stringify(payload)
    }).then(function (res) {
      if (!res.ok) throw new Error('HTTP ' + res.status);
      showDone(data, false);
    }).catch(function () {
      submitBtn.disabled = false;
      setNote('No se pudo enviar. Revisa tu conexión o escríbenos a ' + E.email + '.', true);
    });
  });
})();
