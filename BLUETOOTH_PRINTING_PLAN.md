# Plan de Implementación: Impresión de Facturas por Bluetooth

## 1. Visión General

El objetivo es integrar la funcionalidad de impresión de facturas a través de impresoras térmicas Bluetooth. El flujo de usuario completo será:

1.  **Configuración Inicial**: El usuario accede a una sección de configuración donde puede escanear, seleccionar y guardar una impresora Bluetooth como predeterminada.
2.  **Generación de Factura**: Al completar la creación de una factura, la aplicación genera el formato de impresión.
3.  **Impresión**: La aplicación se conecta automáticamente a la impresora predeterminada e imprime la factura.

Para lograr esto, se utilizará un plugin de Capacitor/Cordova que permita la comunicación con el hardware Bluetooth del dispositivo.

---

## 2. Módulos y Componentes Involucrados

La funcionalidad se centralizará en el módulo `bluetooth`, que ya existe en la estructura del proyecto.

### a. Módulo `Bluetooth` (`src/app/features/bluetooth/`)

Este módulo será el encargado de toda la lógica de gestión de impresoras.

*   **Rutas (`bluetooth.routes.ts`)**:
    *   `/bluetooth/settings`: Ruta principal para la configuración de la impresora.

*   **Componentes**:
    *   **`BluetoothSettingsPage` (`bluetooth-settings/`)**:
        *   **Responsabilidad**: Orquestar el proceso de configuración. Será un componente "Smart".
        *   **UI**: Mostrará el estado actual de la conexión (ej. "No hay impresora conectada"), el nombre de la impresora guardada (si existe) y un botón para "Buscar y seleccionar impresora".
    *   **`DeviceListPage` (`device-list/`)**:
        *   **Responsabilidad**: Mostrar la lista de dispositivos Bluetooth descubiertos durante el escaneo.
        *   **UI**: Será un modal o una página que muestra una lista de dispositivos con su nombre y dirección MAC. Cada elemento de la lista será seleccionable. Incluirá un `ion-spinner` mientras busca dispositivos y un botón para reintentar el escaneo.
    *   **`PrinterConfigComponent` (`printer-config/`)**:
        *   **Responsabilidad**: Podría usarse para configuraciones avanzadas de la impresora (calidad de impresión, tipo de papel, etc.), si se requiere en el futuro. Para la fase inicial, puede no ser necesario.

### b. Módulo `Facturas` (`src/app/features/facturas/`)

Este módulo deberá interactuar con el servicio de Bluetooth para iniciar la impresión.

*   **Componente `FacturaDetailComponent` o similar**:
    *   **Responsabilidad**: Después de generar una factura exitosamente, este componente llamará al servicio de impresión.
    *   **UI**: Añadir un botón de "Imprimir" que permita reimprimir una factura ya creada. Mostrar notificaciones al usuario sobre el estado de la impresión (ej. "Imprimiendo...", "Factura impresa correctamente", "Error al conectar con la impresora").

---

## 3. Lógica de Servicios

La lógica de negocio se encapsulará en servicios para mantener los componentes limpios.

### a. `BluetoothService` (`src/app/features/bluetooth/bluetooth.service.ts`)

Este servicio centralizará toda la interacción con el plugin de Bluetooth.

*   **Métodos Principales**:
    *   `scanForDevices()`: Inicia el escaneo de dispositivos Bluetooth. Devuelve un `Observable` con la lista de dispositivos encontrados.
    *   `connect(address: string)`: Intenta conectarse a un dispositivo por su dirección MAC. Devuelve una promesa o un `Observable` que resuelve si la conexión es exitosa.
    *   `disconnect()`: Cierra la conexión activa.
    *   `print(data: string)`: Envía los datos formateados a la impresora conectada.
    *   `saveDefaultPrinter(device: BluetoothDevice)`: Guarda la información de la impresora seleccionada (nombre y dirección MAC) en el almacenamiento local (`localStorage` o `Ionic Storage`).
    *   `getDefaultPrinter()`: Obtiene la impresora guardada del almacenamiento.
    *   `checkConnectionStatus()`: Verifica si hay una conexión activa con la impresora.

### b. `PrintingService` (`src/app/shared/services/printing.service.ts`)

Este servicio se encargará de formatear los datos de la factura para que la impresora térmica pueda interpretarlos.

*   **Responsabilidad**: Convertir un objeto de factura (JSON) en un string o un buffer de bytes con comandos de impresora (como ESC/POS, el estándar de facto para impresoras térmicas).
*   **Métodos**:
    *   `formatInvoiceForPrinting(invoice: Invoice): string`: Toma los datos de la factura y genera el texto formateado, incluyendo el logo (si es posible), encabezados, ítems, totales y pie de página. Este método contendrá la lógica para añadir negritas, saltos de línea y cortes de papel usando los comandos adecuados.

---

## 4. Plan de Ejecución (Pasos)

1.  **Selección e Instalación del Plugin**:
    *   **Investigar**: Evaluar plugins de Capacitor/Cordova para Bluetooth Serial. Una opción popular y probada es `cordova-plugin-bluetooth-serial`.
    *   **Instalar**: Añadir el plugin al proyecto.
        ```bash
        npm install cordova-plugin-bluetooth-serial
        npm install @awesome-cordova-plugins/bluetooth-serial
        ionic cap sync
        ```

2.  **Desarrollo del `BluetoothService`**:
    *   Implementar los métodos descritos anteriormente, encapsulando las llamadas al plugin.
    *   Manejar los permisos de Bluetooth (Android requiere permisos explícitos que el plugin debería gestionar).

3.  **Desarrollo de la UI de Configuración**:
    *   Crear la página `BluetoothSettingsPage` para iniciar el proceso.
    *   Implementar el modal `DeviceListPage` que muestra los resultados del escaneo y permite al usuario seleccionar un dispositivo.
    *   Al seleccionar un dispositivo, guardarlo como predeterminado usando el `BluetoothService`.

4.  **Desarrollo del `PrintingService`**:
    *   Crear la lógica para formatear la factura. Esto puede requerir investigación sobre los comandos ESC/POS. Se pueden crear helpers para comandos comunes (ej. `boldOn()`, `cutPaper()`).

5.  **Integración con el Módulo de Facturas**:
    *   Inyectar el `BluetoothService` y el `PrintingService` en el componente de facturas.
    *   Tras generar una factura, llamar a `printingService.formatInvoiceForPrinting()`.
    *   Luego, pasar el resultado a `bluetoothService.print()`.
    *   Gestionar el flujo completo: obtener impresora guardada, conectar, imprimir y desconectar.

6.  **Manejo de Errores y Notificaciones**:
    *   Implementar un sistema robusto de notificaciones (`ion-toast`) para informar al usuario si el Bluetooth está desactivado, si no se puede conectar a la impresora, o si la impresión falla.
    *   Proveer mensajes de error claros y acciones sugeridas (ej. "No se pudo conectar. Verifique que la impresora esté encendida y al alcance.").

---

## 5. Consideraciones Adicionales

*   **Plataformas**: La funcionalidad de Bluetooth es principalmente para **dispositivos móviles (iOS/Android)**. Se debe controlar que estas funciones no se ejecuten en un navegador web, o mostrar un mensaje indicando que no están disponibles.
*   **Permisos**: La aplicación deberá solicitar permisos de Bluetooth y, en versiones recientes de Android, de localización para poder escanear dispositivos.
*   **Pruebas**: Esta funcionalidad **solo puede ser probada en un dispositivo físico real**, ya que los emuladores no suelen tener soporte para hardware Bluetooth.
