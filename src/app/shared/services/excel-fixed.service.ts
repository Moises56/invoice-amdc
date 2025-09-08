import { Injectable } from '@angular/core';
import * as XLSX from 'xlsx';
import { ActivityLog } from '../interfaces/user.interface';

@Injectable({
  providedIn: 'root'
})
export class ExcelService {

  constructor() { }

  /**
   * Exporta los logs de actividad a un archivo Excel separando por tipo de consulta
   * @param logs Logs de actividad a exportar
   * @param fileName Nombre del archivo Excel
   */
  exportActivityLogsToExcel(logs: ActivityLog[], fileName: string = 'activity-logs'): void {
    console.log('📊 INICIANDO EXPORTACIÓN A EXCEL');
    console.log('📊 Total de logs recibidos:', logs.length);
    console.log('📊 Primer log de ejemplo:', logs[0]);
    
    if (!logs || logs.length === 0) {
      console.error('No hay logs para exportar');
      return;
    }

    // Agrupar logs por tipo de consulta
    const logsByType = this.groupLogsByQueryType(logs);
    
    // Crear un libro de Excel
    const workbook = XLSX.utils.book_new();
    
    // Para cada tipo de consulta, crear una hoja
    Object.entries(logsByType).forEach(([queryType, typeLogs]) => {
      // Extraer parámetros específicos para este tipo de consulta
      const worksheetData = this.extractParametersForType(typeLogs, queryType);
      
      // Crear hoja de trabajo
      const worksheet = XLSX.utils.json_to_sheet(worksheetData);
      
      // Añadir la hoja al libro
      XLSX.utils.book_append_sheet(workbook, worksheet, queryType || 'Sin tipo');
    });
    
    // Generar y descargar el archivo Excel
    XLSX.writeFile(workbook, `${fileName}.xlsx`);
  }

  /**
   * Agrupa los logs por tipo de consulta
   * @param logs Logs de actividad
   * @returns Objeto con logs agrupados por tipo de consulta
   */
  private groupLogsByQueryType(logs: ActivityLog[]): Record<string, ActivityLog[]> {
    return logs.reduce((acc, log) => {
      const queryType = log.consultaType || 'Sin tipo';
      if (!acc[queryType]) {
        acc[queryType] = [];
      }
      acc[queryType].push(log);
      return acc;
    }, {} as Record<string, ActivityLog[]>);
  }

  /**
   * Extrae los parámetros específicos para un tipo de consulta
   * Solo muestra los campos solicitados: No., Clave Catastral, Fecha y Hora, Ubicación, Usuario, Tipo Consulta, Subtipo
   * @param logs Logs de un tipo específico
   * @param queryType Tipo de consulta
   * @returns Array de objetos con los parámetros extraídos
   */
  private extractParametersForType(logs: ActivityLog[], queryType: string): any[] {
    return logs.map((log, index) => {
      // Intentar parsear los parámetros JSON con doble parsing
      let params: any = {};
      try {
        if (log.parametros) {
          // Primer parsing: del string JSON a objeto
          let firstParse = typeof log.parametros === 'string' ? JSON.parse(log.parametros) : log.parametros;
          
          // Si el resultado es aún un string, hacer segundo parsing
          if (typeof firstParse === 'string') {
            params = JSON.parse(firstParse);
          } else {
            params = firstParse;
          }
        }
      } catch (error) {
        console.error('Error al parsear parámetros:', error, log.parametros);
        // Si falla el parsing, intentar usar el valor directo
        params = log.parametros || {};
      }

      // Debug: log de parámetros para verificar formato (SIEMPRE para todos los registros por ahora)
      if (index < 3) { // Primeros 3 registros para debugging
        console.log(`📋 Debug Excel [${index}] - Tipo: ${queryType}`);
        console.log(`📋 Debug Excel [${index}] - Parámetros originales:`, log.parametros);
        console.log(`📋 Debug Excel [${index}] - Tipo de parámetros originales:`, typeof log.parametros);
        console.log(`📋 Debug Excel [${index}] - Parámetros parseados:`, params);
        console.log(`📋 Debug Excel [${index}] - Tipo de params parseados:`, typeof params);
        console.log(`📋 Debug Excel [${index}] - Keys disponibles:`, typeof params === 'object' && params ? Object.keys(params) : 'no keys');
      }

      // Determinar el valor de Clave Catastral basado en el tipo de consulta
      let claveCatastralValue = 'N/A';
      
      // Log específico antes de buscar valores
      if (index < 3) {
        console.log(`📋 Debug Excel [${index}] - Iniciando búsqueda de clave catastral para tipo: ${queryType}`);
        console.log(`📋 Debug Excel [${index}] - Params para búsqueda:`, params);
      }
      
      if (queryType === 'EC' || queryType === 'claveCatastral') {
        // Para Estado de Cuenta y Clave Catastral, extraer clave catastral
        const claveCatastral = params.claveCatastral || 
                             params.clave_catastral || 
                             params.clave || 
                             params.catastral || 
                             params.codigo;
        
        if (claveCatastral) {
          claveCatastralValue = claveCatastral;
        } else {
          // Si no hay clave catastral, buscar DNI como fallback
          const dni = params.dni || params.DNI || params.numeroIdentidad || params.identidad || params.numero_identidad;
          if (dni) {
            claveCatastralValue = dni; // Solo el número, sin "DNI:"
          }
        }
        
        if (index < 3) {
          console.log(`📋 Debug Excel [${index}] - EC búsqueda:`);
          console.log(`  - claveCatastral: ${params.claveCatastral}`);
          console.log(`  - clave_catastral: ${params.clave_catastral}`);
          console.log(`  - dni: ${params.dni}`);
          console.log(`  - resultado: ${claveCatastralValue}`);
        }
      } else if (queryType === 'DNI' || queryType === 'dni') {
        // Para DNI, mostrar solo el número de identidad
        const dni = params.dni || params.DNI || params.numeroIdentidad || params.identidad || params.numero_identidad;
        claveCatastralValue = dni || 'N/A'; // Solo el número, sin "DNI:"
        
        // Debug específico para DNI
        if (index < 3) {
          console.log(`📋 Debug DNI - Búsqueda:`);
          console.log(`  - params.dni: ${params.dni}`);
          console.log(`  - params.DNI: ${params.DNI}`);
          console.log(`  - params.numeroIdentidad: ${params.numeroIdentidad}`);
          console.log(`  - Resultado: ${claveCatastralValue}`);
        }
      } else if (queryType === 'ICS' || queryType === 'ics') {
        // Para ICS, mostrar el RTN
        const rtn = params.rtn || params.RTN || params.numeroRtn || params.numero_rtn;
        claveCatastralValue = rtn ? `RTN: ${rtn}` : 'N/A';
      } else {
        // Para otros tipos, intentar encontrar cualquier parámetro relevante
        const possibleValues = [
          params.dni, params.DNI, params.numeroIdentidad, params.identidad, params.numero_identidad,
          params.rtn, params.RTN, params.numeroRtn, params.numero_rtn,
          params.claveCatastral, params.clave_catastral, params.clave, params.catastral, params.codigo
        ].filter(Boolean);
        
        if (possibleValues.length > 0) {
          claveCatastralValue = possibleValues[0];
        }
      }

      // Crear objeto con solo los campos solicitados
      const specificParams = {
        'No.': index + 1,
        'Clave Catastral': claveCatastralValue,
        'Fecha y Hora': new Date(log.createdAt).toLocaleString('es-HN', {
          year: 'numeric',
          month: '2-digit',
          day: '2-digit',
          hour: '2-digit',
          minute: '2-digit',
          second: '2-digit'
        }),
        'Ubicación': log.userLocation || 'N/A',
        'Usuario': log.username || 'N/A',
        'Tipo Consulta': log.consultaType || 'N/A',
        'Subtipo': log.consultaSubtype || 'N/A'
      };

      return specificParams;
    });
  }
}
