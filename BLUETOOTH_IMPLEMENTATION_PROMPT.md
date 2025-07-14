# Prompt para IA: Implementación de Impresión de Facturas por Bluetooth en Ionic/Angular

## Contexto del Proyecto

Estás trabajando en una aplicación existente desarrollada con **Ionic y Angular**. La estructura del proyecto sigue las mejores prácticas, con módulos para `core`, `features` y `shared`. El objetivo es añadir una nueva funcionalidad para imprimir facturas en una impresora térmica a través de Bluetooth.

El plan de implementación ya ha sido definido. Tu tarea es generar todo el código necesario para llevar a cabo este plan de manera detallada y robusta.

## Objetivo Principal

Implementar un flujo completo para la impresión de facturas por Bluetooth, que incluye:
1.  **Configuración**: Escanear, seleccionar y guardar una impresora Bluetooth.
2.  **Formateo**: Preparar los datos de la factura para una impresora térmica.
3.  **Impresión**: Enviar los datos a la impresora seleccionada.

---

## Requisitos Técnicos

*   **Frameworks**: Ionic, Angular.
*   **Plugin Bluetooth**: Utiliza `cordova-plugin-bluetooth-serial` y su wrapper `@awesome-cordova-plugins/bluetooth-serial`.
*   **Gestión de Estado**: La lógica debe estar encapsulada en servicios inyectables.
*   **UI**: Utiliza componentes de Ionic para la interfaz de usuario (`ion-list`, `ion-item`, `ion-button`, `ion-modal`, `ion-toast`, `ion-spinner`).
*   **Tipado**: Usa TypeScript de forma estricta. Define interfaces para los objetos de datos (ej. `BluetoothDevice`, `Invoice`).
*   **Asincronía**: Utiliza `async/await` y `Observables` de RxJS para manejar las operaciones asíncronas.

---

## Tareas Detalladas a Realizar

### Tarea 1: Instalación y Configuración de Plugins

1.  Asegúrate de que los siguientes paquetes estén en `package.json` y ejecútalos si es necesario:
    ```bash
    npm install cordova-plugin-bluetooth-serial
    npm install @awesome-cordova-plugins/bluetooth-serial
    ```
2.  Añade `BluetoothSerial` a los `providers` del módulo correspondiente o en `app.config.ts` si usas standalone components.

### Tarea 2: Crear el `BluetoothService`

Crea el archivo `src/app/features/bluetooth/bluetooth.service.ts`. Este servicio debe centralizar toda la comunicación con el plugin de Bluetooth.

*   **Propiedades**:
    *   Una variable para mantener el estado de la conexión.
*   **Métodos**:
    *   `scanForDevices(): Observable<BluetoothDevice[]>`: Escanea los dispositivos Bluetooth no emparejados. Maneja los errores si el Bluetooth está desactivado.
    *   `connect(address: string): Observable<void>`: Se conecta a un dispositivo por su dirección MAC.
    *   `disconnect(): Promise<void>`: Se desconecta del dispositivo.
    *   `print(data: string): Promise<void>`: Envía una cadena de texto a la impresora conectada.
    *   `saveDefaultPrinter(device: BluetoothDevice): Promise<void>`: Guarda el dispositivo en `Ionic Storage` (o `localStorage` como alternativa).
    *   `getDefaultPrinter(): Promise<BluetoothDevice | null>`: Recupera el dispositivo guardado.
    *   `checkConnectionStatus(): Observable<boolean>`: Emite el estado de la conexión.

### Tarea 3: Crear el `PrintingService`

Crea el archivo `src/app/shared/services/printing.service.ts`. Este servicio formateará los datos de la factura.

*   **Métodos**:
    *   `formatInvoiceForPrinting(invoice: Invoice): string`:
        *   Recibe un objeto `Invoice` (debes definir su interfaz).
        *   Genera un string con formato para impresora térmica, utilizando comandos **ESC/POS**.
        *   **Ejemplo de formato**:
            *   Logo de la empresa (si es posible, o el nombre).
            *   Datos del negocio.
            *   Datos de la factura (Nº, fecha).
            *   Lista de productos con precio unitario y total.
            *   Subtotal, impuestos, total.
            *   Mensaje de agradecimiento.
            *   Comando de corte de papel.
        *   Crea helpers privados para los comandos ESC/POS, como `_getBoldOn()`, `_getCutPaper()`, etc.

### Tarea 4: Desarrollar la Interfaz de Configuración

1.  **`BluetoothSettingsPage` (`src/app/features/bluetooth/bluetooth-settings/`)**:
    *   Debe mostrar la impresora guardada actualmente.
    *   Tener un botón "Buscar Impresora" que abra el modal de selección.
    *   Tener un botón para "Probar Conexión" o "Imprimir Página de Prueba".
    *   Mostrar el estado de la conexión en tiempo real.

2.  **`DeviceListPage` (Modal)**:
    *   Crea un nuevo componente que se presentará como un modal.
    *   Al abrirse, debe llamar a `bluetoothService.scanForDevices()`.
    *   Mostrar un `ion-spinner` mientras busca.
    *   Mostrar una lista de los dispositivos encontrados (`ion-list`).
    *   Al hacer clic en un dispositivo, debe cerrar el modal y devolver el dispositivo seleccionado a `BluetoothSettingsPage`, que a su vez llamará a `bluetoothService.saveDefaultPrinter()`.
    *   Manejar el caso en que no se encuentren dispositivos.

### Tarea 5: Integrar con el Flujo de Facturación

1.  En el componente donde se finaliza una factura (ej. `FacturaDetailComponent` o `FacturaFormPage`), inyecta los servicios `BluetoothService` y `PrintingService`.
2.  Añade un botón "Imprimir Factura".
3.  Al hacer clic en el botón:
    *   Muestra un `ion-loading` con el mensaje "Imprimiendo...".
    *   Llama a `bluetoothService.getDefaultPrinter()`.
    *   Si no hay impresora, muestra un `ion-toast` pidiendo al usuario que configure una.
    *   Si hay una impresora, llama a `bluetoothService.connect()`.
    *   Una vez conectado, llama a `printingService.formatInvoiceForPrinting()` con los datos de la factura.
    *   Envía el resultado a `bluetoothService.print()`.
    *   Al finalizar (éxito o error), cierra el `ion-loading` y muestra un `ion-toast` con el resultado.
    *   Asegúrate de desconectar (`bluetoothService.disconnect()`) después de imprimir para liberar la conexión.

### Tarea 6: Manejo de Errores y Permisos

*   La aplicación debe solicitar los permisos de Bluetooth en Android si aún no han sido concedidos. El plugin maneja esto, pero tu código debe reaccionar si el usuario los deniega.
*   Implementa un manejo de errores robusto para cada paso: escaneo, conexión, impresión. Usa `try...catch` para las promesas y el operador `catchError` para los observables.
*   Proporciona feedback claro al usuario en cada caso de error.

---

## Entregable Esperado

Proporciona todo el código fuente para los archivos nuevos y modificados, incluyendo:
*   `bluetooth.service.ts`
*   `printing.service.ts`
*   Los archivos `.ts`, `.html` y `.scss` para `BluetoothSettingsPage` y el modal `DeviceListPage`.
*   Las modificaciones en el módulo de facturas para integrar el botón y la lógica de impresión.
*   Las definiciones de las interfaces (`BluetoothDevice`, `Invoice`).
*   Cualquier cambio necesario en los módulos de Angular o en las rutas.
