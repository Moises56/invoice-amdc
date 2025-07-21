import{u as o}from"./chunk-5JVX3F6S.js";var a="\x1B",l="",i=`
`,h=(()=>{let r=class r{constructor(){}formatDetailedInvoice(e){let t="";return t+=this._initializePrinter(),t+=this._setJustification("center"),t+=this._setBold(!0),t+=`${e.nombre_mercado}
`,t+=this._setBold(!1),t+=`${e.direccion_mercado}
`,t+=`--------------------------------
`,t+=i,t+=this._setJustification("left"),t+=`Factura #: ${e.numero_factura}
`,t+=`Fecha: ${new Date(e.fecha).toLocaleString("es-HN")}
`,t+=`Estado: ${e.estado_factura}
`,t+=i,t+=`Local: ${e.nombre_local} (#${e.numero_local})
`,t+=`Propietario: ${e.propietario_nombre}
`,t+=`DNI: ${e.propietario_dni}
`,t+=`--------------------------------
`,t+=i,t+=this._setJustification("center"),t+=this._setBold(!0),t+=`--- DETALLE DE FACTURA ---
`,t+=this._setBold(!1),t+=i,t+=this._setJustification("left"),t+=`Concepto: Cuota de ${e.mes}/${e.anio}
`,t+=i,t+=this._setJustification("right"),t+=this._setBold(!0),t+=`Monto a Pagar: L. ${Number(e.monto).toFixed(2)}
`,t+=this._setBold(!1),t+=`--------------------------------
`,t+=i,t+=this._setJustification("center"),t+=`Presente este recibo en caja
`,t+=`Gracias por su pago
`,t+=i,t+=i,t+=i,t+=this._cutPaper(),t}formatInvoiceForPrinting(e){let t="";return t+=this._initializePrinter(),t+=this._setJustification("center"),t+=this._setBold(!0),t+=`Mi Empresa S.A.
`,t+=this._setBold(!1),t+=`Direcci\xF3n de la Empresa
`,t+=`Tel: 123-456-7890
`,t+=i,t+=this._setJustification("left"),t+=`Factura: ${e.id}
`,t+=`Fecha: ${e.date.toLocaleString()}
`,t+=`Cliente: ${e.customerName}
`,t+="-".repeat(32)+i,t+=this._padEnd("Cant.",5),t+=this._padEnd("Desc.",17),t+=this._padStart("Total",10),t+=i,t+="-".repeat(32)+i,e.items.forEach(s=>{let c=(s.quantity*s.price).toFixed(2);t+=this._padEnd(s.quantity.toString(),5),t+=this._padEnd(s.description,17),t+=this._padStart(`$${c}`,10),t+=i}),t+="-".repeat(32)+i,t+=this._setJustification("right"),t+=`Subtotal: ${this._padStart("$"+e.subtotal.toFixed(2),10)}
`,t+=`ISV:      ${this._padStart("$"+e.tax.toFixed(2),10)}
`,t+=this._setBold(!0),t+=`Total:    ${this._padStart("$"+e.total.toFixed(2),10)}
`,t+=this._setBold(!1),t+=i,t+=this._setJustification("center"),t+=`\xA1Gracias por su compra!
`,t+=i,t+=i,t+=this._cutPaper(),t}_initializePrinter(){return a+"@"}_setJustification(e){let t;switch(e){case"center":t=1;break;case"right":t=2;break;default:t=0;break}return a+"a"+String.fromCharCode(t)}_setBold(e){return a+"E"+(e?"":"\0")}_cutPaper(){return l+"V"}_padEnd(e,t){return e.padEnd(t," ")}_padStart(e,t){return e.padStart(t," ")}};r.\u0275fac=function(t){return new(t||r)},r.\u0275prov=o({token:r,factory:r.\u0275fac,providedIn:"root"});let n=r;return n})();export{h as a};
