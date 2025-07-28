import{u as s}from"./chunk-WYTV4Y2I.js";var c=(()=>{let o=class o{constructor(){}formatEstadoCuenta(t,e,n=!1){let r="";return r+=this.centerText(this.normalizeText("ALCALDIA MUNICIPAL DEL DISTRITO CENTRAL"))+`
`,r+=this.centerText("TEGUCIGALPA, HONDURAS, C.A.")+`
`,r+=this.centerText(this.normalizeText("GERENCIA DE RECAUDACION Y CONTROL FINANCIERO"))+`
`,n?r+=this.centerText(this.normalizeText("ESTADO DE CUENTA CON AMNISTIA"))+`

`:r+=this.centerText("ESTADO DE CUENTA")+`

`,e&&(r+=this.normalizeText("-- Parametros de Busqueda --")+`
`,e.dni?r+=`Busqueda por DNI: ${e.dni}
`:e.claveCatastral&&(r+=`Busqueda por Clave Catastral: ${e.claveCatastral}
`),r+=`
`),r+=this.normalizeText("-- Informacion Personal --")+`
`,r+=`Nombre: ${t.nombre}
`,r+=`Identidad: ${t.identidad}
`,r+=`Clave Catastral: ${t.claveCatastral}

`,r+=this.normalizeText("-- Fecha y Ubicacion --")+`
`,r+=`Colonia: ${t.nombreColonia}
`,r+=`Fecha: ${t.fecha} ${t.hora}

`,n&&(r+=this.createLine()+`
`,r+=this.centerText(this.normalizeText("*** AMNISTIA APLICADA ***"))+`
`,r+=this.centerText(this.normalizeText("Recargos reducidos segun programa"))+`
`,r+=this.createLine()+`

`),r+=this.createLine()+`
`,r+=this.createRow([this.normalizeText("A\xF1o"),"Impto","T.Aseo","Bomberos","Recargo","Total"])+`
`,r+=this.createLine()+`
`,t.detallesMora.forEach(a=>{r+=this.createRow([a.year,this.formatCurrencyWithSeparators(a.impuestoNumerico),this.formatCurrencyWithSeparators(a.trenDeAseoNumerico),this.formatCurrencyWithSeparators(a.tasaBomberosNumerico),this.formatCurrencyWithSeparators(a.recargoNumerico),this.formatCurrencyWithSeparators(a.totalNumerico)])+`
`}),r+=this.createLine()+`
`,r+=this.alignRight(`Total: ${this.formatCurrencyWithSeparators(t.totalGeneralNumerico)}`)+`

`,r+=this.setBold(!0),r+=this.centerText("Total a Pagar: "+this.formatCurrencyWithSeparators(t.totalGeneralNumerico)+" LPS")+`
`,r+=this.setBold(!1),r+=`
`,r+=this.centerText("Datos actualizados al 15 de junio del 2025.")+`
`,r+=this.centerText(this.normalizeText("Para mayor informaci\xF3n llamar al 2220-6088"))+`
`,r+=this.centerText("RECUERDA QUE EL PAGO DE BIENES INMUEBLES")+`
`,r+=this.centerText("VENCE EL 31 DE AGOSTO DEL 2025")+`
`,r}setBold(t){return t?"\x1BE":"\x1BE\0"}normalizeText(t){let e={\u00E1:"\xA0",\u00E9:"\x82",\u00ED:"\xA1",\u00F3:"\xA2",\u00FA:"\xA3",\u00C1:"\xB5",\u00C9:"\x90",\u00CD:"\xD6",\u00D3:"\xE0",\u00DA:"\xE9",\u00F1:"\xA4",\u00D1:"\xA5",\u00FC:"\x81",\u00DC:"\x9A"};return t.replace(/[áéíóúÁÉÍÓÚñÑüÜ]/g,n=>e[n]||n)}removeAccents(t){let e={\u00E1:"a",\u00E9:"e",\u00ED:"i",\u00F3:"o",\u00FA:"u",\u00C1:"A",\u00C9:"E",\u00CD:"I",\u00D3:"O",\u00DA:"U",\u00F1:"n",\u00D1:"N",\u00FC:"u",\u00DC:"U"};return t.replace(/[áéíóúÁÉÍÓÚñÑüÜ]/g,n=>e[n]||n)}formatCurrencyWithSeparators(t){return t.toLocaleString("es-HN",{minimumFractionDigits:2,maximumFractionDigits:2})}centerText(t,e=48){let n=Math.floor((e-t.length)/2);return" ".repeat(Math.max(0,n))+t}createLine(t=48){return"-".repeat(t)}createRow(t,e=[5,11,10,10,12]){let n="";return t.forEach((r,a)=>{n+=r.padEnd(e[a])}),n}alignRight(t,e=48){return t.padStart(e)}formatCurrency(t){return t.toFixed(2)}formatInvoiceForPrinting(t){let e="";return e+=this.centerText("RECIBO DE FACTURA")+`

`,e+=`Cliente: ${t.cliente||""}
`,e+=`Fecha: ${t.fecha||""}
`,e+=this.createLine()+`
`,t.detalles&&Array.isArray(t.detalles)&&t.detalles.forEach(n=>{e+=`${n.descripcion||""}  ${this.formatCurrency(n.monto||0)}
`}),e+=this.createLine()+`
`,e+=this.setBold(!0),e+=this.alignRight(`Total: ${this.formatCurrency(t.total||0)}`)+`
`,e+=this.setBold(!1),e}formatDetailedInvoice(t){let e="";return e+=this.centerText("FACTURA DETALLADA")+`

`,e+=`Cliente: ${t.cliente||""}
`,e+=`Fecha: ${t.fecha||""}
`,e+=this.createLine()+`
`,t.detalles&&Array.isArray(t.detalles)&&(e+=this.normalizeText("Descripci\xF3n")+`         Cantidad   Precio   Subtotal
`,t.detalles.forEach(n=>{e+=`${n.descripcion||""}`.padEnd(18)+`${n.cantidad||0}`.toString().padEnd(10)+`${this.formatCurrency(n.precio||0)}`.padEnd(10)+`${this.formatCurrency(n.subtotal||0)}
`})),e+=this.createLine()+`
`,e+=this.setBold(!0),e+=this.alignRight(`Total: ${this.formatCurrency(t.total||0)}`)+`
`,e+=this.setBold(!1),e}};o.\u0275fac=function(e){return new(e||o)},o.\u0275prov=s({token:o,factory:o.\u0275fac,providedIn:"root"});let i=o;return i})();export{c as a};
