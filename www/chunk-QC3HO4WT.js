import{u as o}from"./chunk-WYTV4Y2I.js";var h=(()=>{let a=class a{constructor(){}formatEstadoCuenta(t){let r="";return r+=this.centerText(this.normalizeText("Alcald\xEDa Municipal del Distrito Central"))+`
`,r+=this.centerText("Tegucigalpa, Honduras, C.A.")+`
`,r+=this.centerText(this.normalizeText("GERENCIA DE RECAUDACI\xD3N Y CONTROL FINANCIERO"))+`
`,r+=this.centerText("ESTADO DE CUENTA")+`

`,r+=this.normalizeText("Informaci\xF3n Personal")+`
`,r+=`Nombre: ${t.nombre}
`,r+=`Identidad: ${t.identidad}
`,r+=`Clave Catastral: ${t.claveCatastral}

`,r+=this.normalizeText("Fecha y Ubicaci\xF3n")+`
`,r+=`Colonia: ${t.colonia}
`,r+=`Fecha: ${t.fecha} ${t.hora}

`,r+=this.createLine()+`
`,r+=this.createRow([this.normalizeText("A\xF1o"),"Impto","T.Aseo","Bomberos","Total"])+`
`,r+=this.createLine()+`
`,t.detallesMora.forEach(e=>{r+=this.createRow([e.year,this.formatCurrencyWithSeparators(e.impuestoNumerico),this.formatCurrencyWithSeparators(e.trenDeAseoNumerico),this.formatCurrencyWithSeparators(e.tasaBomberosNumerico),this.formatCurrencyWithSeparators(e.totalNumerico)])+`
`}),r+=this.createLine()+`
`,r+=this.alignRight(`Total: ${this.formatCurrencyWithSeparators(t.totalGeneralNumerico)}`)+`

`,r+=this.centerText("Total a Pagar: "+this.formatCurrencyWithSeparators(t.totalGeneralNumerico)+" LPS")+`

`,r+=`Datos actualizados al 15 de junio del 2025.
`,r+=this.normalizeText("Para mayor informaci\xF3n llamar al 2220-6088")+`
`,r+=`RECUERDA QUE EL PAGO DE BIENES INMUEBLES
`,r+=`VENCE EL 31 DE AGOSTO DEL 2025
`,r}normalizeText(t){let r={\u00E1:"\xA0",\u00E9:"\x82",\u00ED:"\xA1",\u00F3:"\xA2",\u00FA:"\xA3",\u00C1:"\xB5",\u00C9:"\x90",\u00CD:"\xD6",\u00D3:"\xE0",\u00DA:"\xE9",\u00F1:"\xA4",\u00D1:"\xA5",\u00FC:"\x81",\u00DC:"\x9A"};return t.replace(/[áéíóúÁÉÍÓÚñÑüÜ]/g,e=>r[e]||e)}removeAccents(t){let r={\u00E1:"a",\u00E9:"e",\u00ED:"i",\u00F3:"o",\u00FA:"u",\u00C1:"A",\u00C9:"E",\u00CD:"I",\u00D3:"O",\u00DA:"U",\u00F1:"n",\u00D1:"N",\u00FC:"u",\u00DC:"U"};return t.replace(/[áéíóúÁÉÍÓÚñÑüÜ]/g,e=>r[e]||e)}formatCurrencyWithSeparators(t){return t.toLocaleString("es-HN",{minimumFractionDigits:2,maximumFractionDigits:2})}centerText(t,r=48){let e=Math.floor((r-t.length)/2);return" ".repeat(e)+t}createLine(t=48){return"-".repeat(t)}createRow(t,r=[5,11,10,10,12]){let e="";return t.forEach((i,c)=>{e+=i.padEnd(r[c])}),e}alignRight(t,r=48){return t.padStart(r)}formatCurrency(t){return t.toFixed(2)}formatInvoiceForPrinting(t){let r="";return r+=this.centerText("RECIBO DE FACTURA")+`
`,r+=`Cliente: ${t.cliente||""}
`,r+=`Fecha: ${t.fecha||""}
`,r+=this.createLine()+`
`,t.detalles&&Array.isArray(t.detalles)&&t.detalles.forEach(e=>{r+=`${e.descripcion||""}  ${this.formatCurrency(e.monto||0)}
`}),r+=this.createLine()+`
`,r+=this.alignRight(`Total: ${this.formatCurrency(t.total||0)}`)+`
`,r}formatDetailedInvoice(t){let r="";return r+=this.centerText("FACTURA DETALLADA")+`
`,r+=`Cliente: ${t.cliente||""}
`,r+=`Fecha: ${t.fecha||""}
`,r+=this.createLine()+`
`,t.detalles&&Array.isArray(t.detalles)&&(r+=this.normalizeText("Descripci\xF3n")+`         Cantidad   Precio   Subtotal
`,t.detalles.forEach(e=>{r+=`${e.descripcion||""}`.padEnd(18)+`${e.cantidad||0}`.toString().padEnd(10)+`${this.formatCurrency(e.precio||0)}`.padEnd(10)+`${this.formatCurrency(e.subtotal||0)}
`})),r+=this.createLine()+`
`,r+=this.alignRight(`Total: ${this.formatCurrency(t.total||0)}`)+`
`,r}};a.\u0275fac=function(r){return new(r||a)},a.\u0275prov=o({token:a,factory:a.\u0275fac,providedIn:"root"});let n=a;return n})();export{h as a};
