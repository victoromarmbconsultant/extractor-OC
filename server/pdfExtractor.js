/**
 * Extrae información de un PDF de Orden de Compra
 * Versión simplificada - solo extrae Order y Date
 */

function extractPDFData(text, filename) {
  const data = {
    Order: null,
    Date: null,
    To: null,
    Invoice: null,
    Detalle: []
  };

  // Extraer Orden de compra
  // Primero intentar del nombre del archivo
  const filenameMatch = filename.match(/([0-9]+)/);
  if (filenameMatch) {
    data.Order = filenameMatch[1];
  } else {
    // Si no, buscar en el texto del PDF
    const orderPatterns = [
      /(?:orden\s+de\s+compra|oc|order|orden)[\s:]*([0-9]+)/i,
      /(?:no\.?|número|numero|#)[\s:]*([0-9]+)/i
    ];
    
    for (const pattern of orderPatterns) {
      const match = text.match(pattern);
      if (match) {
        data.Order = match[1];
        break;
      }
    }
  }

  // Extraer Fecha - múltiples formatos (incluyendo DD.MM.YYYY)
  const datePatterns = [
    /(?:fecha|date)[\s:]*(\d{1,2}[\.\/\-]\d{1,2}[\.\/\-]\d{2,4})/i,
    /(\d{1,2}\.\d{1,2}\.\d{4})/,  // Formato DD.MM.YYYY
    /(\d{1,2}[\/\-]\d{1,2}[\/\-]\d{2,4})/,
    /(\d{4}[\/\-]\d{1,2}[\/\-]\d{1,2})/
  ];
  
  for (const pattern of datePatterns) {
    const match = text.match(pattern);
    if (match) {
      data.Date = match[1];
      break;
    }
  }

  // Extraer campo "A:" (To)
  // Buscar desde "A:" hasta antes de "No. Prov:"
  // El texto puede estar en múltiples líneas y puede contener "(To)" que debemos eliminar
  const lines = text.split(/\n|\r/);
  let foundA = false;
  
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i].trim();
    
    // Buscar línea que contiene "A:" o "A: (To)"
    if (line.match(/^a[\s:]+(?:\(to\))?/i) || line.match(/^a[\s:]+/i)) {
      // Capturar las siguientes líneas hasta encontrar "No. Prov:"
      let toLines = [];
      let j = i;
      
      // Capturar texto después de "A:" en la misma línea si existe
      const afterA = line.replace(/^a[\s:]+(?:\(to\))?\s*/i, '').trim();
      if (afterA && !afterA.match(/^\(to\)$/i)) {
        // Si hay texto después de "A:" en la misma línea, agregarlo
        toLines.push(afterA);
      }
      
      // Empezar desde la siguiente línea
      if (line.match(/^a[\s:]+(?:\(to\))?/i)) {
        // Si la línea tiene "A: (To)", empezar desde la siguiente
        j = i + 1;
      } else if (line.match(/^a[\s:]+/i)) {
        // Si solo tiene "A:", verificar si la siguiente línea tiene "(To)"
        if (i + 1 < lines.length && lines[i + 1].trim().match(/^\(to\)/i)) {
          j = i + 2; // Saltar "A:" y "(To)"
        } else {
          j = i + 1; // Empezar desde la siguiente línea
        }
      }
      
      // Capturar líneas hasta encontrar "No. Prov:"
      while (j < lines.length && j < i + 10) {
        const nextLine = lines[j].trim();
        
        // Detener si encontramos "No. Prov:"
        if (nextLine.match(/^no\.?\s*prov/i) || nextLine.match(/no\.?\s*prov[\s:]/i)) {
          break;
        }
        
        // Detener si encontramos una línea vacía después de haber capturado algo
        if (!nextLine && toLines.length > 0) {
          break;
        }
        
        // Capturar línea si no está vacía y no es solo "(To)"
        if (nextLine && !nextLine.match(/^[\(\)\s]*$/) && !nextLine.match(/^\(to\)$/i)) {
          toLines.push(nextLine);
        }
        
        j++;
      }
      
      if (toLines.length > 0) {
        // Unir líneas
        let toText = toLines.join(' ');
        
        // Eliminar solo "(To)" del texto (con espacios alrededor si existen)
        // Usar replace con palabra completa para evitar eliminar parte de otras palabras
        toText = toText.replace(/\s*\(to\)\s*/gi, ' ');
        
        // Limpiar espacios múltiples
        toText = toText.replace(/\s{2,}/g, ' ').trim();
        
        data.To = toText.substring(0, 300);
        foundA = true;
        break;
      }
    }
  }
  
  // Si no se encontró con el método anterior, intentar patrón regex
  if (!foundA) {
    const toPattern = /a[\s:]+(?:\(to\))?[\s\n\r]*(.+?)(?=\n\s*no\.?\s*prov|no\.?\s*prov)/is;
    const match = text.match(toPattern);
    if (match && match[1]) {
      let toText = match[1].trim();
      // Eliminar solo "(To)" con espacios alrededor
      toText = toText.replace(/\s*\(to\)\s*/gi, ' ');
      // Limpiar espacios múltiples
      toText = toText.replace(/\s{2,}/g, ' ').trim();
      data.To = toText.substring(0, 300);
    }
  }

  // Extraer campo "Facturar a:" (Invoice)
  // Buscar desde "Facturar a:" hasta donde termine esa celda (nombre empresa, dirección, código postal, RFC)
  // El texto puede contener "(Invoice to)" que debemos eliminar
  let foundInvoice = false;
  
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i].trim();
    
    // Buscar línea que contiene "Facturar a:" o "Facturar a: (Invoice to)"
    if (line.match(/(?:facturar\s+a|facturar|invoice|factura\s+a)[\s:]+(?:\(invoice\s+to\))?/i) || 
        line.match(/(?:facturar\s+a|facturar)[\s:]+/i)) {
      // Capturar las siguientes líneas hasta encontrar el siguiente campo o fin de celda
      let invoiceLines = [];
      
      // Capturar texto después de "Facturar a:" en la misma línea si existe
      const afterFacturar = line.replace(/(?:facturar\s+a|facturar|invoice|factura\s+a)[\s:]+(?:\(invoice\s+to\))?\s*/i, '').trim();
      if (afterFacturar && !afterFacturar.match(/^\(invoice\s+to\)$/i)) {
        // Si hay texto después de "Facturar a:" en la misma línea, agregarlo
        invoiceLines.push(afterFacturar);
      }
      
      // Empezar desde la siguiente línea
      let j = i + 1;
      
      // Si la siguiente línea tiene "(Invoice to)", saltarla
      if (j < lines.length && lines[j].trim().match(/^\(invoice\s+to\)$/i)) {
        j = i + 2;
      }
      
      // Capturar líneas hasta encontrar el siguiente campo o línea vacía
      while (j < lines.length && j < i + 10) {
        const nextLine = lines[j].trim();
        
        // Detener si encontramos el siguiente campo (Incoterms, CFDI, Condiciones, etc.)
        if (nextLine.match(/^(incoterms|cfdi|condiciones|fecha|orden|oc|detalle|partida|f\.?\s*entrega|entregar|moneda|planta)/i)) {
          break;
        }
        
        // Detener si encontramos una línea vacía después de haber capturado algo
        if (!nextLine && invoiceLines.length > 0) {
          break;
        }
        
        // Capturar línea si no está vacía y no es solo "(Invoice to)"
        if (nextLine && 
            !nextLine.match(/^[\(\)\s]*$/) && 
            !nextLine.match(/^\(invoice\s+to\)$/i)) {
          invoiceLines.push(nextLine);
        }
        
        j++;
      }
      
      if (invoiceLines.length > 0) {
        // Unir líneas
        let invoiceText = invoiceLines.join(' ');
        
        // Eliminar solo "(Invoice to)" del texto (con espacios alrededor si existen)
        invoiceText = invoiceText.replace(/\s*\(invoice\s+to\)\s*/gi, ' ');
        
        // Limpiar espacios múltiples
        invoiceText = invoiceText.replace(/\s{2,}/g, ' ').trim();
        
        data.Invoice = invoiceText.substring(0, 300);
        foundInvoice = true;
        break;
      }
    }
  }
  
  // Si no se encontró con el método anterior, intentar patrón regex
  if (!foundInvoice) {
    const invoicePattern = /(?:facturar\s+a|facturar|invoice|factura\s+a)[\s:]+(?:\(invoice\s+to\))?[\s\n\r]*(.+?)(?=\n\s*(?:incoterms|cfdi|condiciones|fecha|orden|oc|detalle|partida|f\.?\s*entrega)|$)/is;
    const match = text.match(invoicePattern);
    if (match && match[1]) {
      let invoiceText = match[1].trim();
      // Eliminar solo "(Invoice to)" con espacios alrededor
      invoiceText = invoiceText.replace(/\s*\(invoice\s+to\)\s*/gi, ' ');
      // Limpiar espacios múltiples
      invoiceText = invoiceText.replace(/\s{2,}/g, ' ').trim();
      data.Invoice = invoiceText.substring(0, 300);
    }
  }

  // Extraer detalles de partidas
  // Manejar descripciones que se dividen en múltiples líneas
  // Cuando la descripción es larga, puede estar en el renglón del ITEM y en el siguiente
  
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i].trim();
    
    // Detectar si es una fila de partida (debe empezar con número: 10, 20, etc.)
    const partidaMatch = line.match(/^(\d{1,3})\s+/);
    
    if (partidaMatch) {
      // Esta línea empieza con un número de partida
      // La descripción puede estar dividida en múltiples líneas
      // Necesitamos buscar en esta línea y las siguientes hasta encontrar fecha y precios
      
      let partida = {
        Item: partidaMatch[1],
        Code: '',
        Description: '',
        DelivDate: '',
        Quantity: '',
        Unit: '',
        UnitPrice: '',
        TotalPrice: '',
        TAX: '',
        TotalTax: '',
        Consultant: '',
        REPSE: '',
        Periodo: '',
        Provider: '',
        Proyect: '',
        Descuento: '',
        Tipo: ''
      };
      
      // Acumular líneas para buscar todos los datos (máximo 6 líneas)
      let accumulatedLines = [line];
      let j = i + 1;
      let foundDate = false;
      let foundPrices = false;
      
      // Buscar en las siguientes líneas
      while (j < lines.length && j < i + 6) {
        const nextLine = lines[j].trim();
        
        // Si la siguiente línea empieza con otro número de partida, detener
        const nextPartidaMatch = nextLine.match(/^(\d{1,3})\s+/);
        if (nextPartidaMatch && nextPartidaMatch[1] !== partidaMatch[1]) {
          break;
        }
        
        // Si encontramos "Total", "Subtotal" u otro campo, detener (solo si ya tenemos datos)
        if (nextLine.match(/^(total|subtotal|suma|grand\s+total)/i) && (foundDate || foundPrices)) {
          break;
        }
        
        // Agregar la línea al acumulado si no está vacía
        if (nextLine && !nextLine.match(/^\d{1,3}\s*$/)) {
          accumulatedLines.push(nextLine);
        }
        
        // Verificar si esta línea tiene fecha o precios
        if (nextLine.match(/\d{1,2}\.\d{1,2}\.\d{4}/)) {
          foundDate = true;
        }
        const nextPrices = nextLine.match(/\d{1,3}(?:,\d{3})*\.\d{2}/g);
        if (nextPrices && nextPrices.length >= 2) {
          foundPrices = true;
        }
        
        // Si ya encontramos fecha y precios, podemos detener
        if (foundDate && foundPrices) {
          break;
        }
        
        j++;
      }
      
      // Unir todas las líneas acumuladas para buscar los datos
      const combinedLine = accumulatedLines.join(' ');
      
      // Verificar que tenemos fecha y precios en las líneas combinadas
      const hasDate = combinedLine.match(/\d{1,2}\.\d{1,2}\.\d{4}/);
      const hasPrices = combinedLine.match(/(\d{1,3}(?:,\d{3})*\.\d{2})/g);
      
      if (hasDate && hasPrices && hasPrices.length >= 2) {
        // Buscar fecha de entrega (formato DD.MM.YYYY)
        const dateMatch = combinedLine.match(/(\d{1,2}\.\d{1,2}\.\d{4})/);
        if (dateMatch) {
          partida.DelivDate = dateMatch[1];
        }
        
        // Buscar cantidad y unidad juntas (formato: 11.000 DIA o 22,000 DIA)
        // La cantidad está después de la descripción y antes de los precios
        // Buscar patrón: número con decimales (11.000 o 11,000) seguido de unidad
        const qtyUnitMatch = combinedLine.match(/(\d+[.,]\d{3})\s+([A-Z]{2,4})\b/i);
        if (qtyUnitMatch) {
          partida.Quantity = qtyUnitMatch[1].replace(',', '.');
          const unit = qtyUnitMatch[2].toUpperCase();
          if (['DIA', 'HRS', 'HR', 'MES', 'AÑO', 'UNI', 'PZA', 'DÍAS', 'HORAS'].includes(unit)) {
            partida.Unit = unit;
          }
        } else {
          // Si no encontramos el patrón completo, buscar por separado
          // Buscar cantidad (evitar confundir con fechas o precios)
          // La cantidad suele estar entre la descripción y los precios, y tiene formato X.XXX o X,XXX
          const qtyMatches = combinedLine.match(/(\d+[.,]\d{3})/g);
          if (qtyMatches) {
            // Filtrar: la cantidad no debe ser parte de una fecha (DD.MM.YYYY) ni de un precio (X,XXX.XX)
            for (const qty of qtyMatches) {
              const numValue = parseFloat(qty.replace(',', '.'));
              // La cantidad suele ser un número pequeño (menor a 1000) con 3 decimales
              if (numValue > 0 && numValue < 1000 && qty.match(/\.\d{3}$|,\d{3}$/)) {
                // Verificar que no sea parte de una fecha
                const beforeQty = combinedLine.substring(0, combinedLine.indexOf(qty));
                const afterQty = combinedLine.substring(combinedLine.indexOf(qty) + qty.length);
                // Si antes o después hay un patrón de fecha, no es cantidad
                if (!beforeQty.match(/\d{1,2}\.\d{1,2}\.$/) && !afterQty.match(/^\d{4}/)) {
                  partida.Quantity = qty.replace(',', '.');
                  break;
                }
              }
            }
          }
          
          // Buscar unidad (palabras en mayúsculas de 2-4 letras: DIA, HRS, etc.)
          const unitMatch = combinedLine.match(/\b([A-Z]{2,4})\b/);
          if (unitMatch) {
            const unit = unitMatch[1];
            if (['DIA', 'HRS', 'HR', 'MES', 'AÑO', 'UNI', 'PZA', 'DÍAS', 'HORAS'].includes(unit)) {
              partida.Unit = unit;
            }
          }
        }
        
        // Buscar descripción - puede estar en múltiples líneas
        // Buscar líneas que contengan texto descriptivo (no solo números, fechas o precios)
        let descParts = [];
        for (let k = 0; k < accumulatedLines.length; k++) {
          const descLine = accumulatedLines[k];
          // Si la línea contiene texto descriptivo (letras, especialmente "Consultoría" o "CONSULTORIA")
          if (descLine.match(/consultoría|consultoria/i) || 
              (descLine.match(/[a-záéíóúñA-Z]/) && 
               !descLine.match(/^\d+$/) && 
               !descLine.match(/^\d{1,3}\s*$/) &&
               !descLine.match(/\d{1,2}\.\d{1,2}\.\d{4}/) &&
               !descLine.match(/^\d{1,3}(?:,\d{3})*\.\d{2}$/))) {
            // Extraer texto descriptivo (eliminar número de partida si está al inicio)
            const cleanDesc = descLine.replace(/^\d+\s+/, '').trim();
            if (cleanDesc && cleanDesc.length > 3) {
              descParts.push(cleanDesc);
            }
          }
        }
        
        // Si no encontramos descripción con el método anterior, intentar extraer entre número y fecha
        if (descParts.length === 0) {
          const beforeDate = combinedLine.split(/\d{1,2}\.\d{1,2}\.\d{4}/)[0];
          if (beforeDate) {
            const descText = beforeDate.replace(/^\d+\s+/, '').trim();
            if (descText && descText.length > 3) {
              descParts.push(descText);
            }
          }
        }
        
        // Unir todas las partes de la descripción
        if (descParts.length > 0) {
          partida.Description = descParts.join(' ').replace(/\s{2,}/g, ' ').trim();
        }
        
        // Buscar precios (números con formato de moneda: 5,221.82) en las líneas combinadas
        // Orden esperado: Precio Unitario, Precio Total, IVA, Total con IVA
        const prices = combinedLine.match(/(\d{1,3}(?:,\d{3})*\.\d{2})/g);
        if (prices && prices.length >= 1) {
          // Filtrar precios válidos (deben ser >= 100 para ser precios reales)
          const validPrices = prices.filter(p => {
            const numValue = parseFloat(p.replace(/,/g, ''));
            return numValue >= 100; // Los precios suelen ser >= 100
          });
          
          if (validPrices.length >= 1) {
            // Precio Unitario (puede tener "/ 1" al final)
            const unitPriceMatch = combinedLine.match(/(\d{1,3}(?:,\d{3})*\.\d{2})\s*\/\s*\d+/);
            if (unitPriceMatch) {
              partida.UnitPrice = unitPriceMatch[1];
            } else {
              // El primer precio grande suele ser Precio Unitario
              partida.UnitPrice = validPrices[0];
            }
            
            // Precio Total (segundo precio grande)
            if (validPrices.length >= 2) {
              partida.TotalPrice = validPrices[1];
            }
            
            // IVA (tercer precio grande)
            if (validPrices.length >= 3) {
              partida.TAX = validPrices[2];
            }
            
            // Total con IVA (cuarto precio grande o el último)
            if (validPrices.length >= 4) {
              partida.TotalTax = validPrices[3];
            } else if (validPrices.length >= 3) {
              // Si solo hay 3 precios, el último es el total con IVA
              partida.TotalTax = validPrices[validPrices.length - 1];
            }
          }
        }
        
        // Si encontramos al menos el número de partida y algunos datos, buscar campos adicionales
        if (partida.Item && (partida.DelivDate || partida.Quantity || partida.UnitPrice)) {
          // Buscar campos adicionales en las líneas siguientes (después de la partida)
          // Estos campos aparecen después de cada partida en el PDF
          let searchIndex = j; // Continuar desde donde terminamos de buscar la partida
          let maxSearchLines = searchIndex + 15; // Buscar hasta 15 líneas más
          
          for (let k = searchIndex; k < lines.length && k < maxSearchLines; k++) {
            const extraLine = lines[k].trim();
            const lowerExtraLine = extraLine.toLowerCase();
            
            // Si encontramos la siguiente partida o un campo nuevo, detener
            if (extraLine.match(/^\d{1,3}\s+/) && extraLine.match(/^\d{1,3}\s+/)[1] !== partidaMatch[1]) {
              break;
            }
            
            // Buscar CONSULTORIA
            if (lowerExtraLine.startsWith('consultoria') || lowerExtraLine.startsWith('consultoría')) {
              const consultantMatch = extraLine.match(/consultoria\s*:?\s*(.+)/i);
              if (consultantMatch) {
                partida.Consultant = consultantMatch[1].trim();
              } else {
                partida.Consultant = extraLine.replace(/^consultoria\s*:?\s*/i, '').trim();
              }
            }
            
            // Buscar Folio REPSE o REPSE
            if (lowerExtraLine.includes('folio repse') || lowerExtraLine.includes('repse')) {
              const repseMatch = extraLine.match(/(?:folio\s+)?repse\s*:?\s*(.+)/i);
              if (repseMatch) {
                partida.REPSE = repseMatch[1].trim();
              } else {
                partida.REPSE = extraLine.replace(/^(?:folio\s+)?repse\s*:?\s*/i, '').trim();
              }
            }
            
            // Buscar PERIODO DE CONSULTORIA
            if (lowerExtraLine.includes('periodo de consultoria') || lowerExtraLine.includes('periodo de consultoría')) {
              const periodoMatch = extraLine.match(/periodo\s+de\s+consultoria\s*:?\s*(.+)/i);
              if (periodoMatch) {
                partida.Periodo = periodoMatch[1].trim();
              } else {
                partida.Periodo = extraLine.replace(/^periodo\s+de\s+consultoria\s*:?\s*/i, '').trim();
              }
            }
            
            // Buscar PROVEEDOR
            if (lowerExtraLine.startsWith('proveedor')) {
              const providerMatch = extraLine.match(/proveedor\s*:?\s*(.+)/i);
              if (providerMatch) {
                partida.Provider = providerMatch[1].trim();
              } else {
                partida.Provider = extraLine.replace(/^proveedor\s*:?\s*/i, '').trim();
              }
            }
            
            // Buscar PROYECTO
            if (lowerExtraLine.startsWith('proyecto')) {
              const proyectMatch = extraLine.match(/proyecto\s*:?\s*(.+)/i);
              if (proyectMatch) {
                partida.Proyect = proyectMatch[1].trim();
              } else {
                partida.Proyect = extraLine.replace(/^proyecto\s*:?\s*/i, '').trim();
              }
            }
            
            // Buscar DESCUENTO
            if (lowerExtraLine.startsWith('descuento')) {
              const descuentoMatch = extraLine.match(/descuento\s*:?\s*(.+)/i);
              if (descuentoMatch) {
                partida.Descuento = descuentoMatch[1].trim();
              } else {
                partida.Descuento = extraLine.replace(/^descuento\s*:?\s*/i, '').trim();
              }
            }
            
            // Buscar TIPO DE CONSULTOR
            if (lowerExtraLine.includes('tipo de consultor') || lowerExtraLine.includes('tipo consultor')) {
              const tipoMatch = extraLine.match(/tipo\s+(?:de\s+)?consultor\s*:?\s*(.+)/i);
              if (tipoMatch) {
                partida.Tipo = tipoMatch[1].trim();
              } else {
                partida.Tipo = extraLine.replace(/^tipo\s+(?:de\s+)?consultor\s*:?\s*/i, '').trim();
              }
            }
            
            // Si encontramos la siguiente partida (diferente número), detener búsqueda de campos adicionales
            const nextPartidaMatch = extraLine.match(/^(\d{1,3})\s+/);
            if (nextPartidaMatch && nextPartidaMatch[1] !== partidaMatch[1]) {
              break;
            }
            
            // Si encontramos "Total" o "Subtotal" al inicio, también detener
            if (extraLine.match(/^(total|subtotal|suma|grand\s+total)\s*$/i)) {
              break;
            }
          }
          
          data.Detalle.push(partida);
        }
      }
      
      // NO detener aquí - continuar buscando más partidas
      // El bucle continuará y procesará la siguiente partida (20, 30, etc.)
    }
    
    // Detener solo si encontramos el final definitivo de la sección
    // Verificar si la línea actual es "Total" o "Subtotal" (solo al final de todo)
    if (line.match(/^(total|subtotal|suma|grand\s+total)\s*$/i) && data.Detalle.length > 0) {
      // Verificar que realmente es el final (no es parte de una descripción)
      const nextLine = i + 1 < lines.length ? lines[i + 1].trim() : '';
      if (!nextLine.match(/^\d{1,3}\s+/)) {
        // Si la siguiente línea no es otra partida, entonces sí es el final
        break;
      }
    }
  }

  return data;
}

module.exports = { extractPDFData };
