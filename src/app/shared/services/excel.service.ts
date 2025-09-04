import { Injectable } from '@angular/core';
import * as XLSX from 'xlsx';
import { ActivityLog } from '../../shared/interfaces/user.interface';

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
   * @param logs Logs de un tipo específico
   * @param queryType Tipo de consulta
   * @returns Array de objetos con los parámetros extraídos
   */
  private extractParametersForType(logs: ActivityLog[], queryType: string): any[] {
    return logs.map((log, index) => {
      // Intentar parsear los parámetros JSON
      let params: any = {};
      try {
        if (log.parametros) {
          params = typeof log.parametros === 'string' ? JSON.parse(log.parametros) : log.parametros;
        }
      } catch (error) {
        console.error('Error al parsear parámetros:', error, log.parametros);
      }

      // Extraer valores específicos según el tipo de consulta
      let specificParams: any = {};
      
      if (queryType === 'EC' || queryType === 'claveCatastral') {
        // Para Estado de Cuenta y Clave Catastral, extraer TODAS las claves catastrales posibles
        const claveCatastral = params.claveCatastral || 
                              params.clave_catastral || 
                              params.clave || 
                              params.catastral || 
                              params.codigo || 
                              'N/A';
        
        specificParams = {
          'No.': index + 1,
          'Clave Catastral': claveCatastral,
          'Fecha y Hora': new Date(log.createdAt).toLocaleString('es-HN', {
            year: 'numeric',
            month: '2-digit',
            day: '2-digit',
            hour: '2-digit',
            minute: '2-digit',
            second: '2-digit'
          }),
          'Resultado': log.resultado,
          'Usuario': log.username || 'N/A',
          'Ubicación': log.userLocation || 'N/A',
          'Tipo Consulta': log.consultaType || 'N/A',
          'Subtipo': log.consultaSubtype || 'N/A',
          'IP': log.ip || 'N/A'
        };
      } else if (queryType === 'ICS') {
        // Para ICS, extraer RTN
        const rtn = params.rtn || params.RTN || params.numeroRtn || 'N/A';
        
        specificParams = {
          'No.': index + 1,
          'RTN': rtn,
          'Fecha y Hora': new Date(log.createdAt).toLocaleString('es-HN', {
            year: 'numeric',
            month: '2-digit',
            day: '2-digit',
            hour: '2-digit',
            minute: '2-digit',
            second: '2-digit'
          }),
          'Resultado': log.resultado,
          'Usuario': log.username || 'N/A',
          'Ubicación': log.userLocation || 'N/A',
          'Tipo Consulta': log.consultaType || 'N/A',
          'Subtipo': log.consultaSubtype || 'N/A',
          'IP': log.ip || 'N/A'
        };
      } else if (queryType === 'DNI') {
        // Para DNI, extraer número de identidad
        const dni = params.dni || params.DNI || params.numeroIdentidad || params.identidad || 'N/A';
        
        specificParams = {
          'No.': index + 1,
          'DNI/Identidad': dni,
          'Fecha y Hora': new Date(log.createdAt).toLocaleString('es-HN', {
            year: 'numeric',
            month: '2-digit',
            day: '2-digit',
            hour: '2-digit',
            minute: '2-digit',
            second: '2-digit'
          }),
          'Resultado': log.resultado,
          'Usuario': log.username || 'N/A',
          'Ubicación': log.userLocation || 'N/A',
          'Tipo Consulta': log.consultaType || 'N/A',
          'Subtipo': log.consultaSubtype || 'N/A',
          'IP': log.ip || 'N/A'
        };
      } else {
        // Para otros tipos, incluir información general
        specificParams = {
          'No.': index + 1,
          'Parámetros': JSON.stringify(params),
          'Fecha y Hora': new Date(log.createdAt).toLocaleString('es-HN', {
            year: 'numeric',
            month: '2-digit',
            day: '2-digit',
            hour: '2-digit',
            minute: '2-digit',
            second: '2-digit'
          }),
          'Resultado': log.resultado,
          'Usuario': log.username || 'N/A',
          'Ubicación': log.userLocation || 'N/A',
          'Tipo Consulta': log.consultaType || 'N/A',
          'Subtipo': log.consultaSubtype || 'N/A',
          'IP': log.ip || 'N/A'
        };
      }

      return specificParams;
    });
  }
}