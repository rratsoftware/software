/* Datos fijos de la empresa de ejemplo (ficticia). */
window.ERP_DATA = {
  EMPRESA: {
    nombre: 'Comercial Ayni',
    razon: 'Comercial Ayni S.A.C.',
    ruc: '20999999991',
    dir: 'Av. Nicolás Ayllón 4820, Ate, Lima',
    tel: '(01) 356 0000',
    giro: 'Distribuidora mayorista de abarrotes y limpieza'
  },

  USUARIO: { nombre: 'Rosa Medina', cargo: 'Administradora', ini: 'RM' },

  VENDEDORES: ['Rosa Medina', 'Carlos Paredes', 'Milagros Ticona'],

  ALMACENES: [
    { id: 'A1', nombre: 'Almacén principal · Ate' },
    { id: 'A2', nombre: 'Tienda · La Victoria' }
  ],

  CUENTAS: [
    { id: 'caja', nombre: 'Caja principal', tipo: 'Efectivo', icon: 'ti-cash', inicial: 3500 },
    { id: 'bcp', nombre: 'BCP Cta. Cte. Soles', tipo: '191-2345678-0-12', icon: 'ti-building-bank', inicial: 48000 },
    { id: 'ibk', nombre: 'Interbank Cta. Cte. Soles', tipo: '200-3001234567', icon: 'ti-building-bank', inicial: 15000 }
  ],

  /* Método de pago → cuenta donde entra el dinero */
  METODOS: [
    { id: 'efectivo', nombre: 'Efectivo', cuenta: 'caja' },
    { id: 'yape', nombre: 'Yape', cuenta: 'bcp' },
    { id: 'transf_bcp', nombre: 'Transferencia BCP', cuenta: 'bcp' },
    { id: 'plin', nombre: 'Plin', cuenta: 'ibk' },
    { id: 'transf_ibk', nombre: 'Transferencia Interbank', cuenta: 'ibk' }
  ],

  CONDICIONES: [
    { id: 'contado', nombre: 'Contado', dias: 0 },
    { id: 'cred15', nombre: 'Crédito 15 días', dias: 15 },
    { id: 'cred30', nombre: 'Crédito 30 días', dias: 30 }
  ],

  /* precio de venta y costo incluyen IGV */
  PRODUCTOS: [
    { id: 'P001', nombre: 'Arroz extra superior', pres: 'Saco 50 kg', cat: 'Abarrotes', und: 'SAC', precio: 189.00, costo: 156.00, min: 25, prov: 'R01' },
    { id: 'P002', nombre: 'Azúcar rubia', pres: 'Saco 50 kg', cat: 'Abarrotes', und: 'SAC', precio: 172.00, costo: 141.50, min: 20, prov: 'R01' },
    { id: 'P003', nombre: 'Aceite vegetal', pres: 'Caja 12 × 1 L', cat: 'Abarrotes', und: 'CJA', precio: 115.00, costo: 94.00, min: 20, prov: 'R02' },
    { id: 'P004', nombre: 'Fideo spaghetti', pres: 'Caja 20 × 500 g', cat: 'Abarrotes', und: 'CJA', precio: 61.00, costo: 49.80, min: 20, prov: 'R02' },
    { id: 'P005', nombre: 'Leche evaporada', pres: 'Caja 48 × 400 g', cat: 'Lácteos', und: 'CJA', precio: 182.00, costo: 149.00, min: 15, prov: 'R04' },
    { id: 'P006', nombre: 'Atún en trozos', pres: 'Caja 48 latas', cat: 'Conservas', und: 'CJA', precio: 222.00, costo: 182.00, min: 10, prov: 'R05' },
    { id: 'P007', nombre: 'Avena en hojuelas', pres: 'Caja 24 × 300 g', cat: 'Abarrotes', und: 'CJA', precio: 68.00, costo: 55.50, min: 15, prov: 'R02' },
    { id: 'P008', nombre: 'Harina sin preparar', pres: 'Saco 50 kg', cat: 'Abarrotes', und: 'SAC', precio: 136.00, costo: 111.00, min: 12, prov: 'R01' },
    { id: 'P009', nombre: 'Lenteja bebé', pres: 'Saco 25 kg', cat: 'Menestras', und: 'SAC', precio: 132.00, costo: 108.00, min: 10, prov: 'R01' },
    { id: 'P010', nombre: 'Café instantáneo', pres: 'Caja 24 × 50 g', cat: 'Abarrotes', und: 'CJA', precio: 165.00, costo: 135.00, min: 10, prov: 'R02' },
    { id: 'P011', nombre: 'Galleta de soda', pres: 'Caja 12 paquetes', cat: 'Abarrotes', und: 'CJA', precio: 36.00, costo: 29.40, min: 20, prov: 'R02' },
    { id: 'P012', nombre: 'Gaseosa 3 L', pres: 'Paquete 6 und', cat: 'Bebidas', und: 'PAQ', precio: 40.00, costo: 32.80, min: 25, prov: 'R06' },
    { id: 'P013', nombre: 'Agua mineral 625 ml', pres: 'Paquete 15 und', cat: 'Bebidas', und: 'PAQ', precio: 17.50, costo: 14.30, min: 30, prov: 'R06' },
    { id: 'P014', nombre: 'Detergente en polvo', pres: 'Fardo 4 × 4 kg', cat: 'Limpieza', und: 'FAR', precio: 104.00, costo: 85.00, min: 12, prov: 'R03' },
    { id: 'P015', nombre: 'Lejía tradicional', pres: 'Caja 4 × 4 L', cat: 'Limpieza', und: 'CJA', precio: 36.50, costo: 29.90, min: 15, prov: 'R03' },
    { id: 'P016', nombre: 'Jabón de tocador', pres: 'Caja 72 und', cat: 'Limpieza', und: 'CJA', precio: 112.00, costo: 91.50, min: 8, prov: 'R03' },
    { id: 'P017', nombre: 'Papel higiénico doble hoja', pres: 'Fardo 40 rollos', cat: 'Limpieza', und: 'FAR', precio: 62.00, costo: 50.60, min: 15, prov: 'R03' },
    { id: 'P018', nombre: 'Lavavajilla en pasta', pres: 'Caja 24 × 500 g', cat: 'Limpieza', und: 'CJA', precio: 64.00, costo: 52.40, min: 10, prov: 'R03' },
    { id: 'P019', nombre: 'Suavizante de ropa', pres: 'Caja 4 × 3.6 L', cat: 'Limpieza', und: 'CJA', precio: 84.00, costo: 68.70, min: 8, prov: 'R03' },
    { id: 'P020', nombre: 'Bolsa para basura 140 L', pres: 'Paquete 100 und', cat: 'Limpieza', und: 'PAQ', precio: 28.00, costo: 22.90, min: 15, prov: 'R03' }
  ],

  CLIENTES: [
    { id: 'C01', nombre: 'Minimarket El Sol E.I.R.L.', doc: '20605123874', dist: 'Ate', dir: 'Jr. Los Cedros 245', tel: '987 112 430', cond: 'cred15' },
    { id: 'C02', nombre: 'Market San Martín S.A.C.', doc: '20601889231', dist: 'Santa Anita', dir: 'Av. Los Ruiseñores 1180', tel: '981 450 227', cond: 'cred30' },
    { id: 'C03', nombre: 'Comercial Rosales E.I.R.L.', doc: '20608874512', dist: 'El Agustino', dir: 'Av. Riva Agüero 932', tel: '994 205 118', cond: 'cred15' },
    { id: 'C04', nombre: 'Restaurante La Huerta S.A.C.', doc: '20610452337', dist: 'La Molina', dir: 'Av. La Fontana 1450', tel: '956 330 871', cond: 'cred30' },
    { id: 'C05', nombre: 'Pollería El Leñador S.A.C.', doc: '20609117045', dist: 'San Luis', dir: 'Av. Circunvalación 2210', tel: '944 781 602', cond: 'contado' },
    { id: 'C06', nombre: 'Hostal Los Pinos E.I.R.L.', doc: '20603665190', dist: 'La Victoria', dir: 'Jr. Antonio Bazo 515', tel: '933 604 915', cond: 'contado' },
    { id: 'C07', nombre: 'Distribuidora El Paisano S.R.L.', doc: '20607330918', dist: 'Chaclacayo', dir: 'Av. Nicolás Ayllón 980', tel: '982 017 553', cond: 'cred30' },
    { id: 'C08', nombre: 'Bodega Doña Julia', doc: '41523687', dist: 'Ate', dir: 'Mz. F Lt. 12, Huaycán', tel: '965 228 340', cond: 'contado' },
    { id: 'C09', nombre: 'Bodega Mi Barrio', doc: '45879012', dist: 'Santa Anita', dir: 'Calle Los Tulipanes 166', tel: '978 340 662', cond: 'contado' },
    { id: 'C10', nombre: 'Juan Carlos Quispe Mamani', doc: '40918273', dist: 'Vitarte', dir: 'Av. Separadora Industrial 3410', tel: '912 553 807', cond: 'contado' },
    { id: 'C11', nombre: 'Colegio Parroquial Santa Clara', doc: '20511236784', dist: 'Ate', dir: 'Av. Esperanza 600', tel: '(01) 351 2290', cond: 'cred30' },
    { id: 'C12', nombre: 'Minimarket Kiara E.I.R.L.', doc: '20612098455', dist: 'Lurigancho', dir: 'Av. Lima 1220, Chosica', tel: '951 667 024', cond: 'cred15' }
  ],

  PROVEEDORES: [
    { id: 'R01', nombre: 'Molinera del Norte S.A.C.', doc: '20480012345', dist: 'Trujillo', dir: 'Panamericana Norte km 558', tel: '(044) 28 0011', cond: 'cred30' },
    { id: 'R02', nombre: 'Alimentos Andinos S.A.', doc: '20100234561', dist: 'Lima', dir: 'Av. Argentina 4060', tel: '(01) 613 2000', cond: 'cred30' },
    { id: 'R03', nombre: 'Industrias Limpia Hogar S.A.C.', doc: '20512345670', dist: 'Lurín', dir: 'Antigua Panamericana Sur km 38', tel: '(01) 430 8800', cond: 'cred15' },
    { id: 'R04', nombre: 'Lácteos del Valle S.A.', doc: '20100456782', dist: 'Arequipa', dir: 'Parque Industrial Mz. B', tel: '(054) 23 4400', cond: 'cred30' },
    { id: 'R05', nombre: 'Conservas del Pacífico S.A.C.', doc: '20530098761', dist: 'Chimbote', dir: 'Av. Industrial 120', tel: '(043) 35 1200', cond: 'cred15' },
    { id: 'R06', nombre: 'Bebidas Rímac S.A.C.', doc: '20545670981', dist: 'Lima', dir: 'Av. Nicolás Arriola 1650', tel: '(01) 702 5000', cond: 'contado' }
  ],

  GASTOS: [
    { concepto: 'Alquiler de almacén', monto: 3800, dia: 1, cuenta: 'bcp' },
    { concepto: 'Planilla de personal', monto: 9600, dia: 28, cuenta: 'bcp' },
    { concepto: 'Luz y agua', monto: 540, dia: 12, cuenta: 'ibk' },
    { concepto: 'Internet y telefonía', monto: 189, dia: 8, cuenta: 'ibk' }
  ]
};
