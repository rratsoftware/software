/* Datos de ejemplo — Ferretería Los Andes (negocio ficticio) */
window.FINANZAS_DATOS = {
  negocio: {
    nombre: 'Ferretería Los Andes',
    iniciales: 'LA',
    duena: 'Rosa'
  },

  cuentas: [
    { id: 'caja',  nombre: 'Caja (efectivo)', corto: 'Caja',  icono: 'cash',            inicial: 1850 },
    { id: 'bcp',   nombre: 'Cuenta BCP',      corto: 'BCP',   icono: 'building-bank',   inicial: 3000 },
    { id: 'yape',  nombre: 'Yape / Plin',     corto: 'Yape',  icono: 'device-mobile',   inicial: 960 }
  ],

  categorias: {
    ingreso: [
      { id: 'ventas',   nombre: 'Ventas del día',     icono: 'receipt' },
      { id: 'obras',    nombre: 'Pedidos para obra',  icono: 'building' },
      { id: 'cobros',   nombre: 'Cobro de deudas',    icono: 'user-check' },
      { id: 'otros-i',  nombre: 'Otros ingresos',     icono: 'plus' }
    ],
    gasto: [
      { id: 'mercaderia', nombre: 'Compra de mercadería', icono: 'package' },
      { id: 'sueldos',    nombre: 'Sueldos',              icono: 'users' },
      { id: 'alquiler',   nombre: 'Alquiler del local',   icono: 'home' },
      { id: 'servicios',  nombre: 'Luz, agua e internet', icono: 'bolt' },
      { id: 'impuestos',  nombre: 'Impuestos (SUNAT)',    icono: 'file-certificate' },
      { id: 'transporte', nombre: 'Transporte y fletes',  icono: 'truck' },
      { id: 'otros-g',    nombre: 'Otros gastos',         icono: 'dots' }
    ]
  },

  proveedores: ['Aceros Arequipa (distribuidor)', 'Distribuidora Pinturas del Sur', 'Importadora Ferretera Lima', 'Tubos y Conexiones Perú', 'Eléctricos San Martín'],
  clientes: ['Constructora Huamán', 'Sr. Julio Paredes (maestro de obra)', 'Inmobiliaria Las Lomas', 'Sra. Carmen Ríos', 'Taller Mecánico El Rápido', 'Colegio San Andrés']
};
