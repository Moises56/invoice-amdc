import { Component, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { AlertController } from '@ionic/angular';
import {
  IonContent, IonHeader, IonTitle, IonToolbar, IonButton, IonIcon,
  IonCard, IonCardContent, IonGrid, IonRow, IonCol, IonChip, 
  IonRefresher, IonRefresherContent, IonButtons, IonMenuButton,
  IonModal, IonList, IonItem, IonLabel, IonTextarea, IonBadge,
  IonSpinner, IonCardHeader, IonCardTitle, IonCardSubtitle
} from '@ionic/angular/standalone';
import { AuditoriaService } from '../auditoria.service';
import { AuditStats, AuditLog } from '../../../shared/interfaces';
import { addIcons } from 'ionicons';
import { 
  statsChartOutline, documentTextOutline, peopleOutline, 
  timeOutline, eyeOutline, refreshOutline, trendingUpOutline,
  warningOutline, checkmarkCircleOutline, alertCircleOutline, personCircleOutline, logInOutline, keyOutline, flaskOutline, flashOutline, calendarOutline, shieldCheckmarkOutline, gridOutline, listOutline, analyticsOutline, downloadOutline, close, chevronBackOutline, chevronForwardOutline } from 'ionicons/icons';

@Component({
  selector: 'app-auditoria-dashboard',
  templateUrl: './auditoria-dashboard.page.html',
  styleUrl: './auditoria-dashboard.page.scss',
  standalone: true,
  imports: [
    CommonModule,
    IonContent, IonHeader, IonTitle, IonToolbar, IonButton, IonIcon,
    IonCard, IonCardContent, IonChip, IonRefresher, IonRefresherContent,
    IonButtons, IonMenuButton, IonModal, IonSpinner, IonCardHeader, 
    IonCardTitle, IonCardSubtitle
  ]
})
export class AuditoriaDashboardPage implements OnInit {

  stats = signal<any>(null);
  recentActivity = signal<AuditLog[]>([]);
  filteredLogs = signal<AuditLog[]>([]);
  isLoading = signal(true);
  error = signal<string | null>(null);
  
  // Estados para el modal de detalles
  isModalOpen = signal(false);
  selectedLog = signal<any>(null);
  isLoadingLogDetail = signal(false);

  // Estados para filtros y paginación
  filters = signal({
    userId: '',
    action: '',
    startDate: '',
    endDate: ''
  });
  
  pagination = signal({
    currentPage: 1,
    itemsPerPage: 15,
    totalItems: 0,
    totalPages: 0,
    startIndex: 0,
    endIndex: 0
  });

  constructor(
    private auditoriaService: AuditoriaService,
    private router: Router,
    private alertController: AlertController
  ) {
    addIcons({alertCircleOutline,refreshOutline,statsChartOutline,logInOutline,eyeOutline,keyOutline,flaskOutline,peopleOutline,timeOutline,documentTextOutline,chevronBackOutline,chevronForwardOutline,flashOutline,listOutline,analyticsOutline,downloadOutline,close,calendarOutline,shieldCheckmarkOutline,gridOutline,trendingUpOutline,personCircleOutline,warningOutline,checkmarkCircleOutline});
  }

  ngOnInit() {
    console.log('🚀 AuditoriaDashboardPage ngOnInit iniciado');
    this.loadDashboardData();
  }

  async loadDashboardData() {
    console.log('🔄 loadDashboardData iniciado');
    this.isLoading.set(true);
    this.error.set(null);

    try {
      console.log('🔄 Cargando datos reales del backend...');

      // Cargar estadísticas reales del backend
      this.auditoriaService.getStats().subscribe({
        next: (response: any) => {
          console.log('✅ Estadísticas cargadas exitosamente:', response);
          this.stats.set(response);
          this.isLoading.set(false);
        },
        error: (error: any) => {
          console.error('❌ Error cargando estadísticas:', error);
          this.error.set('Error al cargar estadísticas');
          this.isLoading.set(false);
        }
      });

      // Cargar TODOS los logs disponibles (no solo 5)
      this.auditoriaService.getLogs(50).subscribe({
        next: (response: any) => {
          console.log('✅ Logs completos cargados:', response);
          if (response && response.logs) {
            this.recentActivity.set(response.logs);
            this.filteredLogs.set(response.logs);
            this.updatePagination();
            console.log('📊 Total logs set:', response.logs.length);
          } else if (response && response.data) {
            this.recentActivity.set(response.data);
            this.filteredLogs.set(response.data);
            this.updatePagination();
            console.log('📊 Total logs set (data):', response.data.length);
          } else {
            console.log('⚠️ Response formato desconocido:', response);
            this.recentActivity.set([]);
            this.filteredLogs.set([]);
          }
        },
        error: (error: any) => {
          console.error('❌ Error cargando logs:', error);
          this.recentActivity.set([]);
        }
      });

    } catch (error: any) {
      console.error('💥 Error en loadDashboardData:', error);
      this.error.set('Error al cargar los datos del dashboard');
      this.isLoading.set(false);
    }
  }

  /**
   * Función para testear todos los endpoints de auditoría
   */
  testAllEndpoints() {
    console.log('🔍 Iniciando prueba de todos los endpoints...');

    // 1. Probar endpoint de logs
    console.log('📋 Probando GET /api/audit/logs...');
    this.auditoriaService.getLogs(5).subscribe({
      next: (response: any) => console.log('✅ Logs:', response),
      error: (error: any) => console.error('❌ Error en logs:', error)
    });

    // 2. Probar endpoint de estadísticas
    console.log('📊 Probando GET /api/audit/stats...');
    this.auditoriaService.getStats().subscribe({
      next: (response: any) => console.log('✅ Stats:', response),
      error: (error: any) => console.error('❌ Error en stats:', error)
    });

    // 3. Probar endpoint de actividad reciente
    console.log('🕒 Probando GET /api/audit/recent...');
    this.auditoriaService.getRecentActivity(3).subscribe({
      next: (response: any) => console.log('✅ Recent:', response),
      error: (error: any) => console.error('❌ Error en recent:', error)
    });

    // 4. Probar endpoint de logs por usuario
    console.log('👤 Probando GET /api/audit/users/:userId...');
    this.auditoriaService.getUserLogs('1', 3).subscribe({
      next: (response: any) => console.log('✅ User logs:', response),
      error: (error: any) => console.error('❌ Error en user logs:', error)
    });

    // 5. Probar endpoint de log específico
    console.log('🔍 Probando GET /api/audit/logs/:id...');
    this.auditoriaService.getLogDetails('1').subscribe({
      next: (response: any) => console.log('✅ Log detail:', response),
      error: (error: any) => console.error('❌ Error en log detail:', error)
    });

    // 6. Probar endpoint de estadísticas de operaciones
    console.log('📈 Probando estadísticas de operaciones...');
    this.auditoriaService.getOperationStats().subscribe({
      next: (response: any) => console.log('✅ Operation stats:', response),
      error: (error: any) => console.error('❌ Error en operation stats:', error)
    });

    console.log('🏁 Prueba de endpoints completada. Revisa la consola para ver los resultados.');
  }

  private getMockRecentLogs(): AuditLog[] {
    const now = new Date();
    return [
      {
        id: '1',
        accion: 'CREATE',
        tabla: 'facturas',
        registro_id: 'FAC-001',
        datos_anteriores: undefined,
        datos_nuevos: { numero_factura: 'FAC-001', monto: 150.00 },
        ip_address: '192.168.1.100',
        user_agent: 'Mozilla/5.0...',
        userId: '1',
        user: {
          id: '1',
          username: 'jperez',
          nombre: 'Juan',
          apellido: 'Pérez',
          correo: 'juan@example.com',
          role: 'USER' as any,
          dni: '12345678',
          isActive: true,
          createdAt: new Date(),
          updatedAt: new Date()
        },
        createdAt: new Date(now.getTime() - 5 * 60000)
      },
      {
        id: '2',
        accion: 'UPDATE',
        tabla: 'usuarios',
        registro_id: '2',
        datos_anteriores: { isActive: false },
        datos_nuevos: { isActive: true },
        ip_address: '192.168.1.101',
        user_agent: 'Mozilla/5.0...',
        userId: '1',
        user: {
          id: '1',
          username: 'jperez',
          nombre: 'Juan',
          apellido: 'Pérez',
          correo: 'juan@example.com',
          role: 'ADMIN' as any,
          dni: '12345678',
          isActive: true,
          createdAt: new Date(),
          updatedAt: new Date()
        },
        createdAt: new Date(now.getTime() - 15 * 60000)
      },
      {
        id: '3',
        accion: 'DELETE',
        tabla: 'locales',
        registro_id: '12',
        datos_anteriores: { nombre: 'Local Cerrado', numero: '12A' },
        datos_nuevos: undefined,
        ip_address: '192.168.1.102',
        user_agent: 'Mozilla/5.0...',
        userId: '2',
        user: {
          id: '2',
          username: 'mgarcia',
          nombre: 'María',
          apellido: 'García',
          correo: 'maria@example.com',
          role: 'ADMIN' as any,
          dni: '87654321',
          isActive: true,
          createdAt: new Date(),
          updatedAt: new Date()
        },
        createdAt: new Date(now.getTime() - 30 * 60000)
      }
    ];
  }

  async doRefresh(event: any) {
    await this.loadDashboardData();
    event.target.complete();
  }

  navigateToLogs() {
    // Navegar a la página de auditoría completa
    console.log('📄 Navegando a la página de auditoría...');
    this.router.navigate(['/auditoria']);
  }

  navigateToStats() {
    // Mostrar estadísticas detalladas
    console.log('📊 Mostrando estadísticas detalladas...');
    this.showStatsModal();
  }

  navigateToLogDetail(logId: string) {
    // Abrir modal con detalles del log específico
    console.log('🔍 Cargando detalles del log:', logId);
    this.isModalOpen.set(true);
    this.loadLogDetails(logId);
  }

  navigateToUserLogs(userId: string) {
    // Mostrar logs del usuario específico
    console.log('👤 Cargando logs del usuario:', userId);
    this.loadUserLogs(userId);
  }

  // Nuevas funciones para modales y detalles
  async showAllLogsModal() {
    const totalLogs = this.recentActivity().length;
    const logs = this.recentActivity().slice(0, 10); // Mostrar solo 10 más recientes
    
    const logList = logs.map(log => 
      `• ${log.accion} por ${log.user?.nombre || 'Usuario'} - ${this.formatDateTime(log.createdAt)}`
    ).join('\n');
    
    const alert = await this.alertController.create({
      header: '📄 Todos los Logs de Auditoría',
      subHeader: `Total: ${totalLogs} registros`,
      message: `Últimos 10 registros:\n\n${logList}`,
      buttons: [
        {
          text: 'Ver Detalles',
          handler: () => {
            this.navigateToLogs();
          }
        },
        {
          text: 'Cerrar',
          role: 'cancel'
        }
      ]
    });
    
    await alert.present();
  }

  async showStatsModal() {
    const stats = this.stats();
    if (!stats) {
      const alert = await this.alertController.create({
        header: 'Error',
        message: 'No hay estadísticas disponibles',
        buttons: ['OK']
      });
      await alert.present();
      return;
    }
    
    const message = `📋 Total de Logs: ${stats.total_logs}\n` +
      `📅 Logs de Hoy: ${stats.logs_today}\n\n` +
      `🔐 Por Acción:\n` +
      `• LOGIN: ${stats.logs_by_action?.LOGIN || 0}\n` +
      `• VIEW_STATISTICS: ${stats.logs_by_action?.VIEW_STATISTICS || 0}\n` +
      `• RESET_PASSWORD: ${stats.logs_by_action?.RESET_PASSWORD || 0}\n` +
      `• TEST_POSTMAN: ${stats.logs_by_action?.TEST_POSTMAN || 0}\n\n` +
      `📊 Por Tabla:\n` +
      `• Auth: ${stats.logs_by_table?.auth || 0}\n` +
      `• Dashboard: ${stats.logs_by_table?.dashboard || 0}\n` +
      `• Users: ${stats.logs_by_table?.users || 0}`;
    
    const alert = await this.alertController.create({
      header: '📊 Estadísticas Detalladas',
      message: message,
      buttons: ['Cerrar']
    });
    
    await alert.present();
  }

  async showActiveUsersModal() {
    const logs = this.recentActivity();
    if (logs.length === 0) {
      const alert = await this.alertController.create({
        header: '👥 Usuarios Activos',
        message: 'No hay datos de usuarios disponibles',
        buttons: ['OK']
      });
      await alert.present();
      return;
    }

    // Agrupar logs por usuario
    const userActivity = logs.reduce((acc: any, log) => {
      const userId = log.userId;
      const userName = log.user?.nombre || 'Usuario Desconocido';
      const userEmail = log.user?.correo || 'No disponible';
      
      if (!acc[userId]) {
        acc[userId] = {
          userId,
          userName,
          userEmail,
          count: 0,
          lastAction: log.createdAt,
          actions: []
        };
      }
      
      acc[userId].count++;
      acc[userId].actions.push(log.accion);
      
      return acc;
    }, {});

    // Convertir a array y ordenar por actividad
    const activeUsers = Object.values(userActivity)
      .sort((a: any, b: any) => b.count - a.count)
      .slice(0, 5); // Top 5 usuarios más activos

    const userList = activeUsers.map((user: any) => 
      `👤 ${user.userName}\n📧 ${user.userEmail}\n📊 ${user.count} acciones\n`
    ).join('\n');

    const alert = await this.alertController.create({
      header: '👥 Top 5 Usuarios Más Activos',
      message: userList || 'No hay usuarios activos',
      buttons: [
        {
          text: 'Ver Detalles Completos',
          handler: () => {
            // Mostrar en consola los detalles completos
            console.log('👥 Usuarios Activos Detallados:', activeUsers);
            console.log('Revisa la consola para ver los detalles completos de los usuarios activos');
          }
        },
        {
          text: 'Cerrar',
          role: 'cancel'
        }
      ]
    });
    
    await alert.present();
  }

  loadLogDetails(logId: string) {
    this.isLoadingLogDetail.set(true);
    this.auditoriaService.getLogDetails(logId).subscribe({
      next: (response: any) => {
        console.log('✅ Detalles del log cargados:', response);
        this.selectedLog.set(response);
        this.isModalOpen.set(true);
        this.isLoadingLogDetail.set(false);
      },
      error: (error: any) => {
        console.error('❌ Error cargando detalles del log:', error);
        this.isLoadingLogDetail.set(false);
        alert('Error al cargar los detalles del log');
      }
    });
  }

  loadUserLogs(userId: string) {
    this.auditoriaService.getUserLogs(userId, 20).subscribe({
      next: (response: any) => {
        console.log('✅ Logs del usuario cargados:', response);
        const userLogs = response.data || [];
        const user = userLogs[0]?.user;
        const userName = user ? `${user.nombre} ${user.apellido}` : 'Usuario';
        alert(`👤 LOGS DE ${userName.toUpperCase()}\n\nTotal de logs: ${userLogs.length}\n\nLos logs se han cargado en la consola para revisión.`);
      },
      error: (error: any) => {
        console.error('❌ Error cargando logs del usuario:', error);
        alert('Error al cargar los logs del usuario');
      }
    });
  }

  getOperationIcon(operation: string): string {
    switch (operation.toUpperCase()) {
      case 'CREATE':
        return 'checkmark-circle-outline';
      case 'UPDATE':
        return 'refresh-outline';
      case 'DELETE':
        return 'warning-outline';
      case 'READ':
        return 'eye-outline';
      default:
        return 'document-text-outline';
    }
  }

  getOperationColor(operation: string): string {
    switch (operation.toUpperCase()) {
      case 'CREATE':
        return 'success';
      case 'UPDATE':
        return 'primary';
      case 'DELETE':
        return 'danger';
      case 'READ':
        return 'medium';
      default:
        return 'medium';
    }
  }

  formatDateTime(date: Date): string {
    return new Date(date).toLocaleString('es-ES', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  }

  getTotalOperations(): number {
    const currentStats = this.stats();
    if (!currentStats) return 0;
    
    const operations = currentStats.operationCounts || currentStats.logs_by_action;
    if (!operations) return 0;
    
    return Object.values(operations).reduce((total: number, count: any) => total + (Number(count) || 0), 0);
  }

  getOperationPercentage(operation: string): number {
    const currentStats = this.stats();
    if (!currentStats) return 0;
    
    const total = this.getTotalOperations();
    const operations = currentStats.operationCounts || currentStats.logs_by_action;
    const count = operations?.[operation];
    
    return total > 0 ? Math.round(((Number(count) || 0) / total) * 100) : 0;
  }

  getOperationCount(operation: string): number {
    const currentStats = this.stats();
    if (!currentStats) return 0;
    
    // Manejar ambos formatos: operationCounts (segunda interfaz) y logs_by_action (primera interfaz)
    const operations = currentStats.operationCounts || currentStats.logs_by_action;
    if (!operations) return 0;
    
    return operations[operation] || 0;
  }

  getTableCount(table: string): number {
    const currentStats = this.stats();
    if (!currentStats) return 0;
    
    const tables = currentStats.logs_by_table;
    if (!tables) return 0;
    
    return tables[table] || 0;
  }

  trackByUserId(index: number, item: any): string {
    return item.userId;
  }

  trackByLogId(index: number, item: AuditLog): string {
    return item.id;
  }

  getActionIcon(action: string): string {
    switch (action?.toUpperCase()) {
      case 'LOGIN':
        return 'log-in-outline';
      case 'LOGOUT':
        return 'log-out-outline';
      case 'VIEW_STATISTICS':
        return 'eye-outline';
      case 'RESET_PASSWORD':
        return 'key-outline';
      case 'TEST_POSTMAN':
        return 'flask-outline';
      case 'CREATE':
        return 'add-circle-outline';
      case 'UPDATE':
        return 'create-outline';
      case 'DELETE':
        return 'trash-outline';
      default:
        return 'document-text-outline';
    }
  }

  getActionColorClass(action: string): string {
    switch (action?.toUpperCase()) {
      case 'LOGIN':
        return 'bg-blue-500';
      case 'LOGOUT':
        return 'bg-gray-500';
      case 'VIEW_STATISTICS':
        return 'bg-green-500';
      case 'RESET_PASSWORD':
        return 'bg-yellow-500';
      case 'TEST_POSTMAN':
        return 'bg-purple-500';
      case 'CREATE':
        return 'bg-emerald-500';
      case 'UPDATE':
        return 'bg-orange-500';
      case 'DELETE':
        return 'bg-red-500';
      default:
        return 'bg-gray-400';
    }
  }

  getActionClass(action: string): string {
    switch (action?.toUpperCase()) {
      case 'LOGIN':
        return 'login';
      case 'VIEW_STATISTICS':
        return 'view';
      case 'RESET_PASSWORD':
        return 'reset';
      case 'TEST_POSTMAN':
        return 'test';
      default:
        return 'login';
    }
  }

  // Modal functions
  closeModal() {
    this.isModalOpen.set(false);
    this.selectedLog.set(null);
    this.isLoadingLogDetail.set(false);
  }

  // Helper functions
  getTodayLogsCount(): number {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    return this.recentActivity().filter(log => {
      const logDate = new Date(log.createdAt);
      logDate.setHours(0, 0, 0, 0);
      return logDate.getTime() === today.getTime();
    }).length;
  }

  getUserInitials(name: string): string {
    if (!name) return 'U';
    return name.split(' ').map(n => n.charAt(0)).join('').substring(0, 2).toUpperCase();
  }

  getActionDescription(action: string, table: string): string {
    switch (action?.toUpperCase()) {
      case 'LOGIN':
        return 'Inicio de sesión exitoso';
      case 'LOGOUT':
        return 'Cierre de sesión';
      case 'VIEW_STATISTICS':
        return 'Consulta de estadísticas';
      case 'RESET_PASSWORD':
        return 'Restablecimiento de contraseña';
      case 'TEST_POSTMAN':
        return 'Prueba de API';
      case 'CREATE':
        return `Creación en ${table}`;
      case 'UPDATE':
        return `Actualización en ${table}`;
      case 'DELETE':
        return `Eliminación en ${table}`;
      default:
        return `Acción en ${table}`;
    }
  }

  Math = Math; // Exponer Math para el template

  // Funciones de filtros y paginación
  updatePagination() {
    const filtered = this.filteredLogs();
    const totalItems = filtered.length;
    const itemsPerPage = this.pagination().itemsPerPage;
    const currentPage = this.pagination().currentPage;
    const startIndex = (currentPage - 1) * itemsPerPage;
    const endIndex = Math.min(startIndex + itemsPerPage, totalItems);
    
    this.pagination.set({
      ...this.pagination(),
      totalItems: totalItems,
      totalPages: Math.ceil(totalItems / itemsPerPage),
      startIndex: startIndex,
      endIndex: endIndex
    });
  }

  applyFilters() {
    const allLogs = this.recentActivity();
    const filters = this.filters();
    
    let filtered = allLogs.filter(log => {
      // Filtro por usuario
      if (filters.userId && !log.user?.nombre?.toLowerCase().includes(filters.userId.toLowerCase())) {
        return false;
      }
      
      // Filtro por acción
      if (filters.action && filters.action !== 'all' && log.accion !== filters.action) {
        return false;
      }
      
      // Filtro por fecha de inicio
      if (filters.startDate) {
        const logDate = new Date(log.createdAt);
        const startDate = new Date(filters.startDate);
        if (logDate < startDate) return false;
      }
      
      // Filtro por fecha de fin
      if (filters.endDate) {
        const logDate = new Date(log.createdAt);
        const endDate = new Date(filters.endDate);
        endDate.setHours(23, 59, 59, 999); // Incluir todo el día
        if (logDate > endDate) return false;
      }
      
      return true;
    });
    
    this.filteredLogs.set(filtered);
    this.pagination.set({ ...this.pagination(), currentPage: 1 });
    this.updatePagination();
  }

  onFilterChange(field: string, value: string) {
    this.filters.set({
      ...this.filters(),
      [field]: value
    });
    this.applyFilters();
  }

  resetFilters() {
    this.filters.set({
      userId: '',
      action: '',
      startDate: '',
      endDate: ''
    });
    this.filteredLogs.set(this.recentActivity());
    this.pagination.set({ ...this.pagination(), currentPage: 1 });
    this.updatePagination();
  }

  getPaginatedLogs() {
    const filtered = this.filteredLogs();
    const pagination = this.pagination();
    const startIndex = (pagination.currentPage - 1) * pagination.itemsPerPage;
    const endIndex = startIndex + pagination.itemsPerPage;
    
    return filtered.slice(startIndex, endIndex);
  }

  goToPage(page: number) {
    const pagination = this.pagination();
    if (page >= 1 && page <= pagination.totalPages) {
      this.pagination.set({ ...pagination, currentPage: page });
      this.updatePagination();
    }
  }

  getPageNumbers(): number[] {
    const pagination = this.pagination();
    const pages: number[] = [];
    const maxVisiblePages = 5;
    
    let startPage = Math.max(1, pagination.currentPage - Math.floor(maxVisiblePages / 2));
    let endPage = Math.min(pagination.totalPages, startPage + maxVisiblePages - 1);
    
    // Ajustar el inicio si no hay suficientes páginas al final
    if (endPage - startPage < maxVisiblePages - 1) {
      startPage = Math.max(1, endPage - maxVisiblePages + 1);
    }
    
    for (let i = startPage; i <= endPage; i++) {
      pages.push(i);
    }
    
    return pages;
  }

  getUniqueActions() {
    const actions = this.recentActivity().map(log => log.accion);
    return [...new Set(actions)];
  }

  formatJsonData(data: any): string {
    if (!data) return 'No disponible';
    
    try {
      if (typeof data === 'string') {
        // Intentar parsear si es un string JSON
        const parsed = JSON.parse(data);
        return JSON.stringify(parsed, null, 2);
      } else {
        return JSON.stringify(data, null, 2);
      }
    } catch (error) {
      // Si no se puede parsear, devolver como string
      return typeof data === 'string' ? data : JSON.stringify(data, null, 2);
    }
  }

  formatDetailedDateTime(date: Date): string {
    return new Date(date).toLocaleString('es-ES', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit'
    });
  }

  getTimestamp(date: Date): number {
    return new Date(date).getTime();
  }
}
