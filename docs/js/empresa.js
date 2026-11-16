/* =========================================================
   RratSoft — datos de la empresa (un solo lugar)
   Lo usan: páginas legales, Libro de Reclamaciones y cotizador.
   Completa los campos vacíos con tus datos reales.
   ========================================================= */
window.RRATSOFT_EMPRESA = {
  nombreComercial: 'RratSoft',
  razonSocial: 'RratSoft S.A.C',              // ej. 'RRATSOFT S.A.C.' o tu nombre si eres persona natural con negocio
  ruc: '86436795325',                      // 11 dígitos
  direccion: 'Av.Varcarcel , Miraflores',                // domicilio fiscal, ej. 'Av. Ejemplo 123, Miraflores, Lima'
  email: 'Soporte@rratsoft.org',
  whatsapp: '75378866',                 // solo números con código de país, ej. '51987654321'
  web: 'https://rratsoft.org',

  // Libro de Reclamaciones: dirección que recibe las hojas.
  // Recomendado: crea un formulario gratis en https://formspree.io y pega aquí su URL
  // (ej. 'https://formspree.io/f/abcdwxyz'). Así cada reclamo te llega al correo y queda guardado.
  // Si lo dejas vacío, se abre el correo del cliente con la hoja ya escrita.
  libroEndpoint: ''
};

// Rellena automáticamente los elementos con data-empresa="campo"
(function () {
  var E = window.RRATSOFT_EMPRESA;
  function fill() {
    document.querySelectorAll('[data-empresa]').forEach(function (el) {
      var v = E[el.getAttribute('data-empresa')];
      if (v) {
        el.textContent = v;
        el.classList.remove('is-missing');
      } else {
        el.textContent = 'Por completar';
        el.classList.add('is-missing');
      }
    });
    document.querySelectorAll('a[data-empresa-mail]').forEach(function (a) {
      a.href = 'mailto:' + E.email;
      a.textContent = E.email;
    });
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', fill);
  else fill();
})();
